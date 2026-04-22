import jwt from 'jsonwebtoken';
import Location from '../models/Location.js';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import Notification from '../models/Notification.js';
import { calculateDistance } from '../utils/haversine.js';
import { geocodeAddress } from '../utils/geocode.js';

// Словарь для отслеживания онлайн пользователей
const onlineUsers = new Map();

// Последняя геокодированная точка пользователя — чтобы не дёргать Nominatim на каждый 5-сек апдейт
const lastGeocode = new Map(); // userId -> { lat, lng, address }
// Последний отправленный апдейт — throttle по времени
const lastBroadcast = new Map(); // userId -> timestamp
const LOCATION_THROTTLE_MS = 3000;
const GEOCODE_MOVE_THRESHOLD_M = 80; // перегеокодировать, если сместились >80м

// Возвращает id друзей пользователя
const getFriendIds = async (userId) => {
  const friendships = await Friendship.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'accepted',
  });
  return friendships.map((f) =>
    f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString()
  );
};

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Клиент подключён: ${socket.id}`);

    // JOIN событие — аутентификация через токен (userId берём из токена, а не из payload)
    socket.on('join', async (data) => {
      try {
        const token = data?.token || socket.handshake?.auth?.token;
        if (!token) {
          socket.emit('error', { message: 'Токен отсутствует' });
          return;
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          socket.emit('error', { message: 'Некорректный токен' });
          return;
        }

        const userId = String(decoded.id);
        socket.userId = userId;
        socket.join(`user:${userId}`);
        onlineUsers.set(userId, socket.id);

        const user = await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
        if (!user) {
          socket.emit('error', { message: 'Пользователь не найден' });
          return;
        }

        // Уведомляем онлайн-друзей
        const friendIds = await getFriendIds(userId);
        const onlineFriendIds = friendIds.filter((id) => onlineUsers.has(id));

        if (onlineFriendIds.length > 0) {
          for (const friendId of onlineFriendIds) {
            io.to(`user:${friendId}`).emit('friend-online', {
              userId,
              name: user.name,
            });
          }
          // Одним пакетом — создаём уведомления
          await Promise.all(
            onlineFriendIds.map((friendId) =>
              Notification.create({ userId: friendId, type: 'online', fromUser: userId })
            )
          );
        }

        socket.emit('joined', { message: 'Подключены' });
        console.log(`Пользователь ${userId} онлайн`);
      } catch (error) {
        console.error('Ошибка JOIN события:', error);
        socket.emit('error', { message: 'Ошибка подключения' });
      }
    });

    // UPDATE-LOCATION — обновление геолокации
    socket.on('update-location', async (data) => {
      try {
        const userId = socket.userId;
        if (!userId) {
          socket.emit('error', { message: 'Пользователь не аутентифицирован' });
          return;
        }

        const { lat, lng, accuracy } = data || {};

        // Валидация координат
        if (
          typeof lat !== 'number' ||
          typeof lng !== 'number' ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 || lat > 90 ||
          lng < -180 || lng > 180
        ) {
          return;
        }

        // Throttle: не чаще раза в LOCATION_THROTTLE_MS
        const now = Date.now();
        const lastT = lastBroadcast.get(userId) || 0;
        if (now - lastT < LOCATION_THROTTLE_MS) return;
        lastBroadcast.set(userId, now);

        // Геокодирование — только если сдвинулись ощутимо, иначе переиспользуем
        const prev = lastGeocode.get(userId.toString());
        let address;
        if (prev) {
          const d = calculateDistance(prev.lat, prev.lng, lat, lng);
          const moved = d.unit === 'км' ? parseFloat(d.value) * 1000 : d.value;
          if (moved < GEOCODE_MOVE_THRESHOLD_M) {
            address = prev.address;
          }
        }
        if (!address) {
          address = await geocodeAddress(lat, lng);
          lastGeocode.set(userId.toString(), { lat, lng, address });
        }

        // Сохраняем локацию (1 запрос)
        await Location.findOneAndUpdate(
          { userId },
          { lat, lng, accuracy, address, updatedAt: new Date() },
          { upsert: true, new: true }
        );

        // Получаем отправителя и его настройки приватности один раз
        const sender = await User.findById(userId);
        if (!sender) return;

        // Синхронизируем режим призрака, если он пришел в событии
        if (typeof data.ghostMode === 'boolean') {
          sender.ghostMode = data.ghostMode;
          await sender.save();
        }

        // Если режим призрака включен — координаты не рассылаем
        const isGhost = sender.ghostMode;

        const friendIds = await getFriendIds(userId);
        if (friendIds.length === 0) return;

        // Батч-запрос локаций всех друзей
        const friendLocations = await Location.find({ userId: { $in: friendIds } });
        const locByFriend = new Map(
          friendLocations.map((l) => [l.userId.toString(), l])
        );

        // Рассылка всем друзьям + проверка "рядом"
        const nearbyToNotify = [];
        for (const friendId of friendIds) {
          const friendLoc = locByFriend.get(friendId);
          let distance = null;
          if (friendLoc) {
            distance = calculateDistance(lat, lng, friendLoc.lat, friendLoc.lng);
          }

          io.to(`user:${friendId}`).emit('friend-location-update', {
            userId,
            lat,
            lng,
            accuracy,
            address,
            ghostMode: isGhost,
            distance,
            updatedAt: new Date(),
          });

          if (!isGhost && distance && distance.unit === 'м' && distance.value < 1000) {
            nearbyToNotify.push(friendId);
          }
        }

        // Антиспам: одно уведомление "рядом" на 5 минут на пару
        if (nearbyToNotify.length > 0) {
          const fiveMinAgo = new Date(now - 5 * 60_000);
          await Promise.all(
            nearbyToNotify.map(async (friendId) => {
              const existing = await Notification.findOne({
                userId: friendId,
                type: 'nearby',
                fromUser: userId,
                createdAt: { $gte: fiveMinAgo },
              });
              if (!existing) {
                await Notification.create({ userId: friendId, type: 'nearby', fromUser: userId });
                io.to(`user:${friendId}`).emit('friend-nearby', {
                  userId,
                  name: sender.name,
                });
              }
            })
          );
        }
      } catch (error) {
        console.error('Ошибка UPDATE-LOCATION события:', error);
      }
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;
        if (!userId) return;

        onlineUsers.delete(userId);
        lastBroadcast.delete(userId);
        lastGeocode.delete(userId);

        const friendIds = await getFriendIds(userId);
        const onlineFriends = friendIds.filter((id) => onlineUsers.has(id));
        if (onlineFriends.length === 0) return;

        const user = await User.findById(userId);
        const name = user?.name || '';
        for (const friendId of onlineFriends) {
          io.to(`user:${friendId}`).emit('friend-offline', { userId, name });
        }
        console.log(`Пользователь ${userId} отключился`);
      } catch (error) {
        console.error('Ошибка DISCONNECT события:', error);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket ошибка:', error);
    });

    // CHAT
    socket.on('chat-message', async (data) => {
      try {
        const userId = socket.userId;
        const { conversationId, message, recipientId, sticker } = data || {};
        if (!userId || !recipientId || (!message?.trim() && !sticker)) {
          return;
        }
        if (message && message.length > 2000) return;

        // Только друзьям разрешаем чатиться
        const friendIds = await getFriendIds(userId);
        if (!friendIds.includes(String(recipientId))) {
          socket.emit('error', { message: 'Получатель не в друзьях' });
          return;
        }

        const sender = await User.findById(userId);
        io.to(`user:${recipientId}`).emit('receive-message', {
          conversationId,
          senderId: userId,
          senderName: sender?.name,
          senderColor: sender?.color,
          text: message,
          sticker: sticker,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Ошибка CHAT-MESSAGE события:', error);
      }
    });

    socket.on('typing', (data) => {
      try {
        const { conversationId, recipientId } = data || {};
        const userId = socket.userId;
        if (!userId || !recipientId) return;
        if (onlineUsers.has(String(recipientId))) {
          io.to(`user:${recipientId}`).emit('user-typing', {
            conversationId,
            userId,
            isTyping: true,
          });
        }
      } catch (error) {
        console.error('Ошибка TYPING события:', error);
      }
    });

    socket.on('stop-typing', (data) => {
      try {
        const { conversationId, recipientId } = data || {};
        if (!recipientId) return;
        if (onlineUsers.has(String(recipientId))) {
          io.to(`user:${recipientId}`).emit('user-typing', {
            conversationId,
            isTyping: false,
          });
        }
      } catch (error) {
        console.error('Ошибка STOP-TYPING события:', error);
      }
    });
  });
};

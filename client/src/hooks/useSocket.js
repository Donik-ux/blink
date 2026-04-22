import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore.js';
import { useLocationStore } from '../store/locationStore.js';
import { useNotificationStore } from '../store/notifStore.js';
import { useFriendStore } from '../store/friendStore.js';
import { getFriends } from '../api/friends.js';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateFriendLocation = useLocationStore((state) => state.updateFriendLocation);
  const removeFriendLocation = useLocationStore((state) => state.removeFriendLocation);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const setFriends = useFriendStore((state) => state.setFriends);
  const removeFriendFromStore = useFriendStore((state) => state.removeFriend);

  useEffect(() => {
    if (!token || !currentUser) return;

    // Same-origin: сокет идёт через Vite-proxy (ws: true) → backend:5000.
    // На телефоне страница по HTTPS, поэтому и ws автоматически wss — без mixed-content.
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });
    socketRef.current = socket;

    const sendJoin = () => {
      socket.emit('join', { token });
    };

    socket.on('connect', () => {
      setConnected(true);
      sendJoin();
    });

    // После reconnect — снова отправляем join
    socket.io.on('reconnect', sendJoin);

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        // сервер разорвал, клиенту нужно вручную поднять
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
    });

    socket.on('friend-location-update', (data) => {
      // Убеждаемся, что ID пользователя используется корректно для стора
      updateFriendLocation(data.userId, {
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        distance: data.distance,
        updatedAt: data.updatedAt,
      });
    });

    socket.on('friend-nearby', (data) => {
      addNotification({
        id: Date.now(),
        type: 'nearby',
        from: { id: data.userId, name: data.name },
        read: false,
        createdAt: new Date(),
      });
    });

    socket.on('friend-online', (data) => {
      console.log(`${data.name} онлайн`);
    });

    socket.on('friend-offline', (data) => {
      console.log(`${data.name} оффлайн`);
    });

    // Друга добавили — перезагружаем список, чтоб он сразу появился у обеих сторон
    socket.on('friend-added', async (data) => {
      try {
        const fresh = await getFriends();
        setFriends(fresh);
        if (data?.from?.name) {
          addNotification({
            id: Date.now(),
            type: 'friend_request',
            from: { id: data.from.id, name: data.from.name },
            read: false,
            createdAt: new Date(),
          });
        }
      } catch (e) {
        console.warn('friend-added refetch failed', e);
      }
    });

    socket.on('friend-removed', (data) => {
      if (data?.userId) {
        removeFriendFromStore(data.userId);
        removeFriendLocation(data.userId);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket ошибка:', error);
    });

    return () => {
      socket.io.off('reconnect', sendJoin);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUser, updateFriendLocation, removeFriendLocation, addNotification, setFriends, removeFriendFromStore]);

  return {
    socket: socketRef.current,
    connected,
  };
};

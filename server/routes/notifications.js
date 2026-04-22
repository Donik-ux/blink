import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Получить уведомления
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('fromUser', 'name email color')
      .sort({ createdAt: -1 });

    // Группировка по дате: "Сегодня", "Вчера"
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifications.forEach((notif) => {
      const notifDate = new Date(notif.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      const formattedNotif = {
        id: notif._id,
        type: notif.type,
        from: {
          id: notif.fromUser._id,
          name: notif.fromUser.name,
          color: notif.fromUser.color,
        },
        read: notif.read,
        createdAt: notif.createdAt,
      };

      if (notifDay.getTime() === today.getTime()) {
        grouped.today.push(formattedNotif);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(formattedNotif);
      } else {
        grouped.older.push(formattedNotif);
      }
    });

    // Подсчёт непрочитанных
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      notifications: grouped,
      unreadCount,
    });
  } catch (error) {
    console.error('Ошибка получения уведомлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/notifications/read-all - Отметить все как прочитанные
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: 'Все уведомления отмечены как прочитанные' });
  } catch (error) {
    console.error('Ошибка отметки уведомлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

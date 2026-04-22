import express from 'express';
import User from '../models/User.js';
import Friendship from '../models/Friendship.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/profile - Получить профиль пользователя
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Подсчёт количества друзей
    const friendsCount = await Friendship.countDocuments({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
      status: 'accepted',
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      color: user.color,
      inviteCode: user.inviteCode,
      ghostMode: user.ghostMode,
      privacyMode: user.privacyMode,
      friendsCount,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/profile - Обновить профиль
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, color, ghostMode, privacyMode } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Валидация
    if (name) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ error: 'Имя должно быть от 2 до 50 символов' });
      }
      user.name = name;
    }

    if (color) {
      const validColors = [
        '#7c3aed',
        '#db2777',
        '#d97706',
        '#059669',
        '#2563eb',
        '#dc2626',
        '#0891b2',
        '#65a30d',
        '#9333ea',
        '#ea580c',
      ];
      if (!validColors.includes(color)) {
        return res.status(400).json({ error: 'Некорректный цвет' });
      }
      user.color = color;
    }

    if (ghostMode !== undefined) {
      user.ghostMode = Boolean(ghostMode);
    }

    if (privacyMode) {
      if (!['friends', 'everyone'].includes(privacyMode)) {
        return res.status(400).json({ error: 'Некорректный режим приватности' });
      }
      user.privacyMode = privacyMode;
    }

    await user.save();

    res.json({
      message: 'Профиль обновлён',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        color: user.color,
        ghostMode: user.ghostMode,
        privacyMode: user.privacyMode,
      },
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

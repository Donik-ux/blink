import express from 'express';
import SavedLocation from '../models/SavedLocation.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET все сохранённые локации юзера
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await SavedLocation.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(locations);
  } catch (error) {
    console.error('Ошибка получения локаций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET одна локация
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await SavedLocation.findById(req.params.id);

    if (!location || location.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }

    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST создать сохранённую локацию
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, latitude, longitude, address, emoji, color, isPublic } =
      req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Требуются имя и координаты' });
    }

    const location = await SavedLocation.create({
      userId: req.user.id,
      name,
      latitude,
      longitude,
      address,
      emoji: emoji || '📍',
      color: color || '#00d9ff',
      isPublic: isPublic || false,
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Ошибка создания локации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT обновить локацию
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await SavedLocation.findById(req.params.id);

    if (!location || location.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }

    Object.assign(location, req.body);
    await location.save();

    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE удалить локацию
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await SavedLocation.findById(req.params.id);

    if (!location || location.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }

    await SavedLocation.deleteOne({ _id: req.params.id });

    res.json({ message: 'Локация удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

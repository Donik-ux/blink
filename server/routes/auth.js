import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { generateInviteCode, generateRandomColor } from '../utils/helpers.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + ':refresh';

const signAccess = (userId) =>
  jwt.sign({ id: userId, typ: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });

const signRefresh = (userId) =>
  jwt.sign({ id: userId, typ: 'refresh' }, getRefreshSecret(), { expiresIn: REFRESH_TTL });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  color: user.color,
  inviteCode: user.inviteCode,
  ghostMode: user.ghostMode,
  privacyMode: user.privacyMode,
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ error: 'Имя должно быть от 2 до 50 символов' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Пароль должен быть от 6 до 128 символов' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email уже зарегистрирован' });
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    let inviteCode;
    let unique = false;
    while (!unique) {
      inviteCode = generateInviteCode();
      const existing = await User.findOne({ inviteCode });
      if (!existing) unique = true;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      color: generateRandomColor(),
      inviteCode,
    });

    res.status(201).json({
      token: signAccess(user._id),
      refreshToken: signRefresh(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Некорректные учётные данные' });
    }

    const ok = await bcryptjs.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Некорректные учётные данные' });
    }

    user.lastSeen = new Date();
    await user.save();

    res.json({
      token: signAccess(user._id),
      refreshToken: signRefresh(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/refresh — обменять refresh token на новый access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken обязателен' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, getRefreshSecret());
    } catch {
      return res.status(401).json({ error: 'Refresh токен недействителен' });
    }

    if (decoded.typ !== 'refresh') {
      return res.status(401).json({ error: 'Неверный тип токена' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    res.json({
      token: signAccess(user._id),
      refreshToken: signRefresh(user._id), // rotation — старый тоже можно было бы инвалидировать через БД
    });
  } catch (error) {
    console.error('Ошибка refresh:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Успешно вышли' });
});

export default router;

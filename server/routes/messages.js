import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET все разговоры юзера
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'name email color')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET сообщения из разговора
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate('senderId', 'name color')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST создать/получить разговор с другом
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: 'Требуется ID друга' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, friendId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, friendId],
        unreadCount: {
          [req.user.id]: 0,
          [friendId]: 0,
        },
      });
    }

    await conversation.populate('participants', 'name email color');

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST отправить сообщение
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text.trim()) {
      return res.status(400).json({ error: 'Требуются conversationId и text' });
    }

    // Создаём сообщение
    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      text: text.trim(),
    });

    // Обновляем разговор
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: text,
        lastMessageTime: new Date(),
        lastMessageSenderId: req.user.id,
      },
      { new: true }
    );

    // Увеличиваем счётчик непрочитанных для других участников
    if (conversation) {
      for (const participantId of conversation.participants) {
        if (participantId.toString() !== req.user.id) {
          const current = conversation.unreadCount?.get(participantId.toString()) || 0;
          conversation.unreadCount.set(participantId.toString(), current + 1);
        }
      }
      await conversation.save();
    }

    const msg = await message.populate('senderId', 'name color');

    res.status(201).json(msg);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT отметить сообщения как прочитанные
router.put('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId },
      { isRead: true }
    );

    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      $set: { [`unreadCount.${req.user.id}`]: 0 },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

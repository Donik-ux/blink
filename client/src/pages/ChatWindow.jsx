import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { getMessages, sendMessage, markAsRead } from '../api/chat.js';
import { useAuthStore } from '../store/authStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { Avatar } from '../components/Avatar.jsx';
import { Toast } from '../components/Toast.jsx';

export const ChatWindow = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const friend = location.state?.friend;
  const currentUser = useAuthStore((state) => state.currentUser);
  const { socket } = useSocket(); // правильная деструктуризация

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setToast({ message: 'Ошибка загрузки сообщений', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
    markAsRead(conversationId).catch(() => {});
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (data) => {
      if (data.conversationId !== conversationId) return;
      setMessages((prev) => [
        ...prev,
        {
          _id: `sock-${Date.now()}`,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.timestamp,
        },
      ]);
    };

    const onTyping = (data) => {
      if (data.conversationId === conversationId) setIsTyping(data.isTyping);
    };

    socket.on('receive-message', onReceive);
    socket.on('user-typing', onTyping);

    return () => {
      socket.off('receive-message', onReceive);
      socket.off('user-typing', onTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !friend) return;

    socket.emit('typing', {
      conversationId,
      recipientId: friend.id || friend._id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', {
        conversationId,
        recipientId: friend.id || friend._id,
      });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    // Optimistic — рисуем сразу, со статусом "отправляется"
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderId: currentUser?.id,
      text,
      createdAt: new Date(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    setSending(true);

    const recipientId = friend?.id || friend?._id;

    try {
      const msg = await sendMessage(conversationId, text);
      // Заменяем временное сообщение реальным
      setMessages((prev) => prev.map((m) => (m._id === tempId ? msg : m)));

      if (socket && recipientId) {
        socket.emit('chat-message', {
          conversationId,
          message: text,
          recipientId,
        });
        socket.emit('stop-typing', { conversationId, recipientId });
      }
    } catch (error) {
      // Откат — помечаем как failed
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, pending: false, failed: true } : m))
      );
      setToast({ message: 'Сообщение не отправлено', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const retryFailed = async (failedMsg) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === failedMsg._id ? { ...m, pending: true, failed: false } : m))
    );
    try {
      const msg = await sendMessage(conversationId, failedMsg.text);
      setMessages((prev) => prev.map((m) => (m._id === failedMsg._id ? msg : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === failedMsg._id ? { ...m, pending: false, failed: true } : m
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-bg flex flex-col">
      <div className="border-b border-border p-4 flex items-center gap-3 bg-surface2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-accent" />
        </button>

        {friend && (
          <div className="flex items-center gap-3 flex-1">
            <Avatar name={friend.name} color={friend.color} size="sm" />
            <div>
              <p className="text-white font-medium">{friend.name}</p>
              {isTyping && <p className="text-accent text-xs animate-pulse">печатает...</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted text-center">
              Начни разговор 👋
              <br />
              <span className="text-xs">Первое сообщение создаст чат</span>
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
            const isOwn = senderId === currentUser?.id;

            return (
              <div
                key={msg._id || idx}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    isOwn
                      ? `bg-accent text-black rounded-br-none ${msg.pending ? 'opacity-60' : ''} ${
                          msg.failed ? 'bg-red-500/70' : ''
                        }`
                      : 'bg-surface2 text-white rounded-bl-none'
                  }`}
                  onClick={() => msg.failed && retryFailed(msg)}
                  style={{ cursor: msg.failed ? 'pointer' : 'default' }}
                  title={msg.failed ? 'Нажми чтобы повторить' : ''}
                >
                  <p className="break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-black/70' : 'text-muted/70'}`}>
                    {msg.pending
                      ? 'отправка...'
                      : msg.failed
                      ? 'не отправлено — тап для повтора'
                      : new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="border-t border-border p-4 bg-surface2 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Сообщение..."
          maxLength={2000}
          className="flex-1 bg-surface border border-border rounded-full px-4 py-2 text-white placeholder-muted/50 focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn-primary btn-sm rounded-full p-2 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, RotateCcw } from 'lucide-react';
import { getMessages, sendMessage, markAsRead } from '../api/chat.js';
import { useAuthStore } from '../store/authStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { Avatar } from '../components/Avatar.jsx';
import { Toast } from '../components/Toast.jsx';

// Декодируем JWT (без верификации — только id) — нужно когда currentUser не загружен
const getUserIdFromToken = () => {
  try {
    const t = useAuthStore.getState().token;
    if (!t) return null;
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload.id || null;
  } catch {
    return null;
  }
};

const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
};

const formatDateLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, yesterday)) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export const ChatWindow = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const friend = location.state?.friend;
  const currentUser = useAuthStore((state) => state.currentUser);
  const myId = useMemo(() => currentUser?.id || getUserIdFromToken(), [currentUser]);
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState(null);

  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = (behavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
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
    if (!loading) scrollToBottom('auto');
  }, [loading]);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (data) => {
      if (data.conversationId !== conversationId) return;
      const wasNearBottom = isNearBottom();
      setMessages((prev) => [
        ...prev,
        {
          _id: `sock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          senderId: data.senderId,
          text: data.text,
          createdAt: data.timestamp,
        },
      ]);
      // Сразу пометить как прочитанное (раз чат открыт)
      markAsRead(conversationId).catch(() => {});
      if (wasNearBottom) scrollToBottom();
    };

    const onTyping = (data) => {
      if (data.conversationId === conversationId) setIsTyping(!!data.isTyping);
    };

    socket.on('receive-message', onReceive);
    socket.on('user-typing', onTyping);

    return () => {
      socket.off('receive-message', onReceive);
      socket.off('user-typing', onTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, socket]);

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
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderId: myId,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');
    setSending(true);
    if (navigator.vibrate) navigator.vibrate(8);
    scrollToBottom();

    const recipientId = friend?.id || friend?._id;

    try {
      const msg = await sendMessage(conversationId, text);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? msg : m)));
      if (socket && recipientId) {
        socket.emit('chat-message', { conversationId, message: text, recipientId });
        socket.emit('stop-typing', { conversationId, recipientId });
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, pending: false, failed: true } : m))
      );
      setToast({ message: 'Сообщение не отправлено', type: 'error' });
    } finally {
      setSending(false);
      inputRef.current?.focus();
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
      <div className="w-full h-screen bg-bg flex items-center justify-center safe-top">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  // Группируем сообщения по дням для разделителей
  const renderItems = [];
  let lastDate = null;
  messages.forEach((msg, idx) => {
    const created = msg.createdAt || new Date();
    if (!lastDate || !sameDay(lastDate, created)) {
      renderItems.push({ kind: 'day', key: `day-${idx}`, label: formatDateLabel(created) });
      lastDate = created;
    }
    renderItems.push({ kind: 'msg', key: msg._id || idx, msg });
  });

  return (
    <div className="w-full h-screen bg-bg flex flex-col">
      {/* Sticky glass header с safe-area */}
      <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-2xl border-b border-white/5 safe-top">
        <div className="flex items-center gap-3 px-3 py-2.5 max-w-2xl mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="press w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors text-white/80"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>

          {friend ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                <Avatar name={friend.name} color={friend.color} size="sm" />
                {friend.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-online border-2 border-bg shadow-[0_0_6px_rgba(0,255,65,0.7)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate text-[15px] leading-tight">{friend.name}</p>
                <p className={`text-[11px] mt-0.5 truncate ${isTyping ? 'text-accent' : 'text-white/40'}`}>
                  {isTyping ? 'печатает…' : friend.online ? 'онлайн' : 'оффлайн'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white font-semibold flex-1">Чат</p>
          )}
        </div>
      </div>

      {/* Список сообщений */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 max-w-2xl mx-auto w-full"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
              <Send size={20} className="text-accent" />
            </div>
            <p className="text-white/70 font-semibold text-sm mb-1">Начни разговор 👋</p>
            <p className="text-white/40 text-xs">Первое сообщение положит начало чату</p>
          </div>
        ) : (
          renderItems.map((item) => {
            if (item.kind === 'day') {
              return (
                <div key={item.key} className="flex justify-center my-3">
                  <span className="text-white/40 text-[11px] font-semibold uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">
                    {item.label}
                  </span>
                </div>
              );
            }
            const msg = item.msg;
            const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
            const isOwn = String(senderId) === String(myId);

            return (
              <div
                key={item.key}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2 rounded-2xl ${
                    isOwn
                      ? `bg-gradient-to-br from-accent to-accent/85 text-black ${
                          msg.failed ? 'from-red-500 to-red-600 text-white' : ''
                        } ${msg.pending ? 'opacity-70' : ''}`
                      : 'bg-surface2 text-white border border-white/5'
                  } ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'} shadow-sm`}
                  onClick={() => msg.failed && retryFailed(msg)}
                  style={{ cursor: msg.failed ? 'pointer' : 'default' }}
                >
                  <p className="break-words text-[14.5px] leading-snug whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${
                    isOwn ? (msg.failed ? 'text-white/80' : 'text-black/60') : 'text-white/40'
                  } ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {msg.failed ? (
                      <>
                        <RotateCcw size={10} />
                        не отправлено
                      </>
                    ) : msg.pending ? (
                      'отправка…'
                    ) : (
                      formatTime(msg.createdAt)
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода с safe-area */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-white/5 bg-bg/95 backdrop-blur-xl safe-bottom"
      >
        <div className="flex gap-2 px-3 py-2.5 max-w-2xl mx-auto items-end">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Сообщение..."
            maxLength={2000}
            className="flex-1 bg-surface/80 border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-accent transition-colors text-[15px]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="press w-11 h-11 flex items-center justify-center bg-accent text-black rounded-2xl font-bold shrink-0 transition-all disabled:opacity-30 disabled:bg-white/10 disabled:text-white/40 enabled:shadow-[0_4px_16px_rgba(0,217,255,0.35)]"
            aria-label="Отправить"
          >
            <Send size={18} className={sending ? 'animate-pulse' : ''} />
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

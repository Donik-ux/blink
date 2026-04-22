import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { getConversations } from '../api/chat.js';
import { useAuthStore } from '../store/authStore.js';
import { Avatar } from '../components/Avatar.jsx';
import { BottomNav } from '../components/BottomNav.jsx';

export const ChatList = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Обновляем каждые 5 сек
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFriendFromConversation = (conversation) => {
    return conversation.participants.find((p) => p._id !== currentUser?.id);
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount?.[currentUser?.id] || 0;
  };

  const handleOpenChat = (conversationId, friend) => {
    navigate(`/chat/${conversationId}`, { state: { friend } });
  };

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-bg z-40 border-b border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-accent" />
          </button>
          <h1 className="text-2xl font-bold text-white">Сообщения</h1>
        </div>
      </div>

      {/* Список чатов */}
      <div className="p-4">
        {loading ? (
          <p className="text-muted text-center py-8">Загрузка чатов...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="text-muted mx-auto mb-2 opacity-50" />
            <p className="text-muted">Нет сообщений</p>
            <p className="text-muted text-sm">Напиши первое сообщение другу</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const friend = getFriendFromConversation(conversation);
              const unreadCount = getUnreadCount(conversation);

              if (!friend) return null;

              return (
                <button
                  key={conversation._id}
                  onClick={() => handleOpenChat(conversation._id, friend)}
                  className="w-full text-left card hover:bg-surface hover:border-accent transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={friend.name} color={friend.color} size="md" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{friend.name}</p>
                      <p className="text-muted text-sm truncate">
                        {conversation.lastMessage || 'Нет сообщений'}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {conversation.lastMessageTime && (
                        <p className="text-muted text-xs">
                          {new Date(conversation.lastMessageTime).toLocaleDateString('ru-RU', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

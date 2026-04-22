import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, X, UserPlus, Users2 } from 'lucide-react';
import {
  getFriends,
  getFriendRequests,
  inviteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '../api/friends.js';
import { createConversation } from '../api/chat.js';
import { useAuthStore } from '../store/authStore.js';
import { useFriendStore } from '../store/friendStore.js';
import { useLocationStore } from '../store/locationStore.js';
import { calculateDistance } from '../utils/geo.js';
import { GhostToggle } from '../components/GhostToggle.jsx';
import { InviteBox } from '../components/InviteBox.jsx';
import { FriendRow } from '../components/FriendRow.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Toast } from '../components/Toast.jsx';
import { FriendRowSkeleton } from '../components/Skeleton.jsx';

export const Friends = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const friends = useFriendStore((state) => state.friends);
  const requests = useFriendStore((state) => state.requests);
  const ghostMode = useFriendStore((state) => state.ghostMode);
  const setFriends = useFriendStore((state) => state.setFriends);
  const setRequests = useFriendStore((state) => state.setRequests);
  const setGhostMode = useFriendStore((state) => state.setGhostMode);
  const removeFriendFromList = useFriendStore((state) => state.removeFriend);

  const myLocation = useLocationStore((state) => state.myLocation);
  const friendLocations = useLocationStore((state) => state.friendLocations);

  const [searchTerm, setSearchTerm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const friendsData = await getFriends();
        const requestsData = await getFriendRequests();
        setFriends(friendsData);
        setRequests(requestsData);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setFriends, setRequests]);

  const filteredFriends = friends
    .filter((friend) => friend.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((friend) => {
      const friendLoc = friendLocations.get(friend.id || friend._id);
      const dist = (myLocation && friendLoc)
        ? calculateDistance(myLocation.lat, myLocation.lng, friendLoc.lat, friendLoc.lng)
        : null;
      return { ...friend, location: friendLoc || friend.location, distance: dist };
    });

  const handleInvite = async () => {
    if (!inviteCode.trim()) {
      setToast({ message: 'Введи код приглашения', type: 'error' });
      return;
    }
    try {
      await inviteFriend(inviteCode.toUpperCase());
      if (navigator.vibrate) navigator.vibrate(15);
      setToast({ message: 'Запрос отправлен!', type: 'success' });
      setInviteCode('');
      const updatedFriends = await getFriends();
      setFriends(updatedFriends);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка добавления';
      setToast({ message: errorMsg, type: 'error' });
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      if (navigator.vibrate) navigator.vibrate(15);
      setToast({ message: 'Запрос принят!', type: 'success' });
      const updatedRequests = await getFriendRequests();
      const updatedFriends = await getFriends();
      setRequests(updatedRequests);
      setFriends(updatedFriends);
    } catch (error) {
      setToast({ message: 'Ошибка принятия запроса', type: 'error' });
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      setToast({ message: 'Запрос отклонен', type: 'success' });
      setRequests(requests.filter((r) => r.id !== requestId));
    } catch (error) {
      setToast({ message: 'Ошибка отклонения запроса', type: 'error' });
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Удалить друга?')) return;
    try {
      await removeFriend(friendId);
      setToast({ message: 'Друг удалён', type: 'success' });
      removeFriendFromList(friendId);
    } catch (error) {
      setToast({ message: 'Ошибка удаления', type: 'error' });
    }
  };

  const handleMessageFriend = useCallback(
    async (friend) => {
      try {
        const conversation = await createConversation(friend.id);
        navigate(`/chat/${conversation._id}`, { state: { friend } });
      } catch (error) {
        setToast({ message: 'Не удалось открыть чат', type: 'error' });
      }
    },
    [navigate]
  );

  const handleToggleGhost = (enabled) => {
    setGhostMode(enabled);
    setToast({
      message: enabled ? 'Режим призрака включен' : 'Режим призрака выключен',
      type: 'ghost',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg pb-32 text-white relative safe-top">
        <div className="px-4 pt-5 pb-3 sticky top-0 bg-bg/85 backdrop-blur-2xl z-30 border-b border-white/5 safe-top">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-extrabold tracking-tight">Друзья</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <FriendRowSkeleton key={i} />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-32 text-white relative safe-top">
      <div className="fixed top-0 inset-x-0 h-48 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

      {/* Sticky compact header */}
      <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-2xl border-b border-white/5 safe-top">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Друзья
            </h1>
            <span className="text-white/40 text-xs font-semibold bg-white/5 px-2.5 py-1 rounded-full">
              {friends.length}
            </span>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Поиск друзей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-accent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto space-y-4 relative z-10">

        {/* Режим призрака */}
        <div className="glass rounded-2xl p-3.5">
          <GhostToggle enabled={ghostMode} onChange={handleToggleGhost} />
        </div>

        {/* Invite code */}
        <InviteBox inviteCode={currentUser?.inviteCode || ''} />

        {/* Добавить по коду */}
        <div className="glass rounded-2xl p-3.5">
          <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-2.5">Добавить по коду</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-accent font-mono text-base uppercase tracking-[0.2em] text-center"
            />
            <button
              onClick={handleInvite}
              className="press bg-accent text-black hover:bg-accent/90 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center shadow-[0_4px_20px_rgba(0,217,255,0.3)] gap-1.5 shrink-0"
            >
              <UserPlus size={18} />
            </button>
          </div>
        </div>

        {/* Запросы */}
        {requests.length > 0 && (
          <section className="animate-slideUp">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <h2 className="text-white/55 text-[11px] font-bold uppercase tracking-widest">Новые запросы</h2>
              <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full text-[10px] font-bold">{requests.length}</span>
            </div>
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request.id} className="glass rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate text-sm">{request.from.name}</p>
                    <p className="text-white/40 text-[11px] truncate mt-0.5">{request.from.email}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleReject(request.id)}
                      className="press w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-xl transition-all"
                      aria-label="Отклонить"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="press w-10 h-10 flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl transition-all"
                      aria-label="Принять"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Список друзей */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <Users2 size={14} className="text-accent" />
              <h2 className="text-white/55 text-[11px] font-bold uppercase tracking-widest">Моя сеть</h2>
            </div>
            <span className="text-white/30 text-[11px] font-bold">{filteredFriends.length}</span>
          </div>

          <div className="space-y-2">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white/[0.03] border border-white/5 rounded-2xl border-dashed">
                <p className="text-white/60 font-semibold mb-1 text-sm">Здесь пока пусто</p>
                <p className="text-white/30 text-xs">Добавь друга по коду приглашения</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  onDelete={handleRemoveFriend}
                  onMessage={handleMessageFriend}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <BottomNav />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

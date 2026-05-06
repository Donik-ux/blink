import { useState, useEffect } from 'react';
import { Avatar } from './Avatar.jsx';
import { X, Send, Navigation2, Clock, MapPin, Gauge, Wifi, WifiOff } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Давно';
  const diff = Date.now() - new Date(lastSeen).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 30) return 'Только что';
  if (secs < 60) return `${secs} сек назад`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
};

const formatUpdated = (updatedAt) => {
  if (!updatedAt) return 'Неизвестно';
  const diff = Date.now() - new Date(updatedAt).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return 'Только что';
  if (secs < 60) return `${secs} сек назад`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  return `${hours} ч назад`;
};

const formatSpeed = (speed) => {
  if (speed === null || speed === undefined) return null;
  const kmh = speed * 3.6;
  if (kmh < 0.5) return { label: 'Стоит', value: '0 км/ч' };
  if (kmh < 6) return { label: 'Идёт', value: `${kmh.toFixed(1)} км/ч` };
  if (kmh < 20) return { label: 'Бежит', value: `${kmh.toFixed(1)} км/ч` };
  return { label: 'Едет', value: `${kmh.toFixed(0)} км/ч` };
};

export const FriendPopup = ({ friend, distance, onClose, onMessage }) => {
  const [timeText, setTimeText] = useState(() => formatUpdated(friend.location?.updatedAt));
  const [lastSeenText, setLastSeenText] = useState(() => formatLastSeen(friend.lastSeen));

  useEffect(() => {
    setTimeText(formatUpdated(friend.location?.updatedAt));
    setLastSeenText(formatLastSeen(friend.lastSeen));
    const timer = setInterval(() => {
      setTimeText(formatUpdated(friend.location?.updatedAt));
      setLastSeenText(formatLastSeen(friend.lastSeen));
    }, 15000);
    return () => clearInterval(timer);
  }, [friend.location?.updatedAt, friend.lastSeen]);

  const distanceText =
    distance && distance.unit === 'м'
      ? `${distance.value} м`
      : distance
      ? `${distance.value} ${distance.unit}`
      : '—';

  const isOnline = !!friend.online;
  const speedInfo = isOnline ? formatSpeed(friend.location?.speed) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0" onClick={onClose}>

      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

      <div
        className="w-full max-w-sm relative z-10 bg-surface/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-accent rounded-full blur-md opacity-20" />
              <Avatar name={friend.name} color={friend.color} size="lg" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface ${
                isOnline ? 'bg-online shadow-[0_0_8px_rgba(0,255,65,0.7)]' : 'bg-offline'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{friend.name}</h2>
              <p className="text-white/50 text-xs font-medium">{friend.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-6 relative z-10">
          {/* Online / Last seen */}
          <div className={`flex items-center gap-3 rounded-2xl p-3.5 border ${
            isOnline
              ? 'bg-online/10 border-online/20'
              : 'bg-black/30 border-white/5'
          }`}>
            {isOnline
              ? <Wifi size={16} className="text-online shrink-0" />
              : <WifiOff size={16} className="text-white/30 shrink-0" />}
            <div>
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Статус</p>
              <p className={`text-sm font-bold ${isOnline ? 'text-online' : 'text-white/60'}`}>
                {isOnline ? 'В сети' : `Был в сети ${lastSeenText}`}
              </p>
            </div>
          </div>

          {/* Location address */}
          {friend.location?.address && (
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <MapPin size={18} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1">Где</p>
                <p className="text-white/90 text-sm font-medium leading-snug">{friend.location.address}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Distance */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Navigation2 size={18} className="text-accent2" />
              <div>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Вдали</p>
                <p className="text-white font-bold">{distanceText}</p>
              </div>
            </div>

            {/* Updated / Speed */}
            {isOnline && speedInfo ? (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <Gauge size={18} className="text-emerald-400" />
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Скорость</p>
                  <p className="text-white font-bold text-sm">{speedInfo.value}</p>
                </div>
              </div>
            ) : (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <Clock size={18} className="text-accent3" />
                <div>
                  <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Обновлено</p>
                  <p className="text-white font-bold text-sm">{timeText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Speed label when online */}
          {isOnline && speedInfo && (
            <div className="bg-black/20 border border-white/5 rounded-2xl px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/30" />
                <span className="text-white/40 text-xs">Обновлено {timeText}</span>
              </div>
              <span className="text-emerald-400 text-xs font-bold">{speedInfo.label}</span>
            </div>
          )}
        </div>

        {/* Message button */}
        <div className="flex gap-3 relative z-10">
          <button
            onClick={() => onMessage && onMessage(friend)}
            disabled={!onMessage}
            className="flex-1 bg-gradient-to-r from-accent to-accent3 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">Написать</span>
            <Send size={16} className="relative z-10 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

import { memo } from 'react';
import { Avatar } from './Avatar.jsx';
import { Trash2, MessageCircle } from 'lucide-react';
import { useLocationStore } from '../store/locationStore.js';

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return null;
  const diff = Date.now() - new Date(lastSeen).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 30) return 'только что';
  if (secs < 60) return `${secs}с назад`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
};

const speedLabel = (speed) => {
  if (speed === null || speed === undefined) return null;
  const kmh = speed * 3.6;
  if (kmh < 0.5) return null;
  return `${kmh.toFixed(1)} км/ч`;
};

const FriendRowImpl = ({ friend, onDelete, onMessage }) => {
  const friendId = friend.id || friend._id;
  const locationData = useLocationStore((s) => s.friendLocations.get(friendId));

  const distanceText =
    friend.distance && friend.distance.unit === 'м'
      ? `${friend.distance.value} м`
      : friend.distance
      ? `${friend.distance.value} ${friend.distance.unit}`
      : '—';

  const isOnline = !!friend.online;
  const speed = locationData?.speed ?? friend.location?.speed ?? null;
  const speedText = isOnline ? speedLabel(speed) : null;
  const lastSeenText = !isOnline ? formatLastSeen(friend.lastSeen) : null;

  const statusColor = friend.ghostMode
    ? 'bg-ghost'
    : isOnline
    ? 'bg-online shadow-[0_0_8px_rgba(0,255,65,0.6)]'
    : 'bg-offline';

  const address = locationData?.address || friend.location?.address;

  return (
    <div className="press group flex items-center gap-3 p-3 bg-surface/50 hover:bg-surface/70 border border-white/5 rounded-2xl transition-colors">
      <div className="relative shrink-0">
        <Avatar name={friend.name} color={friend.color} avatar={friend.avatar} size="md" />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-bg ${statusColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-white font-semibold text-sm truncate">{friend.name}</p>
          {friend.distance && (
            <span className="text-accent text-xs font-bold shrink-0">{distanceText}</span>
          )}
          {speedText && (
            <span className="text-emerald-400 text-[10px] font-bold shrink-0">· {speedText}</span>
          )}
        </div>
        <p className="text-white/40 text-[11px] truncate mt-0.5">
          {!isOnline && lastSeenText
            ? `В сети ${lastSeenText}`
            : address || (isOnline ? 'Онлайн' : 'Оффлайн')}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onMessage && (
          <button
            onClick={() => onMessage(friend)}
            className="press w-10 h-10 flex items-center justify-center hover:bg-accent/10 rounded-xl transition-colors text-accent"
            aria-label="Написать"
          >
            <MessageCircle size={18} />
          </button>
        )}
        <button
          onClick={() => onDelete(friend.id)}
          className="press w-10 h-10 flex items-center justify-center hover:bg-red-500/10 rounded-xl transition-colors text-white/30 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Удалить"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export const FriendRow = memo(FriendRowImpl, (prev, next) => {
  const a = prev.friend;
  const b = next.friend;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.color === b.color &&
    a.avatar === b.avatar &&
    a.ghostMode === b.ghostMode &&
    a.online === b.online &&
    a.lastSeen === b.lastSeen &&
    a.location?.address === b.location?.address &&
    a.location?.updatedAt === b.location?.updatedAt &&
    a.location?.speed === b.location?.speed &&
    a.distance?.value === b.distance?.value &&
    a.distance?.unit === b.distance?.unit &&
    prev.onDelete === next.onDelete &&
    prev.onMessage === next.onMessage
  );
});

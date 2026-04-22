import { memo } from 'react';
import { Avatar } from './Avatar.jsx';
import { Trash2, MessageCircle } from 'lucide-react';

const FriendRowImpl = ({ friend, onDelete, onMessage }) => {
  const distanceText =
    friend.distance && friend.distance.unit === 'м'
      ? `${friend.distance.value} м`
      : friend.distance
      ? `${friend.distance.value} ${friend.distance.unit}`
      : '—';

  const statusColor = friend.ghostMode
    ? 'bg-ghost'
    : friend.online
    ? 'bg-online shadow-[0_0_8px_rgba(0,255,65,0.6)]'
    : 'bg-offline';

  return (
    <div className="press group flex items-center gap-3 p-3 bg-surface/50 hover:bg-surface/70 border border-white/5 rounded-2xl transition-colors">
      <div className="relative shrink-0">
        <Avatar name={friend.name} color={friend.color} size="md" />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-bg ${statusColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-white font-semibold text-sm truncate">{friend.name}</p>
          {friend.distance && (
            <span className="text-accent text-xs font-bold shrink-0">{distanceText}</span>
          )}
        </div>
        <p className="text-white/40 text-[11px] truncate mt-0.5">
          {friend.location?.address || (friend.online ? 'Онлайн' : 'Оффлайн')}
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
    a.ghostMode === b.ghostMode &&
    a.online === b.online &&
    a.location?.address === b.location?.address &&
    a.location?.updatedAt === b.location?.updatedAt &&
    a.distance?.value === b.distance?.value &&
    a.distance?.unit === b.distance?.unit &&
    prev.onDelete === next.onDelete &&
    prev.onMessage === next.onMessage
  );
});

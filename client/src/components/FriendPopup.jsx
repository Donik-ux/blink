import { Avatar } from './Avatar.jsx';
import { X, Send, Navigation2, Clock, MapPin } from 'lucide-react';

export const FriendPopup = ({ friend, distance, onClose, onMessage }) => {
  const distanceText =
    distance && distance.unit === 'м'
      ? `${distance.value} м`
      : distance
      ? `${distance.value} ${distance.unit}`
      : 'Вне сети';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0" onClick={onClose}>
      
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

      {/* Popup Container */}
      <div
        className="w-full max-w-sm relative z-10 bg-surface/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-accent rounded-full blur-md opacity-20" />
                <Avatar name={friend.name} color={friend.color} size="lg" />
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
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
            <MapPin size={18} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1">Где</p>
              <p className="text-white/90 text-sm font-medium leading-snug">{friend.location?.address || 'Локация недоступна'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Navigation2 size={18} className="text-accent2" />
              <div>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Вдали</p>
                <p className="text-white font-bold">{distanceText}</p>
              </div>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Clock size={18} className="text-accent3" />
              <div>
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Обновлено</p>
                <p className="text-white font-bold text-sm">Только что</p>
              </div>
            </div>
          </div>
        </div>

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


import { useState, useEffect } from 'react';
import { Bell, UserPlus, Check, MapPin, Wifi } from 'lucide-react';
import { getNotifications, markAllAsRead } from '../api/notifications.js';
import { useNotificationStore } from '../store/notifStore.js';
import { BottomNav } from '../components/BottomNav.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { NotificationSkeleton } from '../components/Skeleton.jsx';

const getNotificationText = (notification) => {
  switch (notification.type) {
    case 'friend_request':
      return `${notification.from.name} хочет добавить тебя в друзья`;
    case 'request_accepted':
      return `${notification.from.name} принял твой запрос`;
    case 'nearby':
      return `${notification.from.name} рядом с тобой`;
    case 'online':
      return `${notification.from.name} вышел онлайн`;
    default:
      return 'Новое уведомление';
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'friend_request':
      return { Icon: UserPlus, color: 'text-accent', bg: 'bg-accent/15' };
    case 'request_accepted':
      return { Icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    case 'nearby':
      return { Icon: MapPin, color: 'text-accent2', bg: 'bg-accent2/15' };
    case 'online':
      return { Icon: Wifi, color: 'text-online', bg: 'bg-online/15' };
    default:
      return { Icon: Bell, color: 'text-white/60', bg: 'bg-white/5' };
  }
};

const NotifItem = ({ notif, timeText }) => {
  const { Icon, color, bg } = getIcon(notif.type);
  return (
    <div className={`press flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
      notif.read
        ? 'bg-surface/30 border-white/5'
        : 'bg-accent/[0.04] border-accent/20'
    }`}>
      <div className="relative shrink-0">
        <Avatar name={notif.from.name} color={notif.from.color} size="md" />
        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${bg} ${color} flex items-center justify-center border-2 border-bg`}>
          <Icon size={11} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm leading-snug">{getNotificationText(notif)}</p>
        <p className="text-white/40 text-[11px] mt-1">{timeText}</p>
      </div>
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(0,217,255,0.8)] mt-2 shrink-0" />
      )}
    </div>
  );
};

const Section = ({ title, items, timeText }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-white/55 text-[11px] font-bold uppercase tracking-widest px-1">{title}</h2>
      <div className="space-y-2">
        {items.map((notif) => (
          <NotifItem
            key={notif.id}
            notif={notif}
            timeText={typeof timeText === 'function' ? timeText(notif) : timeText}
          />
        ))}
      </div>
    </section>
  );
};

export const Activity = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const clearUnread = useNotificationStore((state) => state.clearUnread);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.notifications);
        if (data.unreadCount > 0) {
          await markAllAsRead();
          clearUnread();
        }
      } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, [setNotifications, clearUnread]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg pb-32 safe-top">
        <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-2xl border-b border-white/5 safe-top">
          <div className="max-w-md mx-auto px-4 pt-4 pb-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Активность</h1>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
        </div>
        <BottomNav />
      </div>
    );
  }

  const allNotifications = [
    ...notifications.today,
    ...notifications.yesterday,
    ...notifications.older,
  ];
  const hasNotifications = allNotifications.length > 0;

  return (
    <div className="min-h-screen bg-bg pb-32 text-white relative safe-top">
      <div className="fixed top-0 inset-x-0 h-48 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-2xl border-b border-white/5 safe-top">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Активность
          </h1>
          <span className="text-white/40 text-xs font-semibold bg-white/5 px-2.5 py-1 rounded-full">
            {allNotifications.length}
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto space-y-5 relative z-10">
        {!hasNotifications ? (
          <div className="text-center py-16 px-4 bg-white/[0.03] border border-white/5 rounded-2xl border-dashed mt-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Bell size={22} className="text-accent" />
            </div>
            <p className="text-white/70 font-semibold mb-1 text-sm">Тут пока тихо</p>
            <p className="text-white/40 text-xs">Уведомления появятся, когда друзья начнут активничать</p>
          </div>
        ) : (
          <>
            <Section title="Сегодня" items={notifications.today} timeText="Только что" />
            <Section title="Вчера" items={notifications.yesterday} timeText="Вчера" />
            <Section
              title="Ранее"
              items={notifications.older}
              timeText={(n) => new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

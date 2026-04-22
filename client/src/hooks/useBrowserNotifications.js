import { useEffect } from 'react';

// Запрашиваем разрешение один раз и подписываемся на ключевые события сокета,
// чтобы показывать системные уведомления, даже если вкладка неактивна.

const canNotify = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  Notification.permission === 'granted';

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return 'denied';
  }
};

const notify = (title, body, tag) => {
  if (!canNotify()) return;
  // Не тревожим, если вкладка активна — достаточно in-app toast'а
  if (document.visibilityState === 'visible') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: tag || 'blink',
      silent: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // На некоторых браузерах Notification() требует SW — просто молча игнорим
  }
};

export const useBrowserNotifications = (socket) => {
  useEffect(() => {
    if (!socket) return;

    const onNearby = (data) => {
      notify('Друг рядом', `${data.name} недалеко от тебя`, `nearby-${data.userId}`);
    };

    const onMessage = (data) => {
      let preview = data.sticker ? '🖼️ Стикер' : data.text;
      if (preview && preview.length > 80) {
        preview = preview.slice(0, 77) + '…';
      }
      notify(
        data.senderName || 'Новое сообщение',
        preview || 'Новое сообщение',
        `chat-${data.conversationId}`
      );
    };

    const onFriendOnline = (data) => {
      notify('Друг онлайн', `${data.name} вышел онлайн`, `online-${data.userId}`);
    };

    socket.on('friend-nearby', onNearby);
    socket.on('receive-message', onMessage);
    socket.on('friend-online', onFriendOnline);

    return () => {
      socket.off('friend-nearby', onNearby);
      socket.off('receive-message', onMessage);
      socket.off('friend-online', onFriendOnline);
    };
  }, [socket]);
};

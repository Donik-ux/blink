// Генерация уникального 6-символьного кода приглашения
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Генерация случайного цвета аватара
export const generateRandomColor = () => {
  const colors = [
    '#7c3aed', // фиолетовый
    '#db2777', // розовый
    '#d97706', // оранжевый
    '#059669', // зелёный
    '#2563eb', // синий
    '#dc2626', // красный
    '#0891b2', // голубой
    '#65a30d', // лайм
    '#9333ea', // жёлто-фиолетовый
    '#ea580c', // оранжево-красный
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Форматирование времени "X минут назад"
export const formatTimeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
};

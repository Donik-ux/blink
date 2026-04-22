// Компонент для отображения аватара с инициалами
export const Avatar = ({ name, color, size = 'md' }) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  }[size];

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

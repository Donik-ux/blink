// Аватар: показывает картинку если есть, иначе инициалы на цветном фоне
export const Avatar = ({ name = '', color = '#7c3aed', size = 'md', avatar = null }) => {
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

  if (avatar) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden bg-surface ring-1 ring-white/10`}
      >
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

import L from 'leaflet';

// Кэш L.icon по ключу "id:color:initials" — не пересоздаём иконку на каждый рендер.
const iconCache = new Map();
let myMarkerIcon = null;

const buildFriendIcon = (initials, color) => {
  const pinSize = 38;
  const svg = `
    <svg width="${pinSize}" height="${pinSize + 10}" viewBox="0 0 ${pinSize} ${pinSize + 10}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${pinSize / 2}" cy="${pinSize / 2}" r="${pinSize / 2}" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="${pinSize / 2}" y="${pinSize / 2 + 1}" text-anchor="middle" dominant-baseline="central" fill="white" font-weight="bold" font-size="14">
        ${initials}
      </text>
      <polygon points="${pinSize / 2},${pinSize + 8} ${pinSize / 2 - 5},${pinSize - 2} ${pinSize / 2 + 5},${pinSize - 2}" fill="${color}"/>
    </svg>
  `;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return L.icon({
    iconUrl: dataUrl,
    iconSize: [pinSize, pinSize + 10],
    iconAnchor: [pinSize / 2, pinSize],
    popupAnchor: [0, -pinSize],
  });
};

export const createFriendMarker = (friend, color) => {
  const initials = friend.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const key = `${initials}:${color}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = buildFriendIcon(initials, color);
    iconCache.set(key, icon);
  }
  return icon;
};

export const createMyMarker = () => {
  if (myMarkerIcon) return myMarkerIcon;
  const size = 30;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#63b4ff" opacity="0.3" style="animation: pulse 2s infinite"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="#63b4ff"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 14}" fill="white" opacity="0.8"/>
    </svg>
  `;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  myMarkerIcon = L.icon({
    iconUrl: dataUrl,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  return myMarkerIcon;
};

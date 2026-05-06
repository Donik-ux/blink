import L from 'leaflet';

let myMarkerCache = null;

// ── Friend markers ─────────────────────────────────────────────────────────

const toInitials = (name) =>
  name.split(' ').map((w) => w[0] || '').join('').toUpperCase().slice(0, 2);

// Lighten a hex color slightly for the inner gradient highlight
const lighten = (hex, amount = 60) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
};

export const createFriendMarker = (
  friend,
  color,
  { online = false, speed = null, heading = null, ghost = false } = {}
) => {
  const initials = toInitials(friend.name);
  const uid = `f${Math.random().toString(36).slice(2, 8)}`;

  const kmh = speed !== null && speed >= 0 ? speed * 3.6 : null;
  const isMoving = kmh !== null && kmh > 0.8;
  const showSpeed = isMoving;
  const showArrow = isMoving && heading !== null && !isNaN(heading);

  const W = 60;
  const CX = 30;
  const CY = 28;
  const R = 22;
  const tailEndY = 60;        // tip of the drop-shadow tail
  const badgeTop = 63;
  const totalH = showSpeed ? 82 : tailEndY + 4;

  const pinColor = ghost ? '#ffd60a' : color;
  const lighter = ghost ? '#fff5c0' : lighten(color);

  // ── Filter defs (unique id per marker to avoid SVG ID collision) ──────────
  const defs = `<defs>
    <radialGradient id="g${uid}" cx="38%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${lighter}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${pinColor}"/>
    </radialGradient>
    <filter id="s${uid}" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="rgba(0,0,0,0.55)"/>
    </filter>
  </defs>`;

  // ── Pulse ring (online only) ──────────────────────────────────────────────
  const pulse = online
    ? `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${pinColor}" stroke-width="2" opacity="0">
        <animate attributeName="r" from="${R}" to="${R + 18}" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite"/>
       </circle>`
    : '';

  // ── Tail shadow ───────────────────────────────────────────────────────────
  const tailShadow = `<path d="M${CX - 8},${CY + R - 1} L${CX},${tailEndY + 4} L${CX + 8},${CY + R - 1}" fill="rgba(0,0,0,0.3)" filter="url(#s${uid})"/>`;

  // ── Tail ──────────────────────────────────────────────────────────────────
  const tail = `<path d="M${CX - 7},${CY + R} L${CX},${tailEndY} L${CX + 7},${CY + R}" fill="${pinColor}"/>`;

  // ── Circle ────────────────────────────────────────────────────────────────
  const circle = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#g${uid})" stroke="rgba(255,255,255,0.92)" stroke-width="3" filter="url(#s${uid})"/>`;

  // ── Ghost shimmer ────────────────────────────────────────────────────────
  const ghostRing = ghost
    ? `<circle cx="${CX}" cy="${CY}" r="${R - 1}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="4 4">
        <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 ${CX} ${CY}" to="360 ${CX} ${CY}" dur="3s" repeatCount="indefinite"/>
       </circle>`
    : '';

  // ── Direction arrow ───────────────────────────────────────────────────────
  const arrow = showArrow
    ? `<g transform="translate(${CX},${CY}) rotate(${heading})">
        <polygon points="0,${-(R - 3)} -4.5,${-(R - 3) + 10} 4.5,${-(R - 3) + 10}" fill="white" opacity="0.92"/>
       </g>`
    : '';

  // ── Initials ─────────────────────────────────────────────────────────────
  const text = `<text x="${CX}" y="${CY + 0.5}" text-anchor="middle" dominant-baseline="central"
    fill="white" font-weight="800" font-size="13.5" font-family="Inter,-apple-system,sans-serif"
    letter-spacing="-0.5">${initials}</text>`;

  // ── Speed badge ───────────────────────────────────────────────────────────
  const speedBadge = showSpeed
    ? `<rect x="9" y="${badgeTop}" width="42" height="16" rx="8" fill="rgba(0,0,0,0.88)" stroke="rgba(0,255,65,0.5)" stroke-width="1"/>
       <text x="${CX}" y="${badgeTop + 8}" text-anchor="middle" dominant-baseline="central"
         fill="#00ff41" font-size="9.5" font-weight="700" font-family="Inter,-apple-system,sans-serif">
         ${kmh < 10 ? kmh.toFixed(1) : Math.round(kmh)} км/ч
       </text>`
    : '';

  const svg = `<svg width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  ${defs}
  ${pulse}
  ${tailShadow}
  ${tail}
  ${circle}
  ${ghostRing}
  ${arrow}
  ${text}
  ${speedBadge}
</svg>`;

  return L.divIcon({
    html: svg,
    className: 'blink-marker-host',
    iconSize: [W, totalH],
    iconAnchor: [CX, tailEndY],
    popupAnchor: [0, -tailEndY],
  });
};

// ── My location marker ────────────────────────────────────────────────────

export const createMyMarker = () => {
  if (myMarkerCache) return myMarkerCache;

  const size = 40;
  const cx = size / 2;
  const R = size / 2 - 7;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <radialGradient id="myg" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#90d8ff"/>
      <stop offset="100%" stop-color="#63b4ff"/>
    </radialGradient>
    <filter id="myf"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(99,180,255,0.6)"/></filter>
  </defs>
  <circle cx="${cx}" cy="${cx}" r="${cx}" fill="#63b4ff" opacity="0.12">
    <animate attributeName="r" from="${cx}" to="${cx * 2.2}" dur="2.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="0.25" to="0" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${cx}" cy="${cx}" r="${R + 3}" fill="#63b4ff" opacity="0.18"/>
  <circle cx="${cx}" cy="${cx}" r="${R}" fill="url(#myg)" stroke="white" stroke-width="2.5" filter="url(#myf)"/>
  <circle cx="${cx}" cy="${cx}" r="${R - 6}" fill="white" opacity="0.85"/>
</svg>`;

  myMarkerCache = L.divIcon({
    html: svg,
    className: 'blink-marker-host',
    iconSize: [size, size],
    iconAnchor: [cx, cx],
  });
  return myMarkerCache;
};

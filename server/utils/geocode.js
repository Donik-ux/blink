import axios from 'axios';

// Примитивный кэш, чтобы не долбить Nominatim одним и тем же запросом.
const cache = new Map();
const roundKey = (lat, lng) => `${lat.toFixed(3)},${lng.toFixed(3)}`;
let geocodeDisabled = false;

// Обратная геокодировка через OpenStreetMap Nominatim.
// При любой ошибке сети — возвращаем координаты, чтобы не тормозить сервер.
export const geocodeAddress = async (lat, lng) => {
  const key = roundKey(lat, lng);
  if (cache.has(key)) return cache.get(key);
  if (geocodeDisabled) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json', zoom: 16 },
      headers: { 'User-Agent': 'BlinkApp/1.0' },
      timeout: 2500,
    });

    if (response.data && response.data.address) {
      const { road, city, town, village } = response.data.address;
      const location = city || town || village || 'Неизвестное место';
      const address = road ? `${road}, ${location}` : location;
      cache.set(key, address);
      return address;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    // Сеть недоступна → не пытаемся больше (сохраняем ресурсы).
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      geocodeDisabled = true;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

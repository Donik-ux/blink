/**
 * Вычисляет расстояние между двумя точками на Земле по формуле гаверсинуса (Haversine formula).
 * @param {number} lat1 - Широта первой точки
 * @param {number} lon1 - Долгота первой точки
 * @param {number} lat2 - Широта второй точки
 * @param {number} lon2 - Долгота второй точки
 * @returns {Object} Объект с числовым значением и строковой единицей измерения { value, unit }
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Радиус Земли в километрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return { value: meters, unit: 'м' };
  }
  
  return { value: parseFloat(distanceKm.toFixed(1)), unit: 'км' };
};

/**
 * Преобразует объект расстояния в красивую строку.
 * @param {Object} distanceObj - Объект { value, unit }
 * @returns {string} Читаемое расстояние, например "1.2 км" или "450 м"
 */
export const formatDistance = (distanceObj) => {
  if (!distanceObj) return 'Вне сети';
  return `${distanceObj.value} ${distanceObj.unit}`;
};

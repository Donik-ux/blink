// Формула Хаверсина: расчёт расстояния между двумя точками в километрах
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Радиус Земли в км
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;

  // Возвращаем расстояние в удобном формате
  if (km < 1) {
    return { value: Math.round(km * 1000), unit: 'м' };
  }
  return { value: km.toFixed(1), unit: 'км' };
};

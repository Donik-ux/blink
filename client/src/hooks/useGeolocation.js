import { useEffect, useRef } from 'react';
import { useLocationStore } from '../store/locationStore.js';
import { useFriendStore } from '../store/friendStore.js';

import { calculateDistance } from '../utils/geo.js';

// Минимальная дистанция между отправками, чтобы не спамить сервер при шуме GPS
const MIN_DELTA_M = 15;
const MIN_EMIT_INTERVAL_MS = 3000;

export const useGeolocation = (socket) => {
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(null);
  const setMyLocation = useLocationStore((state) => state.setMyLocation);
  const ghostMode = useFriendStore((state) => state.ghostMode);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const onPosition = (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      setMyLocation({ lat: latitude, lng: longitude, accuracy });

      const last = lastSentRef.current;
      const now = Date.now();
      const dist = calculateDistance(last?.lat, last?.lng, latitude, longitude);
      const movedEnough = !last || (dist && (dist.unit === 'км' || dist.value >= MIN_DELTA_M));
      const timeEnough = !last || now - last.t >= MIN_EMIT_INTERVAL_MS;

      if (!movedEnough && !timeEnough) return;

      if (socket && socket.connected) {
        lastSentRef.current = { lat: latitude, lng: longitude, t: now };
        socket.emit('update-location', {
          lat: latitude,
          lng: longitude,
          accuracy,
          ghostMode,
        });
      }
    };

    const onError = (error) => {
      console.error('Ошибка геолокации:', error.message || error);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [socket, setMyLocation, ghostMode]);
};

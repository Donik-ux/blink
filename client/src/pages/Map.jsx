import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Ghost, Navigation } from 'lucide-react';
import { getFriends } from '../api/friends.js';
import { createConversation } from '../api/chat.js';
import { useAuthStore } from '../store/authStore.js';
import { useLocationStore } from '../store/locationStore.js';
import { useFriendStore } from '../store/friendStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useBrowserNotifications, requestNotificationPermission } from '../hooks/useBrowserNotifications.js';
import { BottomNav } from '../components/BottomNav.jsx';
import { FriendPopup } from '../components/FriendPopup.jsx';
import { Toast } from '../components/Toast.jsx';
import { createFriendMarker, createMyMarker } from '../components/FriendPin.jsx';
import { MapSkeleton } from '../components/Skeleton.jsx';
import { calculateDistance } from '../utils/geo.js';
import 'leaflet/dist/leaflet.css';

// Компонент для программного управления камерой карты
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

export const Map = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const myLocation = useLocationStore((state) => state.myLocation);
  const friendLocations = useLocationStore((state) => state.friendLocations);
  const updateFriendLocation = useLocationStore((state) => state.updateFriendLocation);
  const friends = useFriendStore((state) => state.friends);
  const setFriends = useFriendStore((state) => state.setFriends);
  const ghostMode = useFriendStore((state) => state.ghostMode);
  const setGhostMode = useFriendStore((state) => state.setGhostMode);

  const { socket, connected } = useSocket();
  const [hasCenteredInitially, setHasCenteredInitially] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useGeolocation(socket);
  useBrowserNotifications(socket);
  useEffect(() => {
    const asked = localStorage.getItem('notif_prompted');
    if (!asked) {
      requestNotificationPermission().finally(() => {
        localStorage.setItem('notif_prompted', '1');
      });
    }
  }, []);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [mapCenter, setMapCenter] = useState([55.7558, 37.6173]); // Москва по умолчанию
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const data = await getFriends();
        setFriends(data);
        setIsReady(true);
      } catch (error) {
        console.error('Ошибка загрузки друзей:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [setFriends]);

  // Инициализация локаций друзей при загрузке списка
  useEffect(() => {
    if (isReady && friends.length > 0) {
      friends.forEach((f) => {
        const friendId = f.id || f._id;
        if (f.location && f.location.lat) {
          updateFriendLocation(friendId, {
            lat: f.location.lat,
            lng: f.location.lng,
            address: f.location.address || '',
            updatedAt: f.location.updatedAt || new Date(),
          });
        }
      });
    }
  }, [isReady, friends, updateFriendLocation]);

  // Авто-центрирование при первом получении своей локации
  useEffect(() => {
    if (myLocation && !hasCenteredInitially) {
      setMapCenter([myLocation.lat, myLocation.lng]);
      setHasCenteredInitially(true);
    }
  }, [myLocation, hasCenteredInitially]);

  // Центрирование на текущем пользователе
  const handleCenterMap = () => {
    if (myLocation) {
      setMapCenter([myLocation.lat, myLocation.lng]);
    } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setToast({ 
        message: 'Нужен HTTPS для работы GPS с телефона!', 
        type: 'error' 
      });
    } else {
      setToast({ message: 'Геолокация недоступна', type: 'error' });
    }
  };

  // Переход в чат с другом
  const handleMessageFriend = async (friend) => {
    if (!friend) return;
    try {
      const conversation = await createConversation(friend.id || friend._id);
      setSelectedFriend(null);
      navigate(`/chat/${conversation._id}`, { state: { friend } });
    } catch (error) {
      console.error('Ошибка создания разговора:', error);
      setToast({ message: 'Не удалось открыть чат', type: 'error' });
    }
  };

  // Включение режима призрака
  const handleGhostMode = async () => {
    setGhostMode(!ghostMode);
    
    // Отправляем на сервер через Socket
    if (socket && myLocation) {
      socket.emit('update-location', {
        lat: myLocation.lat,
        lng: myLocation.lng,
        accuracy: myLocation.accuracy,
        ghostMode: !ghostMode,
      });
    }

    setToast({
      message: !ghostMode ? 'Ты невидим для всех' : 'Ты видим для друзей',
      type: 'ghost',
    });
  };

  if (loading) {
    return <MapSkeleton />;
  }

  return (
    <div className="relative w-full h-screen bg-bg overflow-hidden">
      {/* Background glow behind the map */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-accent/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* Mapbox Карта */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full h-full z-10"
        attributionControl={false}
      >
        <MapController center={mapCenter} />
        
        {/* CartoDB Dark Matter тема */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Мой маркер */}
        {myLocation && (
          <Marker position={[myLocation.lat, myLocation.lng]} icon={createMyMarker()}>
            <Popup>Я здесь</Popup>
          </Marker>
        )}

        {/* Маркеры друзей */}
        {friends.map((friend) => {
          const friendId = friend.id || friend._id;
          const location = friendLocations.get(friendId);
          if (!location || friend.ghostMode) return null;

          return (
            <Marker
              key={friendId}
              position={[location.lat, location.lng]}
              icon={createFriendMarker(friend, friend.color)}
              eventHandlers={{
                click: () => {
                  const dist = myLocation 
                    ? calculateDistance(myLocation.lat, myLocation.lng, location.lat, location.lng)
                    : null;
                  setSelectedFriend({ ...friend, location, distance: dist });
                },
              }}
            >
              <Popup>{friend.name}</Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Кнопка "Найти меня" */}
      <button
        onClick={handleCenterMap}
        className="press absolute bottom-24 right-4 bg-surface/85 backdrop-blur-xl border border-white/10 text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-accent/50 transition-all z-40 group"
        title="Центрировать карту"
        aria-label="Центрировать карту"
      >
        <Navigation size={20} className="group-hover:text-accent transition-colors" />
      </button>

      {/* Кнопка "Режим призрака" */}
      <button
        onClick={handleGhostMode}
        className={`press absolute bottom-24 left-4 w-12 h-12 flex items-center justify-center rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border transition-all z-40 ${
          ghostMode
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
            : 'bg-surface/85 backdrop-blur-xl border-white/10 text-white hover:border-white/30'
        }`}
        title="Режим призрака"
        aria-label="Режим призрака"
      >
        <Ghost size={20} className={ghostMode ? 'animate-pulse' : ''} />
      </button>

      {/* Индикатор режима призрака */}
      {ghostMode && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md text-amber-400 px-5 py-2.5 rounded-2xl text-sm font-bold z-40 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-slideUp">
          <Ghost size={16} className="animate-bounce" />
          <span>Режим Призрака</span>
        </div>
      )}

      {/* Попап при клике на пин друга */}
      {selectedFriend && (
        <FriendPopup
          friend={selectedFriend}
          distance={selectedFriend.distance}
          onClose={() => setSelectedFriend(null)}
          onMessage={handleMessageFriend}
        />
      )}

      {/* Нижняя навигация */}
      <BottomNav />

      {/* Статус подключения & Title */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-4 flex justify-between items-center z-40 pointer-events-none safe-top">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-widest uppercase drop-shadow-lg">Blink</h1>
        
        {connected ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            Онлайн
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-500 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
            Оффлайн
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

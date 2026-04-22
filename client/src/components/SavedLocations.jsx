import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { getSavedLocations, createSavedLocation, deleteSavedLocation } from '../api/savedLocations.js';
import { Toast } from './Toast.jsx';

const EMOJIS = ['🏠', '💼', '☕', '🏥', '🏫', '🏋️', '🎮', '🍽️', '⛪', '🏞️'];
const COLORS = [
  '#00d9ff', // cyan
  '#ff006e', // pink
  '#8338ec', // purple
  '#00ff41', // green
  '#ffd60a', // yellow
  '#ff9500', // orange
  '#ff3333', // red
];

export const SavedLocations = ({ myLocation }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '📍',
    color: '#00d9ff',
    isPublic: false,
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getSavedLocations();
      setLocations(data);
    } catch (error) {
      console.error('Ошибка загрузки локаций:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Введи название локации', type: 'error' });
      return;
    }

    try {
      const newLocation = await createSavedLocation({
        name: formData.name,
        latitude: myLocation?.latitude || 0,
        longitude: myLocation?.longitude || 0,
        address: myLocation?.address || 'Текущая локация',
        emoji: formData.emoji,
        color: formData.color,
        isPublic: formData.isPublic,
      });

      setLocations([newLocation, ...locations]);
      setFormData({ name: '', emoji: '📍', color: '#00d9ff', isPublic: false });
      setShowForm(false);
      setToast({ message: '✓ Локация сохранена!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Ошибка сохранения', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить локацию?')) return;

    try {
      await deleteSavedLocation(id);
      setLocations(locations.filter((loc) => loc._id !== id));
      setToast({ message: '✓ Локация удалена', type: 'success' });
    } catch (error) {
      setToast({ message: 'Ошибка удаления', type: 'error' });
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin size={20} className="text-accent" />
          Сохранённые локации
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary btn-sm flex items-center gap-2"
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="card mb-4 space-y-3">
          <input
            type="text"
            placeholder="Название (Дом, Работа...)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full"
          />

          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setFormData({ ...formData, emoji })}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  formData.emoji === emoji ? 'ring-2 ring-accent' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.color === color ? 'border-white scale-125' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-muted text-sm">Виднапубликовано друзьям</span>
          </label>

          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary flex-1">
              Сохранить
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список локаций */}
      {loading ? (
        <p className="text-muted text-center py-4">Загрузка...</p>
      ) : locations.length === 0 ? (
        <p className="text-muted text-center py-4">Нет сохранённых локаций</p>
      ) : (
        <div className="space-y-2">
          {locations.map((location) => (
            <div
              key={location._id}
              className="card flex items-center justify-between hover:bg-surface hover:border-accent transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{location.emoji}</span>
                <div>
                  <p className="text-white font-medium">{location.name}</p>
                  <p className="text-muted text-xs">{location.address}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(location._id)}
                className="p-2 hover:bg-danger/20 rounded-lg transition-colors"
              >
                <Trash2 size={18} className="text-danger" />
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

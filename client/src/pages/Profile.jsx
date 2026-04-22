import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, Check, Mail, Settings2, Palette, Shield } from 'lucide-react';
import { getProfile, updateProfile } from '../api/profile.js';
import { useAuthStore } from '../store/authStore.js';
import { GhostToggle } from '../components/GhostToggle.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { SavedLocations } from '../components/SavedLocations.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Toast } from '../components/Toast.jsx';

const COLORS = [
  '#7c3aed', '#db2777', '#d97706', '#059669', '#2563eb',
  '#dc2626', '#0891b2', '#65a30d', '#9333ea', '#ea580c',
];

export const Profile = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState(null);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(currentUser?.color || '#7c3aed');
  const [ghostMode, setGhostMode] = useState(false);
  const [privacyMode, setPrivacyMode] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setNewName(data.name);
        setSelectedColor(data.color);
        setGhostMode(data.ghostMode);
        setPrivacyMode(data.privacyMode);
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveChanges = async () => {
    if (newName.trim().length < 2) {
      setToast({ message: 'Имя должно быть не менее 2 символов', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: newName, color: selectedColor, ghostMode, privacyMode });
      setProfile({ ...profile, name: newName, color: selectedColor, ghostMode, privacyMode });
      setEditName(false);
      setHasUnsaved(false);
      if (navigator.vibrate) navigator.vibrate(10);
      setToast({ message: 'Профиль обновлён', type: 'success' });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка сохранения';
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const markChanged = () => setHasUnsaved(true);

  const handleLogout = () => {
    if (window.confirm('Ты уверен, что хочешь выйти?')) {
      logout();
      navigate('/login');
    }
  };

  if (loading || !profile) {
    return (
      <div className="w-full h-screen bg-bg flex items-center justify-center pb-16 relative overflow-hidden safe-top">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/20 rounded-full blur-[80px] animate-pulse" />
        <p className="text-white/50 font-medium tracking-widest uppercase text-xs relative z-10 animate-pulse">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-32 text-white relative safe-top">
      <div className="fixed top-0 inset-x-0 h-48 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

      {/* Hero — компактный */}
      <div className="px-4 pt-6 pb-4 sm:pt-10 text-center relative z-10 animate-slideUp">
        <div className="flex justify-center mb-3 relative">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full blur-[40px] pointer-events-none opacity-50"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="relative">
            <Avatar name={newName} color={selectedColor} size="lg" />
          </div>
        </div>

        {editName ? (
          <div className="flex gap-2 max-w-[260px] mx-auto mb-2 relative z-10">
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); markChanged(); }}
              className="flex-1 bg-black/50 border border-accent/50 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:shadow-[0_0_20px_rgba(0,217,255,0.2)] text-center font-bold"
              autoFocus
            />
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="press bg-emerald-500/20 text-emerald-400 px-3 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
            >
              <Check size={20} />
            </button>
          </div>
        ) : (
          <div className="mb-1.5 flex items-center justify-center gap-2 relative z-10">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">{profile.name}</h1>
            <button
              onClick={() => setEditName(true)}
              className="press p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all"
              aria-label="Редактировать имя"
            >
              <Edit2 size={14} className="text-white/60" />
            </button>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full relative z-10">
          <Mail size={12} className="text-accent" />
          <p className="text-white/60 text-[11px] font-semibold tracking-wider">{profile.email}</p>
        </div>
      </div>

      {/* Stats — компактные карточки */}
      <div className="px-4 max-w-md mx-auto relative z-10">
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-surface/40 border border-white/5 rounded-2xl p-3 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-accent/10 rounded-full blur-xl" />
            <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent3 leading-none">{profile.friendsCount}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">Друзей</p>
          </div>
          <div className="bg-surface/40 border border-white/5 rounded-2xl p-3 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-accent2/10 rounded-full blur-xl" />
            <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent2 to-accent leading-none">24ч</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">Активность</p>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto space-y-3 relative z-10">
        {/* Цвет профиля */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={14} className="text-accent" />
            <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Цвет профиля</p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-between">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { setSelectedColor(color); markChanged(); if (navigator.vibrate) navigator.vibrate(5); }}
                className={`press w-9 h-9 rounded-full transition-all duration-200 relative ${
                  selectedColor === color ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-black' : 'opacity-60'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Цвет ${color}`}
              />
            ))}
          </div>
        </section>

        {/* Режим призрака */}
        <section className="glass rounded-2xl p-4">
          <GhostToggle enabled={ghostMode} onChange={(val) => { setGhostMode(val); markChanged(); }} />
        </section>

        {/* Приватность */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-accent" />
            <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Кто меня видит</p>
          </div>
          <div className="space-y-1">
            {[
              { value: 'friends', label: 'Только друзья' },
              { value: 'everyone', label: 'Все (общий режим)' },
            ].map(({ value, label }) => (
              <label
                key={value}
                className="press flex items-center justify-between cursor-pointer p-2.5 -mx-1 rounded-xl hover:bg-white/5 transition-colors"
              >
                <span className="text-white/85 text-sm font-medium">{label}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${privacyMode === value ? 'border-accent' : 'border-white/20'}`}>
                  {privacyMode === value && <div className="w-2.5 h-2.5 rounded-full bg-accent animate-fadeIn" />}
                </div>
                <input
                  type="radio"
                  name="privacy"
                  value={value}
                  checked={privacyMode === value}
                  onChange={(e) => { setPrivacyMode(e.target.value); markChanged(); }}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </section>

        <SavedLocations myLocation={profile.lastLocation} />

        <button
          onClick={handleLogout}
          className="press w-full bg-black/50 border border-red-500/30 text-red-400 py-3.5 rounded-2xl font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 mt-2"
        >
          <LogOut size={16} />
          <span className="text-sm">Выйти из аккаунта</span>
        </button>
      </div>

      {/* Floating Save Bar — появляется при изменениях */}
      {hasUnsaved && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40 animate-slideUp pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="press w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white py-3.5 rounded-2xl font-bold shadow-[0_10px_30px_rgba(16,185,129,0.35)] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

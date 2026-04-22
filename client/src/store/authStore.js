import { create } from 'zustand';

// Safari в приватном режиме / WebView могут кинуть QuotaExceededError или SecurityError
// на любой setItem. Оборачиваем, чтобы регистрация не падала из-за стораджа.
const safeStorage = {
  get: (k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); } catch { /* ignore */ }
  },
  del: (k) => {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  },
};

const loadCachedUser = () => {
  try {
    const raw = safeStorage.get('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  // Восстанавливаем юзера из кэша — чтобы после refresh аватарка/имя не моргали и сокет сразу поднимался
  currentUser: loadCachedUser(),
  token: safeStorage.get('token') || null,
  refreshToken: safeStorage.get('refreshToken') || null,
  isAuthenticated: !!safeStorage.get('token'),

  setUser: (user) => {
    if (user) safeStorage.set('currentUser', JSON.stringify(user));
    else safeStorage.del('currentUser');
    set({ currentUser: user });
  },

  setTokens: ({ token, refreshToken }) => {
    if (token) safeStorage.set('token', token);
    if (refreshToken) safeStorage.set('refreshToken', refreshToken);
    set((state) => ({
      token: token ?? state.token,
      refreshToken: refreshToken ?? state.refreshToken,
      isAuthenticated: !!(token ?? state.token),
    }));
  },

  // Для обратной совместимости
  setToken: (token) => {
    safeStorage.set('token', token);
    set({ token, isAuthenticated: true });
  },

  logout: () => {
    safeStorage.del('token');
    safeStorage.del('refreshToken');
    safeStorage.del('currentUser');
    set({ currentUser: null, token: null, refreshToken: null, isAuthenticated: false });
  },
}));

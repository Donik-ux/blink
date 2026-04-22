import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

// Same-origin: /api идёт через Vite-proxy → backend:5000.
// Так телефон по HTTPS не ловит mixed-content и всё работает.
const baseURL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh flow — один polling запрос на все параллельные 401
let refreshPromise = null;
const doRefresh = async () => {
  const rt = useAuthStore.getState().refreshToken || localStorage.getItem('refreshToken');
  if (!rt) return null;
  try {
    const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken: rt });
    useAuthStore.getState().setTokens({ token: data.token, refreshToken: data.refreshToken });
    return data.token;
  } catch {
    return null;
  }
};

const redirectToLogin = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  useAuthStore.getState().logout();
  if (!window.location.pathname.startsWith('/login')) {
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

const shouldRetry = (error) => {
  if (!error.config || error.config.__retryCount >= 2) return false;
  if (!error.response) return true;
  const s = error.response.status;
  return s >= 500 && s < 600;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config || {};
    const status = error.response?.status;

    // /auth/refresh сам — не гоняем рекурсию
    if (status === 401 && !cfg.__skipRefresh && !cfg.url?.includes('/auth/refresh')) {
      cfg.__skipRefresh = true;
      if (!refreshPromise) refreshPromise = doRefresh().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(cfg);
      }
      redirectToLogin();
      return Promise.reject(error);
    }

    if (shouldRetry(error)) {
      cfg.__retryCount = (cfg.__retryCount || 0) + 1;
      const delay = 300 * Math.pow(2, cfg.__retryCount - 1);
      await new Promise((r) => setTimeout(r, delay));
      return apiClient(cfg);
    }

    return Promise.reject(error);
  }
);

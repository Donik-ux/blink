import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { getProfile } from './api/profile.js';

// Lazy-load страниц — каждый маршрут грузится отдельным чанком
const Onboarding = lazy(() => import('./pages/Onboarding.jsx').then((m) => ({ default: m.Onboarding })));
const Login = lazy(() => import('./pages/Login.jsx').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register.jsx').then((m) => ({ default: m.Register })));
const Map = lazy(() => import('./pages/Map.jsx').then((m) => ({ default: m.Map })));
const Friends = lazy(() => import('./pages/Friends.jsx').then((m) => ({ default: m.Friends })));
const Activity = lazy(() => import('./pages/Activity.jsx').then((m) => ({ default: m.Activity })));
const Profile = lazy(() => import('./pages/Profile.jsx').then((m) => ({ default: m.Profile })));
const ChatList = lazy(() => import('./pages/ChatList.jsx').then((m) => ({ default: m.ChatList })));
const ChatWindow = lazy(() => import('./pages/ChatWindow.jsx').then((m) => ({ default: m.ChatWindow })));

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PageFallback = () => (
  <div className="w-full h-screen bg-bg flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
  </div>
);

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const onboardingDone = localStorage.getItem('onboarding_done');

  // Запрашиваем разрешение на системные нотификации (для "друг рядом")
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      // Не спрашиваем сразу — даём 3 секунды на адаптацию интерфейса
      const t = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  // После refresh: если есть токен но нет/устарел юзер — подтягиваем свежий профиль
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (cancelled) return;
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          color: data.color,
          avatar: data.avatar,
          inviteCode: data.inviteCode,
          ghostMode: data.ghostMode,
          privacyMode: data.privacyMode,
        });
      } catch (e) {
        // 401 → токен протух, выкидываем
        if (e?.response?.status === 401) logout();
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, setUser, logout]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              path="/onboarding"
              element={isAuthenticated ? <Navigate to="/map" replace /> : <Onboarding />}
            />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/map" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/map" replace /> : <Register />}
            />

            <Route
              path="/map"
              element={
                <PrivateRoute>
                  <Map />
                </PrivateRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <PrivateRoute>
                  <Friends />
                </PrivateRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <PrivateRoute>
                  <Activity />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/chats"
              element={
                <PrivateRoute>
                  <ChatList />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat/:conversationId"
              element={
                <PrivateRoute>
                  <ChatWindow />
                </PrivateRoute>
              }
            />

            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/map" replace />
                ) : onboardingDone ? (
                  <Navigate to="/login" replace />
                ) : (
                  <Navigate to="/onboarding" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

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
  const onboardingDone = localStorage.getItem('onboarding_done');

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

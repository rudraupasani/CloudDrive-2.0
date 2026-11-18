import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages for code-splitting and faster initial page loads
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/Profile'));
const SearchPage = lazy(() => import('../pages/Search'));
const SharedFile = lazy(() => import('../pages/SharedFile'));

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen w-full bg-[#F8FAFD] flex flex-col items-center justify-center p-4">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
    <span className="text-xs font-semibold text-slate-500 font-['Outfit']">Loading CloudDrive...</span>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, checkingAuth } = useAuth();
  const userId = localStorage.getItem('cloud_drive_user');
  const token = localStorage.getItem('cloud_drive_token');

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!userId && !token && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Share File Routes */}
        <Route path="/share/:shareToken" element={<SharedFile />} />
        <Route path="/files/shared/:shareToken" element={<SharedFile />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

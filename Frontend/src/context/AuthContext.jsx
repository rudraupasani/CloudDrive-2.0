import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getUserProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cloud_drive_user');
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        return JSON.parse(savedUser);
      }
    } catch (err) {
      console.error('Error parsing stored user from localStorage:', err);
      localStorage.removeItem('cloud_drive_user');
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Helper to safely set user & localStorage
  const updateUserData = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('cloud_drive_user', JSON.stringify(userData));
    } else {
      setUser(null);
      localStorage.removeItem('cloud_drive_user');
    }
  };

  // Check backend session on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await getUserProfile();
        const currentUser = res.userData || res.user;
        if (res.success && currentUser) {
          updateUserData(currentUser);
        }
      } catch (err) {
        if (err?.status === 401 || err?.message?.includes('Authentication')) {
          updateUserData(null);
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    verifyAuth();
  }, []);

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      const loggedInUser = data.userData || data.user;
      if (data.success && loggedInUser) {
        updateUserData(loggedInUser);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    try {
      const data = await registerUser(userData);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    updateUserData(null);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        checkingAuth,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        setUser: updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

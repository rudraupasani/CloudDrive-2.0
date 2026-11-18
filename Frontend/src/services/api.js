import axios from 'axios';

// In production: VITE_API_URL is set to your deployed backend URL (e.g. Render)
// In development: falls back to localhost
const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies when on same origin / allowed CORS origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Automatically attach JWT token from localStorage as Bearer header.
// This is the cross-origin fallback: cookies may be blocked by the browser
// (Safari ITP, third-party cookie restrictions) when frontend and backend
// are on different domains (e.g. Vercel frontend → Render backend).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloud_drive_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// If the server responds with 401 (token expired / invalid), clear local
// storage and redirect to login so the user is not stuck in a broken state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all stored auth data
      localStorage.removeItem('cloud_drive_token');
      localStorage.removeItem('cloud_drive_user');
      // Redirect to login only if not already on login or public routes
      const publicPaths = ['/login', '/register', '/share'];
      const isPublicPath = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    // Store token from response body (cross-origin fallback for when cookies are blocked)
    if (response.data?.token) {
      localStorage.setItem('cloud_drive_token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Server error. Please try again.' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    if (response.data?.token) {
      localStorage.setItem('cloud_drive_token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Registration failed. Please try again.' };
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout').catch(() => { });
  } finally {
    localStorage.removeItem('cloud_drive_token');
    localStorage.removeItem('cloud_drive_user');
  }
};

// ─── User Profile ───────────────────────────────────────────────────────────

export const getUserProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch user profile.' };
  }
};

export const updateUserProfile = async (payload) => {
  try {
    const response = await api.put('/profile', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update profile.' };
  }
};

export const updateUserAvatar = async (avatarUrl) => {
  try {
    const response = await api.put('/profile', { avatar: avatarUrl });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update avatar.' };
  }
};

// ─── Files ──────────────────────────────────────────────────────────────────

export const uploadFileMetadata = async (fileData) => {
  try {
    const response = await api.post('/files', fileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to save file metadata.' };
  }
};

export const getUserFiles = async () => {
  try {
    const response = await api.get('/files');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch files.' };
  }
};

export const deleteUserFile = async (fileId) => {
  try {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete file.' };
  }
};

export const toggleFavoriteFile = async (fileId) => {
  try {
    const response = await api.patch(`/files/${fileId}/favorite`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update favorite status.' };
  }
};

export const generateShareLink = async (fileId) => {
  try {
    const response = await api.post(`/files/${fileId}/share`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to generate share link.' };
  }
};

export const getSharedFile = async (shareToken) => {
  try {
    const response = await api.get(`/files/shared/${shareToken}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Shared file not found or expired.' };
  }
};

export default api;

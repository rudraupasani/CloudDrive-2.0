import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Server error. Please try again.' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Registration failed. Please try again.' };
  }
};

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

export default api;

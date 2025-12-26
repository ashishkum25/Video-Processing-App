import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const videoAPI = {
  upload: (formData, onUploadProgress) => {
    return api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    });
  },

  getAll: (params = {}) => {
    return api.get('/videos', { params });
  },

  getById: (id) => {
    return api.get(`/videos/${id}`);
  },

  getStreamUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_URL}/videos/${id}/stream?token=${token}`;
  },

  update: (id, data) => {
    return api.patch(`/videos/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/videos/${id}`);
  }
};

export default api;

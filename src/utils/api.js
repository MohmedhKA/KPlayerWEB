import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://100.102.217.22:3000';

const api = axios.create({
  baseURL: BASE_URL
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
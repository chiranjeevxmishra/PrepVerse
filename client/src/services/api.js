import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HTTP-only cookies on cross-origin requests
  timeout: 10000,
});

// Request interceptor to attach Authorization header if token exists in localStorage (dual support)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('prepverse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred.',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

// Diagnostics
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Authentication Services
export const registerUser = async ({ name, email, password }) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const googleAuthUser = async (payload) => {
  const response = await api.post('/auth/google', payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export default api;

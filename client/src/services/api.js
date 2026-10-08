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

// Student Profile & Onboarding Services
export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data;
};

export const saveOnboarding = async (onboardingData) => {
  const response = await api.post('/profile/onboarding', onboardingData);
  return response.data;
};

// Assessment Services
export const getAssessmentQuestions = async () => {
  const response = await api.get('/assessment/questions');
  return response.data;
};

export const submitAssessment = async (answers) => {
  const response = await api.post('/assessment/submit', { answers });
  return response.data;
};

export const getAssessmentResults = async () => {
  const response = await api.get('/assessment/results');
  return response.data;
};

// Preparation Plan Services
export const getTodaysPlan = async () => {
  const response = await api.get('/plan/today');
  return response.data;
};

export const completeTask = async (taskId) => {
  const response = await api.patch(`/plan/tasks/${taskId}/complete`);
  return response.data;
};

export const getPlanHistory = async () => {
  const response = await api.get('/plan/history');
  return response.data;
};

// Job Description Analysis Services
export const analyzeJobDescription = async (payload) => {
  const response = await api.post('/jobs/analyze', payload);
  return response.data;
};

export const getJobAnalyses = async () => {
  const response = await api.get('/jobs');
  return response.data;
};

export const getJobAnalysis = async (analysisId) => {
  const response = await api.get(`/jobs/${analysisId}`);
  return response.data;
};

export const deleteJobAnalysis = async (analysisId) => {
  const response = await api.delete(`/jobs/${analysisId}`);
  return response.data;
};

export const addJobRecommendationToPlan = async (analysisId, recommendationIndex) => {
  const response = await api.post(`/jobs/${analysisId}/tasks/${recommendationIndex}`);
  return response.data;
};

export default api;

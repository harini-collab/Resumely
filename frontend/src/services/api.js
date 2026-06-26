import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  console.error('REACT_APP_API_URL is not set — set it in Vercel Environment Variables before building.');
}

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle errors ───────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/signup');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject({ ...error, message });
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data)  => API.post('/auth/login', data),
  signup:         (data)  => API.post('/auth/signup', data),
  getMe:          ()      => API.get('/auth/me'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) =>
    API.post(`/auth/reset-password/${token}`, { password }),
};

// ── Resume ────────────────────────────────────────────────────────────────────
export const resumeAPI = {
  upload:      (formData) =>
    API.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  analyze:     (data)          => API.post('/resume/analyze', data, { timeout: 60000 }),
  improve:     (data)          => API.post('/resume/improve', data),
  compare:     (data)          => API.post('/resume/compare', data, { timeout: 60000 }),
  getProgress: (userId)        => API.get(`/resume/progress/${userId}`),
  list:        (page = 1, limit = 10) => API.get(`/resume?page=${page}&limit=${limit}`),
  get:         (id)            => API.get(`/resume/${id}`),
  delete:      (id)            => API.delete(`/resume/${id}`),
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsAPI = {
  list: () => API.get('/jobs'),
};

// ── Career Intelligence ───────────────────────────────────────────────────────
export const careerAPI = {
  jobMatch:  (data) => API.post('/career/job-match', data),
  insights:  ()     => API.get('/career/insights'),
};

export default API;

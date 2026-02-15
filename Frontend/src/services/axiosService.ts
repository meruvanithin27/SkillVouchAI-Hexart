import axios from 'axios';

// Get API URL with fallback
const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    console.error('❌ VITE_API_URL is not defined!');
    console.error('Please set VITE_API_URL in your environment variables');
    // Return a fallback URL that will show a clear error
    return 'https://api-url-not-configured.error';
  }
  return url;
};

// Create axios instance with base configuration
const API = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;

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

// Request interceptor for logging and auth token
API.interceptors.request.use(
  (config) => {
    console.log(`🚀 REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📍 Full URL: ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 JWT Token: Present');
      console.log('🔑 JWT received:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ JWT Token: Missing');
    }
    
    // Log request data (excluding sensitive info)
    if (config.data) {
      const sanitizedData = { ...config.data };
      if (sanitizedData.password) delete sanitizedData.password;
      if (sanitizedData.confirmPassword) delete sanitizedData.confirmPassword;
      console.log('📤 Request Data:', sanitizedData);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ REQUEST ERROR:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
API.interceptors.response.use(
  (response) => {
    console.log(`✅ SUCCESS: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Response Time: ${response.headers['x-response-time'] || 'N/A'}`);
    
    // Log response data (truncate if too large)
    if (response.data) {
      const dataStr = JSON.stringify(response.data);
      if (dataStr.length > 500) {
        console.log('📥 Response Data:', dataStr.substring(0, 500) + '...');
      } else {
        console.log('📥 Response Data:', response.data);
      }
    }
    
    return response;
  },
  (error) => {
    console.error(`❌ API ERROR: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error(`📊 Status: ${error.response?.status} ${error.response?.statusText}`);
    console.error(`💬 Message: ${error.message}`);
    
    if (error.response?.data) {
      console.error('📥 Error Response:', error.response.data);
    }
    
    if (error.response?.status === 401) {
      console.log('🔓 Unauthorized - Clearing auth tokens');
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/';
    }
    
    if (error.response?.status === 403) {
      console.log('🚫 Forbidden - Insufficient permissions');
    }
    
    if (error.response?.status === 500) {
      console.log('💥 Server Error - Backend issue');
    }
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.log('🌐 Network Error - Backend unreachable');
    }
    
    return Promise.reject(error);
  }
);

export default API;

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, STORAGE_KEYS } from '../constants';

// Configure the API base URL
const API_URL = __DEV__ 
  ? APP_CONFIG.API_URL.DEVELOPMENT
  : APP_CONFIG.API_URL.PRODUCTION;

console.log('API URL configured:', API_URL);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: APP_CONFIG.TIMEOUT,
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      console.log('📦 Request data:', config.data);
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Token added to request header');
      } else {
        console.warn('⚠️ No auth token found');
      }
    } catch (error) {
      console.error('❌ Error adding token to request:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    console.log('📥 Response data:', response.data);
    return response;
  },
  async (error: AxiosError) => {
    console.log('❌ API Error:', error.response?.status, error.config?.url);
    console.log('💥 Error details:', error.response?.data);
    
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    // Handle 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.error('🚫 401 error received:', error.response?.data);
      
      // Clear stored token and redirect to login
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      console.error('🔓 Session expired. Please login again.');
    }
    
    // Handle 403 (Forbidden)
    if (error.response?.status === 403) {
      console.error('🚫 403 error received:', error.response?.data);
      console.error('Access denied. You do not have permission to access this resource.');
    }
    
    // Handle 500+ (Server errors)
    if (error.response?.status && error.response.status >= 500) {
      console.error('🔥 Server error:', error.response?.data);
      console.error('A server error occurred. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 
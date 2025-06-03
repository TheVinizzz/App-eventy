import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  profileImage?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Authentication service
const authService = {
  // Login: returns user and token if successful
  login: async (email: string, password: string): Promise<AuthState> => {
    try {
      console.log('AuthService: Attempting login with backend:', { email });
      
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const { access_token, user } = response.data;

      if (access_token && user) {
        // Store token and user data
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        console.log('✅ AuthService: Login successful:', user.email);
        
        return {
          user,
          accessToken: access_token,
          isAuthenticated: true,
          isLoading: false,
        };
      }
      
      throw new Error('Invalid credentials');
    } catch (error: any) {
      console.error('AuthService: Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Register user
  register: async (name: string, email: string, password: string): Promise<AuthState> => {
    try {
      console.log('AuthService: Attempting registration with backend:', { name, email });
      
      const response = await api.post<LoginResponse>('/auth/register', {
        name,
        email,
        password,
      });

      const { access_token, user } = response.data;

      if (access_token && user) {
        // Store token and user data
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        console.log('✅ AuthService: Registration successful:', user.email);
        
        return {
          user,
          accessToken: access_token,
          isAuthenticated: true,
          isLoading: false,
        };
      }
      
      throw new Error('Registration failed');
    } catch (error: any) {
      console.error('AuthService: Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Logout: clear credentials
  logout: async (): Promise<void> => {
    try {
      // Optional: Call logout endpoint to invalidate token on server
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (token) {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.log('AuthService: Logout endpoint error (non-critical):', error);
        }
      }
      
      // Clear local storage
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      console.log('✅ AuthService: Logout successful');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  },

  // Get current token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      return null;
    }
  },

  // Get current user
  getUser: async (): Promise<User | null> => {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is admin
  isAdmin: async (): Promise<boolean> => {
    try {
      const user = await authService.getUser();
      return user?.role === 'ADMIN';
    } catch (error) {
      return false;
    }
  },

  // Get current auth state
  getAuthState: async (): Promise<AuthState> => {
    try {
      const user = await authService.getUser();
      const accessToken = await authService.getToken();
      
      return {
        user,
        accessToken,
        isAuthenticated: !!accessToken && !!user,
        isLoading: false,
      };
    } catch (error) {
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    }
  },
  
  // Update user data
  updateUser: async (userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('AuthService: Error updating user data:', error);
      throw error;
    }
  },
  
  // Fetch user profile from API
  fetchUserProfile: async (): Promise<User | null> => {
    try {
      const token = await authService.getToken();
      
      if (!token) return null;
      
      const response = await api.get('/auth/profile');
      
      if (response.data) {
        // Update user in storage
        await authService.updateUser(response.data);
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('AuthService: Error fetching user profile:', error);
      
      // If 401, token is invalid - clear auth
      if (error.response?.status === 401) {
        await authService.logout();
      }
      
      return null;
    }
  }
};

export default authService; 
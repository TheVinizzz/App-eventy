import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import authService, { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUserProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const authState = await authService.getAuthState();
      
      setUser(authState.user);
      setAccessToken(authState.accessToken);
      
      // If we have stored auth, verify it's still valid
      if (authState.isAuthenticated) {
        try {
          await authService.fetchUserProfile();
        } catch (error) {
          console.log('Token expired, clearing stored auth');
          await clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await authService.logout();
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const authState = await authService.login(email, password);
      
      setUser(authState.user);
      setAccessToken(authState.accessToken);
    } catch (error: any) {
      await clearStoredAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const authState = await authService.register(name, email, password);
      
      setUser(authState.user);
      setAccessToken(authState.accessToken);
    } catch (error: any) {
      await clearStoredAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setAccessToken(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      try {
        await authService.updateUser(updatedUser);
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
  };

  const refreshUserProfile = async (): Promise<User | null> => {
    try {
      const userData = await authService.fetchUserProfile();
      
      if (userData) {
        setUser(userData);
        return userData;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error refreshing user profile:', error);
      
      // If 401, clear auth
      if (error.response?.status === 401) {
        await clearStoredAuth();
      }
      
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    register,
    updateUser,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export User type for convenience
export type { User }; 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import authService, { User } from '../services/authService';
import { autoRatingNotificationService } from '../services/AutoRatingNotificationService';
import { eventTicketNotificationService } from '../services/EventTicketNotificationService';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateProfileImage: (imageUri: string) => Promise<void>;
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
      
      // Verificar tickets do usuário para agendar notificações
      if (authState.user?.id) {
        try {
          // Agendar notificações de avaliação (24h após eventos)
          await autoRatingNotificationService.scheduleNotificationsForUserTickets(authState.user.id);
          console.log('✅ Notificações de avaliação agendadas');
          
          // Agendar notificações de ingressos (1h antes de eventos)
          await eventTicketNotificationService.scheduleNotificationsForUserTickets(authState.user.id);
          console.log('✅ Notificações de ingressos agendadas');
        } catch (error) {
          console.log('⚠️ Erro ao agendar notificações:', error);
        }
      }
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

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não está logado');
    }

    try {
      // Otimistic update - atualizar UI imediatamente
      const optimisticUser = { ...user, ...userData };
      setUser(optimisticUser);
      
      // Enviar para o backend
      const updatedUser = await authService.updateUser(userData);
      
      // Atualizar com dados reais do backend
      setUser(updatedUser);
      
      console.log('✅ AuthContext: User updated successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error updating user:', error);
      
      // Reverter para dados originais se houve erro
      setUser(user);
      throw error;
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

  const updateProfileImage = async (imageUri: string): Promise<void> => {
    if (!user) {
      throw new Error('Usuário não está logado');
    }

    try {
      console.log('🚀 AuthContext: Starting profile image update...', { imageUri });
      
      // Import the profile image service
      const { uploadAndUpdateProfileImage } = await import('../services/profileImageService');
      
      // Upload image and update backend
      const imageUrl = await uploadAndUpdateProfileImage(imageUri);
      
      // Update local state
      const updatedUser = { ...user, profileImage: imageUrl };
      setUser(updatedUser);
      
      // Update local storage
      await authService.updateUserLocal(updatedUser);
      
      console.log('✅ AuthContext: Profile image updated successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error updating profile image:', error);
      throw error;
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
    updateProfileImage,
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
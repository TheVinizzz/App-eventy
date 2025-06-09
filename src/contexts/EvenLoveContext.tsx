import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  EvenLoveProfile, 
  EvenLoveMatch, 
  EvenLoveSettings, 
  EvenLoveStats,
  EvenLoveFilters 
} from '../types/evenLove';
import evenLoveService from '../services/evenLoveService';
import websocketService from '../services/websocketService';

interface EvenLoveContextType {
  // Profile State
  profile: EvenLoveProfile | null;
  isProfileLoading: boolean;
  profileError: string | null;
  
  // Matches State
  matches: EvenLoveMatch[];
  isMatchesLoading: boolean;
  matchesError: string | null;
  unreadMatchesCount: number;
  
  // Discovery State
  profiles: EvenLoveProfile[];
  isProfilesLoading: boolean;
  profilesError: string | null;
  currentProfileIndex: number;
  
  // Settings State
  settings: EvenLoveSettings | null;
  isSettingsLoading: boolean;
  settingsError: string | null;
  
  // Stats State
  stats: EvenLoveStats | null;
  isStatsLoading: boolean;
  statsError: string | null;
  
  // Actions
  loadProfile: (eventId: string) => Promise<void>;
  createProfile: (eventId: string, profileData: any) => Promise<void>;
  updateProfile: (eventId: string, profileData: Partial<EvenLoveProfile>) => Promise<void>;
  
  loadMatches: (eventId: string) => Promise<void>;
  loadProfiles: (eventId: string, filters?: EvenLoveFilters) => Promise<void>;
  swipeProfile: (eventId: string, targetProfileId: string, action: 'pass' | 'like' | 'super_like') => Promise<{ isMatch: boolean; match?: EvenLoveMatch }>;
  
  loadSettings: (eventId: string) => Promise<void>;
  updateSettings: (eventId: string, settings: Partial<EvenLoveSettings>) => Promise<void>;
  
  loadStats: (eventId: string) => Promise<void>;
  
  // Utility
  resetState: () => void;
  checkEligibility: (eventId: string) => Promise<{ isEligible: boolean; reason?: string }>;
}

const EvenLoveContext = createContext<EvenLoveContextType | undefined>(undefined);

interface EvenLoveProviderProps {
  children: ReactNode;
}

export const EvenLoveProvider: React.FC<EvenLoveProviderProps> = ({ children }) => {
  // Profile State
  const [profile, setProfile] = useState<EvenLoveProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Matches State
  const [matches, setMatches] = useState<EvenLoveMatch[]>([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0);
  
  // Discovery State
  const [profiles, setProfiles] = useState<EvenLoveProfile[]>([]);
  const [isProfilesLoading, setIsProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  
  // Settings State
  const [settings, setSettings] = useState<EvenLoveSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  
  // Stats State
  const [stats, setStats] = useState<EvenLoveStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Profile Actions
  const loadProfile = async (eventId: string) => {
    setIsProfileLoading(true);
    setProfileError(null);
    
    try {
      const profileData = await evenLoveService.getProfile(eventId);
      setProfile(profileData);
    } catch (error: any) {
      setProfileError(error.message || 'Erro ao carregar perfil');
      console.error('Error loading profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const createProfile = async (eventId: string, profileData: any) => {
    setIsProfileLoading(true);
    setProfileError(null);
    
    try {
      const newProfile = await evenLoveService.createProfile(eventId, profileData);
      setProfile(newProfile);
    } catch (error: any) {
      setProfileError(error.message || 'Erro ao criar perfil');
      console.error('Error creating profile:', error);
      throw error;
    } finally {
      setIsProfileLoading(false);
    }
  };

  const updateProfile = async (eventId: string, profileData: Partial<EvenLoveProfile>) => {
    setIsProfileLoading(true);
    setProfileError(null);
    
    try {
      const updatedProfile = await evenLoveService.updateProfile(eventId, profileData);
      setProfile(updatedProfile);
    } catch (error: any) {
      setProfileError(error.message || 'Erro ao atualizar perfil');
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Matches Actions
  const loadMatches = async (eventId: string) => {
    setIsMatchesLoading(true);
    setMatchesError(null);
    
    try {
      const matchesData = await evenLoveService.getMatches(eventId);
      setMatches(matchesData);
      
      // Calculate unread count
      const unreadCount = matchesData.reduce((total, match) => total + (match.unreadCount || 0), 0);
      setUnreadMatchesCount(unreadCount);
    } catch (error: any) {
      setMatchesError(error.message || 'Erro ao carregar matches');
      console.error('Error loading matches:', error);
    } finally {
      setIsMatchesLoading(false);
    }
  };

  // Discovery Actions
  const loadProfiles = async (eventId: string, filters?: EvenLoveFilters) => {
    console.log('🔍 EvenLoveContext: Iniciando carregamento de perfis para evento:', eventId);
    setIsProfilesLoading(true);
    setProfilesError(null);
    
    try {
      console.log('📡 EvenLoveContext: Fazendo chamada ao serviço...');
      const profilesData = await evenLoveService.getProfiles(eventId, filters);
      
      console.log('✅ EvenLoveContext: Perfis carregados:', {
        total: Array.isArray(profilesData) ? profilesData.length : 0,
        type: typeof profilesData,
        isArray: Array.isArray(profilesData),
        profiles: Array.isArray(profilesData) ? profilesData.map(p => ({ id: p.id, name: p.displayName })) : []
      });
      
      setProfiles(profilesData || []);
      setCurrentProfileIndex(0);
      
      // Connect to WebSocket for real-time updates
      try {
        await websocketService.connect(eventId);
        
        // Listen for new matches
        websocketService.on('match:new', (match) => {
          setMatches(prev => [match, ...prev]);
          setUnreadMatchesCount(prev => prev + 1);
        });
      } catch (wsError) {
        console.warn('WebSocket connection failed:', wsError);
        // Continue without real-time features
      }
    } catch (error: any) {
      console.error('❌ EvenLoveContext: Erro ao carregar perfis:', error);
      
      let errorMessage = 'Erro ao carregar perfis';
      
      if (error.response?.status === 404) {
        errorMessage = 'Nenhum perfil encontrado para este evento';
        setProfiles([]); // Define array vazio para 404
      } else if (error.response?.status === 403) {
        errorMessage = 'Você precisa ter um ingresso válido para ver perfis';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet';
      } else {
        errorMessage = error.message || 'Erro ao carregar perfis';
      }
      
      setProfilesError(errorMessage);
    } finally {
      setIsProfilesLoading(false);
    }
  };

  const swipeProfile = async (eventId: string, targetProfileId: string, action: 'pass' | 'like' | 'super_like') => {
    try {
      const result = await evenLoveService.swipeProfile(eventId, targetProfileId, action);
      
      // Move to next profile
      setCurrentProfileIndex(prev => prev + 1);
      
      // If it's a match, update matches list
      if (result.isMatch && result.match) {
        setMatches(prev => [result.match!, ...prev]);
        setUnreadMatchesCount(prev => prev + 1);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error swiping profile:', error);
      throw error;
    }
  };

  // Settings Actions
  const loadSettings = async (eventId: string) => {
    setIsSettingsLoading(true);
    setSettingsError(null);
    
    try {
      const settingsData = await evenLoveService.getSettings(eventId);
      setSettings(settingsData);
    } catch (error: any) {
      setSettingsError(error.message || 'Erro ao carregar configurações');
      console.error('Error loading settings:', error);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const updateSettings = async (eventId: string, settingsData: Partial<EvenLoveSettings>) => {
    setIsSettingsLoading(true);
    setSettingsError(null);
    
    try {
      const updatedSettings = await evenLoveService.updateSettings(eventId, settingsData);
      setSettings(updatedSettings);
    } catch (error: any) {
      setSettingsError(error.message || 'Erro ao atualizar configurações');
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      setIsSettingsLoading(false);
    }
  };

  // Stats Actions
  const loadStats = async (eventId: string) => {
    setIsStatsLoading(true);
    setStatsError(null);
    
    try {
      const statsData = await evenLoveService.getStats(eventId);
      setStats(statsData);
    } catch (error: any) {
      setStatsError(error.message || 'Erro ao carregar estatísticas');
      console.error('Error loading stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Utility Actions
  const resetState = () => {
    setProfile(null);
    setMatches([]);
    setProfiles([]);
    setSettings(null);
    setStats(null);
    setCurrentProfileIndex(0);
    setUnreadMatchesCount(0);
    
    // Reset errors
    setProfileError(null);
    setMatchesError(null);
    setProfilesError(null);
    setSettingsError(null);
    setStatsError(null);
    
    // Disconnect WebSocket
    websocketService.disconnect();
  };

  const checkEligibility = async (eventId: string) => {
    try {
      return await evenLoveService.checkEligibility(eventId);
    } catch (error: any) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  };

  const contextValue: EvenLoveContextType = {
    // Profile State
    profile,
    isProfileLoading,
    profileError,
    
    // Matches State
    matches,
    isMatchesLoading,
    matchesError,
    unreadMatchesCount,
    
    // Discovery State
    profiles,
    isProfilesLoading,
    profilesError,
    currentProfileIndex,
    
    // Settings State
    settings,
    isSettingsLoading,
    settingsError,
    
    // Stats State
    stats,
    isStatsLoading,
    statsError,
    
    // Actions
    loadProfile,
    createProfile,
    updateProfile,
    loadMatches,
    loadProfiles,
    swipeProfile,
    loadSettings,
    updateSettings,
    loadStats,
    resetState,
    checkEligibility,
  };

  return (
    <EvenLoveContext.Provider value={contextValue}>
      {children}
    </EvenLoveContext.Provider>
  );
};

export const useEvenLove = (): EvenLoveContextType => {
  const context = useContext(EvenLoveContext);
  if (context === undefined) {
    throw new Error('useEvenLove must be used within an EvenLoveProvider');
  }
  return context;
}; 
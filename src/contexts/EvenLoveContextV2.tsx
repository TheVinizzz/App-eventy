import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { EvenLoveProfile, EvenLoveMatch, EvenLoveFilters, EvenLoveSettings, EvenLoveStats } from '../types/evenLove';
import evenLoveService from '../services/evenLoveService';
import websocketService from '../services/websocketService';

// 🏗️ ESTRUTURA DE ESTADO AVANÇADA
interface EvenLoveState {
  // Cache Management
  lastFetchedEventId: string | null;
  cacheTimestamp: number;
  
  // Profile Management
  profile: EvenLoveProfile | null;
  profileStatus: 'idle' | 'loading' | 'success' | 'error';
  profileError: string | null;
  
  // Discovery Engine
  profiles: EvenLoveProfile[];
  profilesStatus: 'idle' | 'loading' | 'success' | 'error';
  profilesError: string | null;
  currentProfileIndex: number;
  swipeHistory: string[];
  
  // Matches System
  matches: EvenLoveMatch[];
  matchesStatus: 'idle' | 'loading' | 'success' | 'error';
  matchesError: string | null;
  unreadMatchesCount: number;
  
  // Settings & Configuration
  settings: EvenLoveSettings | null;
  settingsStatus: 'idle' | 'loading' | 'success' | 'error';
  settingsError: string | null;
  
  // Analytics & Stats
  stats: EvenLoveStats | null;
  statsStatus: 'idle' | 'loading' | 'success' | 'error';
  statsError: string | null;
  
  // WebSocket Status
  isConnected: boolean;
  connectionError: string | null;
}

// 🚀 ACTIONS DEFINITIVAS
type EvenLoveAction =
  | { type: 'SET_EVENT_CONTEXT'; payload: { eventId: string; timestamp: number } }
  | { type: 'PROFILE_LOADING' }
  | { type: 'PROFILE_SUCCESS'; payload: EvenLoveProfile }
  | { type: 'PROFILE_ERROR'; payload: string }
  | { type: 'PROFILES_LOADING' }
  | { type: 'PROFILES_SUCCESS'; payload: EvenLoveProfile[] }
  | { type: 'PROFILES_ERROR'; payload: string }
  | { type: 'SWIPE_PROFILE'; payload: { profileId: string; newIndex: number } }
  | { type: 'MATCHES_LOADING' }
  | { type: 'MATCHES_SUCCESS'; payload: { matches: EvenLoveMatch[]; unreadCount: number } }
  | { type: 'MATCHES_ERROR'; payload: string }
  | { type: 'NEW_MATCH'; payload: EvenLoveMatch }
  | { type: 'SETTINGS_LOADING' }
  | { type: 'SETTINGS_SUCCESS'; payload: EvenLoveSettings }
  | { type: 'SETTINGS_ERROR'; payload: string }
  | { type: 'STATS_LOADING' }
  | { type: 'STATS_SUCCESS'; payload: EvenLoveStats }
  | { type: 'STATS_ERROR'; payload: string }
  | { type: 'WEBSOCKET_CONNECTED' }
  | { type: 'WEBSOCKET_DISCONNECTED'; payload?: string }
  | { type: 'RESET_ALL' };

// 🧠 REDUCER INTELIGENTE
const evenLoveReducer = (state: EvenLoveState, action: EvenLoveAction): EvenLoveState => {
  switch (action.type) {
    case 'SET_EVENT_CONTEXT':
      return {
        ...state,
        lastFetchedEventId: action.payload.eventId,
        cacheTimestamp: action.payload.timestamp,
      };

    case 'PROFILE_LOADING':
      return { ...state, profileStatus: 'loading', profileError: null };
    case 'PROFILE_SUCCESS':
      return { ...state, profileStatus: 'success', profile: action.payload, profileError: null };
    case 'PROFILE_ERROR':
      return { ...state, profileStatus: 'error', profileError: action.payload };

    case 'PROFILES_LOADING':
      return { ...state, profilesStatus: 'loading', profilesError: null };
    case 'PROFILES_SUCCESS':
      return { 
        ...state, 
        profilesStatus: 'success', 
        profiles: action.payload, 
        profilesError: null,
        currentProfileIndex: 0,
        swipeHistory: []
      };
    case 'PROFILES_ERROR':
      return { ...state, profilesStatus: 'error', profilesError: action.payload };

    case 'SWIPE_PROFILE':
      return {
        ...state,
        currentProfileIndex: action.payload.newIndex,
        swipeHistory: [...state.swipeHistory, action.payload.profileId],
      };

    case 'MATCHES_LOADING':
      return { ...state, matchesStatus: 'loading', matchesError: null };
    case 'MATCHES_SUCCESS':
      return { 
        ...state, 
        matchesStatus: 'success', 
        matches: action.payload.matches,
        unreadMatchesCount: action.payload.unreadCount,
        matchesError: null 
      };
    case 'MATCHES_ERROR':
      return { ...state, matchesStatus: 'error', matchesError: action.payload };

    case 'NEW_MATCH':
      return {
        ...state,
        matches: [action.payload, ...state.matches],
        unreadMatchesCount: state.unreadMatchesCount + 1,
      };

    case 'SETTINGS_LOADING':
      return { ...state, settingsStatus: 'loading', settingsError: null };
    case 'SETTINGS_SUCCESS':
      return { ...state, settingsStatus: 'success', settings: action.payload, settingsError: null };
    case 'SETTINGS_ERROR':
      return { ...state, settingsStatus: 'error', settingsError: action.payload };

    case 'STATS_LOADING':
      return { ...state, statsStatus: 'loading', statsError: null };
    case 'STATS_SUCCESS':
      return { ...state, statsStatus: 'success', stats: action.payload, statsError: null };
    case 'STATS_ERROR':
      return { ...state, statsStatus: 'error', statsError: action.payload };

    case 'WEBSOCKET_CONNECTED':
      return { ...state, isConnected: true, connectionError: null };
    case 'WEBSOCKET_DISCONNECTED':
      return { ...state, isConnected: false, connectionError: action.payload || null };

    case 'RESET_ALL':
      return initialState;

    default:
      return state;
  }
};

// 🎯 ESTADO INICIAL
const initialState: EvenLoveState = {
  lastFetchedEventId: null,
  cacheTimestamp: 0,
  profile: null,
  profileStatus: 'idle',
  profileError: null,
  profiles: [],
  profilesStatus: 'idle',
  profilesError: null,
  currentProfileIndex: 0,
  swipeHistory: [],
  matches: [],
  matchesStatus: 'idle',
  matchesError: null,
  unreadMatchesCount: 0,
  settings: null,
  settingsStatus: 'idle',
  settingsError: null,
  stats: null,
  statsStatus: 'idle',
  statsError: null,
  isConnected: false,
  connectionError: null,
};

// 🌟 CONTEXTO INTERFACE
interface EvenLoveContextType {
  // State Getters
  state: EvenLoveState;
  
  // Computed Values
  isLoading: boolean;
  hasError: boolean;
  currentProfile: EvenLoveProfile | null;
  hasMoreProfiles: boolean;
  
  // Core Actions
  initializeEvent: (eventId: string) => Promise<void>;
  refreshData: (eventId: string) => Promise<void>;
  
  // Profile Management
  loadProfile: (eventId: string) => Promise<void>;
  createProfile: (eventId: string, profileData: any) => Promise<void>;
  updateProfile: (eventId: string, profileData: Partial<EvenLoveProfile>) => Promise<void>;
  
  // Discovery Engine
  loadProfiles: (eventId: string, filters?: EvenLoveFilters) => Promise<void>;
  swipeProfile: (eventId: string, targetProfileId: string, action: 'pass' | 'like' | 'super_like') => Promise<{ isMatch: boolean; match?: EvenLoveMatch }>;
  
  // Matches System
  loadMatches: (eventId: string) => Promise<void>;
  
  // Settings & Stats
  loadSettings: (eventId: string) => Promise<void>;
  updateSettings: (eventId: string, settings: Partial<EvenLoveSettings>) => Promise<void>;
  loadStats: (eventId: string) => Promise<void>;
  
  // Utilities
  checkEligibility: (eventId: string) => Promise<{ isEligible: boolean; reason?: string }>;
  resetState: () => void;
  disconnectWebSocket: () => void;
}

const EvenLoveContext = createContext<EvenLoveContextType | undefined>(undefined);

// 🏭 PROVIDER DE ALTA PERFORMANCE
export const EvenLoveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(evenLoveReducer, initialState);
  const wsConnectedRef = useRef(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // 🔥 CACHE INTELIGENTE
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const isCacheValid = useCallback((eventId: string) => {
    return state.lastFetchedEventId === eventId && 
           Date.now() - state.cacheTimestamp < CACHE_DURATION;
  }, [state.lastFetchedEventId, state.cacheTimestamp]);

  // 🚀 INICIALIZAÇÃO INTELIGENTE
  const initializeEvent = useCallback(async (eventId: string) => {
    // Prevent multiple simultaneous initializations
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    if (isCacheValid(eventId)) {
      console.log('🎯 EvenLove: Usando cache válido para evento:', eventId);
      return;
    }

    console.log('🚀 EvenLove: Inicializando evento:', eventId);
    
    initPromiseRef.current = (async () => {
      try {
        dispatch({ type: 'SET_EVENT_CONTEXT', payload: { eventId, timestamp: Date.now() } });
        
        // Load data in parallel for maximum performance
        await Promise.allSettled([
          loadProfile(eventId),
          loadProfiles(eventId),
          loadMatches(eventId),
          setupWebSocket(eventId),
        ]);
        
      } catch (error) {
        console.error('❌ EvenLove: Erro na inicialização:', error);
      } finally {
        initPromiseRef.current = null;
      }
    })();

    return initPromiseRef.current;
  }, [isCacheValid]);

  // 🔄 REFRESH INTELIGENTE
  const refreshData = useCallback(async (eventId: string) => {
    console.log('🔄 EvenLove: Atualizando dados para evento:', eventId);
    
    await Promise.allSettled([
      loadProfiles(eventId),
      loadMatches(eventId),
    ]);
  }, []);

  // 👤 GERENCIAMENTO DE PERFIL
  const loadProfile = useCallback(async (eventId: string) => {
    if (state.profileStatus === 'loading') return;

    dispatch({ type: 'PROFILE_LOADING' });
    try {
      const profile = await evenLoveService.getProfile(eventId);
      dispatch({ type: 'PROFILE_SUCCESS', payload: profile });
    } catch (error: any) {
      const errorMessage = error.response?.status === 404 
        ? 'Perfil não encontrado' 
        : error.message || 'Erro ao carregar perfil';
      dispatch({ type: 'PROFILE_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.profileStatus]);

  const createProfile = useCallback(async (eventId: string, profileData: any) => {
    dispatch({ type: 'PROFILE_LOADING' });
    try {
      const profile = await evenLoveService.createProfile(eventId, profileData);
      dispatch({ type: 'PROFILE_SUCCESS', payload: profile });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao criar perfil';
      dispatch({ type: 'PROFILE_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (eventId: string, profileData: Partial<EvenLoveProfile>) => {
    dispatch({ type: 'PROFILE_LOADING' });
    try {
      const profile = await evenLoveService.updateProfile(eventId, profileData);
      dispatch({ type: 'PROFILE_SUCCESS', payload: profile });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao atualizar perfil';
      dispatch({ type: 'PROFILE_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  // 🔍 SISTEMA DE DESCOBERTA
  const loadProfiles = useCallback(async (eventId: string, filters?: EvenLoveFilters) => {
    if (state.profilesStatus === 'loading') return;

    dispatch({ type: 'PROFILES_LOADING' });
    try {
      const profiles = await evenLoveService.getProfiles(eventId, filters);
      dispatch({ type: 'PROFILES_SUCCESS', payload: profiles });
    } catch (error: any) {
      const errorMessage = error.response?.status === 404 
        ? 'Nenhum perfil encontrado para este evento'
        : error.message || 'Erro ao carregar perfis';
      dispatch({ type: 'PROFILES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.profilesStatus]);

  const swipeProfile = useCallback(async (
    eventId: string, 
    targetProfileId: string, 
    action: 'pass' | 'like' | 'super_like'
  ) => {
    try {
      const result = await evenLoveService.swipeProfile(eventId, targetProfileId, action);
      
      // Update local state
      const newIndex = state.currentProfileIndex + 1;
      dispatch({ type: 'SWIPE_PROFILE', payload: { profileId: targetProfileId, newIndex } });
      
      // Handle match
      if (result.isMatch && result.match) {
        dispatch({ type: 'NEW_MATCH', payload: result.match });
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ EvenLove: Erro ao dar swipe:', error);
      throw error;
    }
  }, [state.currentProfileIndex]);

  // 💕 SISTEMA DE MATCHES
  const loadMatches = useCallback(async (eventId: string) => {
    if (state.matchesStatus === 'loading') return;

    dispatch({ type: 'MATCHES_LOADING' });
    try {
      const matches = await evenLoveService.getMatches(eventId);
      const unreadCount = matches.reduce((total, match) => total + (match.unreadCount || 0), 0);
      dispatch({ type: 'MATCHES_SUCCESS', payload: { matches, unreadCount } });
    } catch (error: any) {
      const errorMessage = error.response?.status === 404 
        ? 'Nenhum match encontrado'
        : error.message || 'Erro ao carregar matches';
      dispatch({ type: 'MATCHES_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.matchesStatus]);

  // ⚙️ CONFIGURAÇÕES E ESTATÍSTICAS
  const loadSettings = useCallback(async (eventId: string) => {
    if (state.settingsStatus === 'loading') return;

    dispatch({ type: 'SETTINGS_LOADING' });
    try {
      const settings = await evenLoveService.getSettings(eventId);
      dispatch({ type: 'SETTINGS_SUCCESS', payload: settings });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao carregar configurações';
      dispatch({ type: 'SETTINGS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.settingsStatus]);

  const updateSettings = useCallback(async (eventId: string, settingsData: Partial<EvenLoveSettings>) => {
    dispatch({ type: 'SETTINGS_LOADING' });
    try {
      const settings = await evenLoveService.updateSettings(eventId, settingsData);
      dispatch({ type: 'SETTINGS_SUCCESS', payload: settings });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao atualizar configurações';
      dispatch({ type: 'SETTINGS_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const loadStats = useCallback(async (eventId: string) => {
    if (state.statsStatus === 'loading') return;

    dispatch({ type: 'STATS_LOADING' });
    try {
      const stats = await evenLoveService.getStats(eventId);
      dispatch({ type: 'STATS_SUCCESS', payload: stats });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao carregar estatísticas';
      dispatch({ type: 'STATS_ERROR', payload: errorMessage });
      throw error;
    }
  }, [state.statsStatus]);

  // 🔌 WEBSOCKET INTELIGENTE
  const setupWebSocket = useCallback(async (eventId: string) => {
    if (wsConnectedRef.current) return;

    try {
      await websocketService.connect(eventId);
      wsConnectedRef.current = true;
      dispatch({ type: 'WEBSOCKET_CONNECTED' });

      // Listen for new matches
      websocketService.on('match:new', (match: EvenLoveMatch) => {
        dispatch({ type: 'NEW_MATCH', payload: match });
      });

      // Listen for profile updates (when implemented)
      // websocketService.on('profile:updated', (profile: EvenLoveProfile) => {
      //   dispatch({ type: 'PROFILE_SUCCESS', payload: profile });
      // });

    } catch (error: any) {
      console.warn('🔌 EvenLove: WebSocket falhou, continuando sem tempo real:', error);
      dispatch({ type: 'WEBSOCKET_DISCONNECTED', payload: error.message });
    }
  }, []);

  // 🔐 UTILITÁRIOS
  const checkEligibility = useCallback(async (eventId: string) => {
    return await evenLoveService.checkEligibility(eventId);
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
    wsConnectedRef.current = false;
    initPromiseRef.current = null;
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsConnectedRef.current) {
      websocketService.disconnect();
      wsConnectedRef.current = false;
      dispatch({ type: 'WEBSOCKET_DISCONNECTED' });
    }
  }, []);

  // 🧮 VALORES COMPUTADOS
  const isLoading = state.profileStatus === 'loading' || 
                   state.profilesStatus === 'loading' || 
                   state.matchesStatus === 'loading';

  const hasError = !!state.profileError || !!state.profilesError || !!state.matchesError;

  const currentProfile = state.profiles[state.currentProfileIndex] || null;

  const hasMoreProfiles = state.currentProfileIndex < state.profiles.length - 1;

  const contextValue: EvenLoveContextType = {
    state,
    isLoading,
    hasError,
    currentProfile,
    hasMoreProfiles,
    initializeEvent,
    refreshData,
    loadProfile,
    createProfile,
    updateProfile,
    loadProfiles,
    swipeProfile,
    loadMatches,
    loadSettings,
    updateSettings,
    loadStats,
    checkEligibility,
    resetState,
    disconnectWebSocket,
  };

  return (
    <EvenLoveContext.Provider value={contextValue}>
      {children}
    </EvenLoveContext.Provider>
  );
};

// 🎣 HOOK PERSONALIZADO
export const useEvenLove = (): EvenLoveContextType => {
  const context = useContext(EvenLoveContext);
  if (!context) {
    throw new Error('useEvenLove must be used within an EvenLoveProvider');
  }
  return context;
};

export default EvenLoveContext; 
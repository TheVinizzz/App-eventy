export const APP_CONFIG = {
  API_URL: {
    DEVELOPMENT: 'https://db25-2804-1b0-f388-5f7c-a93d-9bae-3413-9ad.ngrok-free.app',
    PRODUCTION: 'http://localhost:3333', // Update this to your production URL when available
  },
  WS_URL: {
    DEVELOPMENT: 'wss://db25-2804-1b0-f388-5f7c-a93d-9bae-3413-9ad.ngrok-free.app',
    PRODUCTION: 'ws://localhost:3333',
  },
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@eventy:auth_token',
  USER_DATA: '@eventy:user_data',
  REFRESH_TOKEN: '@eventy:refresh_token',
  ONBOARDING_COMPLETED: '@eventy:onboarding_completed',
  THEME_PREFERENCE: 'theme_preference',
} as const;

export const NAVIGATION = {
  SCREENS: {
    HOME: 'Home',
    SEARCH: 'Search',
    TICKETS: 'Tickets',
    COMMUNITY: 'Community',
    PROFILE: 'Profile',
  },
  TAB_LABELS: {
    HOME: 'Início',
    SEARCH: 'Buscar',
    TICKETS: 'Ingressos',
    COMMUNITY: 'Comunidade',
    PROFILE: 'Perfil',
  },
} as const;

export const EVENT_TYPES = {
  NORMAL: 'NORMAL',
  PREMIUM: 'PREMIUM',
  SHOW: 'SHOW',
  SPORTS: 'SPORTS',
  THEATER: 'THEATER',
  FOOTBALL: 'FOOTBALL',
  FESTIVAL: 'FESTIVAL',
} as const;

export const ANIMATIONS = {
  DURATION: {
    SHORT: 300,
    MEDIUM: 600,
    LONG: 1000,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

export const API_CONFIG = {
  BASE_URL: 'https://api.eventy.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

export const NAVIGATION_ROUTES = {
  HOME: 'Home',
  SEARCH: 'Search',
  TICKETS: 'Tickets',
  COMMUNITY: 'Community',
  PROFILE: 'Profile',
  EVENT_DETAILS: 'EventDetails',
  AUTH: 'Auth',
} as const;

export const EVENT_CATEGORIES = [
  { id: 'music', name: 'Música', icon: 'musical-notes' },
  { id: 'sports', name: 'Esportes', icon: 'football' },
  { id: 'tech', name: 'Tecnologia', icon: 'laptop' },
  { id: 'food', name: 'Gastronomia', icon: 'restaurant' },
  { id: 'art', name: 'Arte', icon: 'color-palette' },
  { id: 'business', name: 'Negócios', icon: 'briefcase' },
] as const;

export const APP_CONFIG_ADDITIONAL = {
  NAME: 'Eventy',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@eventy.com',
  TERMS_URL: 'https://eventy.com/terms',
  PRIVACY_URL: 'https://eventy.com/privacy',
} as const; 
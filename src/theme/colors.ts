export const colors = {
  brand: {
    primary: '#FFD700',     // Gold
    secondary: '#FFC107',   // Amber/gold
    action: '#FFAB00',      // Amber accent
    background: '#0A0A0A',  // Deep black
    card: '#121212',        // Slightly lighter black for cards
    darkGray: '#1E1E1E',    // Dark gray for UI elements
    textPrimary: '#FFFFFF', // White for main text
    textSecondary: '#B0B0B0', // Light gray for secondary text
    textTertiary: '#808080', // Light gray for tertiary text
    accent: '#FFD700',      // Gold accent
    inputBg: 'rgba(0, 0, 0, 0.3)', // Dark background for inputs
    success: '#4CAF50',
    error: '#FF4444',        // Red for errors
    warning: '#FF9800',
    info: '#2196F3',
  },
  gradients: {
    primary: ['#FFD700', '#FFC107'],
    dark: ['#0A0A0A', '#1E1E1E'],
    card: ['rgba(18, 18, 18, 0.95)', 'rgba(30, 30, 30, 0.95)'],
  },
  opacity: {
    overlay: 'rgba(0, 0, 0, 0.7)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  }
};

export type Colors = typeof colors; 
// Oracle Trading Mobile App - Theme Configuration
// Matches the web app's glassmorphism design system

export const colors = {
  // Primary
  primary: '#14B8A6',      // Teal-500
  primaryDark: '#0D9488',  // Teal-600
  primaryLight: '#2DD4BF', // Teal-400
  
  // Background
  background: '#050505',
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  
  // Glass effects
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',  // Slate-400
  textMuted: '#64748B',      // Slate-500
  
  // Status
  success: '#22C55E',  // Green-500
  danger: '#EF4444',   // Red-500
  warning: '#F59E0B',  // Amber-500
  info: '#3B82F6',     // Blue-500
  
  // Chart colors
  bullish: '#22C55E',
  bearish: '#EF4444',
  neutral: '#94A3B8',
  
  // Accent colors
  purple: '#A855F7',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  rose: '#F43F5E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

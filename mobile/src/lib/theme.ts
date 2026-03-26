export const colors = {
  accent: {
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  bg: {
    base: '#ffffff',
    surface: '#f7f7f7',
    elevated: '#ffffff',
  },
  text: {
    primary: '#1a1a2e',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
  },
  border: {
    default: 'rgba(0,0,0,0.08)',
  },
  status: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

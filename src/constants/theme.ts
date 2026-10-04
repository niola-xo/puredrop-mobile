export const Colors = {
  primary: '#0099ff', // Frutiger glossy blue
  primaryDark: '#0061a5',
  primaryDeep: '#004780',
  primaryLight: '#e1f3ff',
  primaryBorder: '#9bd7ff',
  primaryAccent: '#38b6ff',
  background: '#cae8ff', // Web water sky background
  backgroundSubtle: '#dcf0ff',
  surface: '#ffffff',
  surfaceGlass: 'rgba(255, 255, 255, 0.82)',
  surfaceGlassSecondary: 'rgba(255, 255, 255, 0.65)',
  surfaceSubtle: '#f0f9ff',
  text: '#001d35', // Pure deep navy text matching web
  textSecondary: '#3f4753',
  textMuted: '#64748b',
  border: 'rgba(255, 255, 255, 0.95)',
  borderGlass: 'rgba(255, 255, 255, 0.85)',
  borderSubtle: '#bae6fd',
  badgeTealBg: '#3cf9dc',
  badgeTealText: '#007061',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
  success: '#10b981',
  successLight: '#ecfdf5',
  successBorder: '#a7f3d0',
} as const;

export const Shadows = {
  glassPanel: {
    shadowColor: '#0073cc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
  },
  buttonGloss: {
    shadowColor: '#0099ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    shadowColor: '#001d35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

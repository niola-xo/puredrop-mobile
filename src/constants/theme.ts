export const Colors = {
  primary: '#0284c7', // vibrant ocean blue
  primaryDark: '#0369a1',
  primaryLight: '#f0f9ff',
  primaryBorder: '#bae6fd',
  primaryAccent: '#38bdf8',
  background: '#f8fafc', // smooth slate background
  surface: '#ffffff',
  surfaceSubtle: '#f1f5f9',
  text: '#0f172a', // deep navy text
  textSecondary: '#334155',
  textMuted: '#64748b',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',
  success: '#10b981',
  successLight: '#ecfdf5',
  successBorder: '#a7f3d0',
} as const;

export const Shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

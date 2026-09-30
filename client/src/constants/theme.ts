export const Colors = {
  background: '#FBFBF9',
  card: '#FFFFFF',
  primary: '#134E39', // Dark forest green from reference image
  primaryDark: '#0D3527',
  primaryLight: '#EBF5F0', // Soft mint tint from expanded reference card
  primaryDisabled: '#8FAAA0',
  sageGreen: '#78988C',
  accent: '#C49746', // Golden ochre / amber
  noticeBg: '#FEF9EE',
  noticeBorder: '#FDE68A',
  noticeText: '#92400E',
  text: '#0F1E2E',
  textMuted: '#5F6D7E',
  textSubtle: '#94A3B8',
  border: '#E2E8F0',
  borderFocus: '#134E39',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  errorBorder: '#FCA5A5',
  success: '#16A34A',
  successLight: '#F0FDF4',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  bodyMuted: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: Colors.textMuted,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

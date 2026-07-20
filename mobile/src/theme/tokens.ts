/**
 * doc 10-16: design tokens ported 1:1 from the design-system docs and the
 * Stage 2/3 HTML mockups/UI kit — this file is the single source of truth
 * every component imports from, never a raw hex/px value inline (doc 10's
 * governance rule).
 */

export const colors = {
  night: '#12162A',
  night1: '#181D33',
  night2: '#1F2540',
  stone: '#EDEDE6',
  linen: '#F7F4EC',
  white: '#FFFFFF',
  wheat: '#D9A441',
  wheatSoft: '#F0D9A8',
  chicory: '#5B7FB8',
  chicorySoft: '#DCE5F3',
  chornozem: '#2B2620',
  textPrimary: '#2B2620',
  textSecondary: '#6B655A',
  textPrimaryDark: '#F2F0E8',
  textSecondaryDark: '#A7A290',
  success: '#4C8C5A',
  error: '#C0483B',
  warning: '#C98A2E',
  border: '#E2DFD3',
} as const;

export const radius = { small: 8, medium: 16, full: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** doc 13: Fixel Display / Golos Text — bundled as expo-font assets in a real build;
 * system font fallback here so the app still renders correctly without the font files present. */
export const typography = {
  display: { fontFamily: 'System', fontWeight: '700' as const },
  body: { fontFamily: 'System', fontWeight: '400' as const },
  mono: { fontFamily: 'Courier', fontWeight: '400' as const },
  scale: {
    displayXl: { fontSize: 34, lineHeight: 40 },
    displayLg: { fontSize: 28, lineHeight: 34 },
    displayMd: { fontSize: 22, lineHeight: 28 },
    bodyLg: { fontSize: 17, lineHeight: 24 },
    bodyMd: { fontSize: 15, lineHeight: 20 },
    bodySm: { fontSize: 13, lineHeight: 18 },
    labelMd: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
    labelSm: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  },
} as const;

/** doc 16: motion tokens — durations in ms, matched to the animation choreography doc. */
export const motion = {
  instant: 100,
  fast: 180,
  base: 240,
  slow: 400,
  ambient: 1200,
} as const;

export type ThemeMode = 'light' | 'dark';

export function themeFor(mode: ThemeMode) {
  return {
    mode,
    background: mode === 'dark' ? colors.night : colors.stone,
    surface: mode === 'dark' ? colors.night1 : colors.linen,
    surfaceElevated: mode === 'dark' ? colors.night2 : colors.white,
    text: mode === 'dark' ? colors.textPrimaryDark : colors.textPrimary,
    textSecondary: mode === 'dark' ? colors.textSecondaryDark : colors.textSecondary,
    accent: colors.wheat,
    accentSecondary: colors.chicory,
  };
}

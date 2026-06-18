/**
 * GATE Vault — Switchable Color Scheme System
 * 
 * Change ACTIVE_THEME for color family, ACTIVE_MODE for dark/light.
 * All components use CSS custom properties that resolve per-theme-mode pair.
 */

export const THEMES = Object.freeze({
  ORIGINAL_BLUE: 'original-blue',
  FOREST_GREEN: 'forest-green',
});

export const MODES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});

// ━━━ SWITCH THEME + MODE HERE ━━━
export const ACTIVE_THEME = THEMES.FOREST_GREEN;
export const ACTIVE_MODE = MODES.DARK;

export const themeColors = {
  // ───────────────────────── ORIGINAL BLUE ─────────────────────────
  [THEMES.ORIGINAL_BLUE]: {
    [MODES.DARK]: {
      // Surfaces (slate family)
      base: '#020617',
      surface950: '#020617',
      surface900: '#0f172a',
      surface800: '#1e293b',
      surface700: '#334155',
      surface600: '#475569',
      surface500: '#64748b',
      surface400: '#94a3b8',
      surface300: '#cbd5e1',

      // Text
      heading: '#ffffff',
      body: '#e2e8f0',
      muted: '#94a3b8',

      // Primary accent (indigo family)
      primary700: '#4338ca',
      primary600: '#4f46e5',
      primary500: '#6366f1',
      primary400: '#818cf8',
      primary300: '#a5b4fc',
      primary100: '#e0e7ff',

      // Secondary accent (purple, for gradients)
      secondary600: '#9333ea',
      secondary500: '#a855f7',
      secondary400: '#c084fc',

      // Atmosphere glows
      glow1: 'rgba(99, 102, 241, 0.1)',
      glow2: 'rgba(147, 51, 234, 0.1)',

      // Glassmorphism recipe
      glassBlur: '12px',
      glassBgOpacity: '0.4',
      glassBorderOpacity: '0.05',
    },
    [MODES.LIGHT]: {
      // Surfaces — light slate
      base: '#f8fafc',
      surface950: '#f1f5f9',
      surface900: '#e2e8f0',
      surface800: '#cbd5e1',
      surface700: '#94a3b8',
      surface600: '#64748b',
      surface500: '#475569',
      surface400: '#334155',
      surface300: '#1e293b',

      // Text
      heading: '#020617',
      body: '#1e293b',
      muted: '#475569',

      // Primary accent (indigo — slightly deeper for light bg contrast)
      primary700: '#3730a3',
      primary600: '#4338ca',
      primary500: '#4f46e5',
      primary400: '#6366f1',
      primary300: '#818cf8',
      primary100: '#e0e7ff',

      // Secondary accent (purple)
      secondary600: '#7e22ce',
      secondary500: '#9333ea',
      secondary400: '#a855f7',

      // Atmosphere glows — softer on light bg
      glow1: 'rgba(99, 102, 241, 0.06)',
      glow2: 'rgba(147, 51, 234, 0.05)',

      // Glassmorphism — higher opacity glass on light
      glassBlur: '16px',
      glassBgOpacity: '0.6',
      glassBorderOpacity: '0.08',
    },
  },

  // ───────────────────────── FOREST GREEN ─────────────────────────
  [THEMES.FOREST_GREEN]: {
    [MODES.DARK]: {
      // Surfaces — neutral darks
      base: '#030712',
      surface950: '#030712',
      surface900: '#111318',
      surface800: '#1c1e24',
      surface700: '#2e3038',
      surface600: '#44464f',
      surface500: '#6b6e78',
      surface400: '#9ca0ab',
      surface300: '#d1d5db',

      // Text
      heading: '#ffffff',
      body: '#e0e7e3',
      muted: '#9ca0ab',

      // Primary accent — muted forest green (#2E4D3D base)
      primary700: '#233B2E',
      primary600: '#2E4D3D',
      primary500: '#3D6652',
      primary400: '#6B9E85',
      primary300: '#7FB09A',
      primary100: '#C8DDD2',

      // Secondary accent — sage (#87A296 base)
      secondary600: '#6B8A7D',
      secondary500: '#87A296',
      secondary400: '#A3B8AE',

      // Atmosphere glows
      glow1: 'rgba(46, 77, 61, 0.18)',
      glow2: 'rgba(135, 162, 150, 0.12)',

      // Glassmorphism
      glassBlur: '16px',
      glassBgOpacity: '0.35',
      glassBorderOpacity: '0.08',
    },
    [MODES.LIGHT]: {
      // Surfaces — clean whites and cool grays for a sleek look
      base: '#f8fafc',
      surface950: '#ffffff', // Cards, main content areas
      surface900: '#f1f5f9', // Sidebar, secondary backgrounds
      surface800: '#e2e8f0', // Borders, hover states
      surface700: '#cbd5e1',
      surface600: '#94a3b8',
      surface500: '#64748b',
      surface400: '#475569',
      surface300: '#334155',

      // Text
      heading: '#0f172a',
      body: '#1e293b',
      muted: '#64748b',

      // Primary accent — Deep Forest Green & Bright Mint
      primary700: '#064e3b',
      primary600: '#0d241a', // Hover state for primary buttons
      primary500: '#163a2a', // Primary buttons, dark green text
      primary400: '#22543d', // Lighter dark green
      primary300: '#6ee7b7', // Bright mint for highlights
      primary100: '#d1fae5', // Very light mint for active backgrounds

      // Secondary accent — sage
      secondary600: '#56746A',
      secondary500: '#6B8A7D',
      secondary400: '#87A296',

      // Atmosphere glows — gentle
      glow1: 'rgba(16, 185, 129, 0.05)',
      glow2: 'rgba(52, 211, 153, 0.05)',

      // Glassmorphism — crisp glass on light
      glassBlur: '16px',
      glassBgOpacity: '0.8',
      glassBorderOpacity: '0.1',
    },
  },
};

/**
 * GATE Vault — Switchable Color Scheme System
 * 
 * All components use CSS custom properties that resolve per-theme-mode pair.
 */

export const THEMES = Object.freeze({
  ORIGINAL_BLUE: 'original-blue',
  FOREST_GREEN: 'forest-green',
  AMETHYST_PURPLE: 'amethyst-purple',
  SUNSET_ORANGE: 'sunset-orange',
  CRIMSON_RED: 'crimson-red',
});

export const MODES = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});

// Default active theme if none saved
export const ACTIVE_THEME = THEMES.FOREST_GREEN;
export const ACTIVE_MODE = MODES.DARK;

// Common surface and text colors to maintain consistent background across all themes
const commonDarkSurfaces = {
  base: '#030712',
  surface950: '#030712', surface900: '#111318', surface800: '#1c1e24',
  surface700: '#2e3038', surface600: '#44464f', surface500: '#6b6e78',
  surface400: '#9ca0ab', surface300: '#d1d5db',
  heading: '#ffffff', body: '#e0e7e3', muted: '#9ca0ab',
  glassBlur: '16px', glassBgOpacity: '0.35', glassBorderOpacity: '0.08',
};

const commonLightSurfaces = {
  base: '#f8fafc',
  surface950: '#ffffff', surface900: '#f1f5f9', surface800: '#e2e8f0',
  surface700: '#cbd5e1', surface600: '#94a3b8', surface500: '#64748b',
  surface400: '#475569', surface300: '#334155',
  heading: '#0f172a', body: '#1e293b', muted: '#64748b',
  glassBlur: '16px', glassBgOpacity: '0.8', glassBorderOpacity: '0.1',
};

export const themeColors = {
  // ───────────────────────── ORIGINAL BLUE ─────────────────────────
  [THEMES.ORIGINAL_BLUE]: {
    [MODES.DARK]: {
      ...commonDarkSurfaces,
      primary700: '#4338ca', primary600: '#4f46e5', primary500: '#6366f1',
      primary400: '#818cf8', primary300: '#a5b4fc', primary100: '#e0e7ff',
      secondary600: '#9333ea', secondary500: '#a855f7', secondary400: '#c084fc',
      glow1: 'rgba(99, 102, 241, 0.1)', glow2: 'rgba(147, 51, 234, 0.1)',
    },
    [MODES.LIGHT]: {
      ...commonLightSurfaces,
      primary700: '#3730a3', primary600: '#4338ca', primary500: '#4f46e5',
      primary400: '#6366f1', primary300: '#818cf8', primary100: '#e0e7ff',
      secondary600: '#7e22ce', secondary500: '#9333ea', secondary400: '#a855f7',
      glow1: 'rgba(99, 102, 241, 0.06)', glow2: 'rgba(147, 51, 234, 0.05)',
    },
  },

  // ───────────────────────── FOREST GREEN ─────────────────────────
  [THEMES.FOREST_GREEN]: {
    [MODES.DARK]: {
      ...commonDarkSurfaces,
      primary700: '#233B2E', primary600: '#2E4D3D', primary500: '#3D6652',
      primary400: '#6B9E85', primary300: '#7FB09A', primary100: '#C8DDD2',
      secondary600: '#6B8A7D', secondary500: '#87A296', secondary400: '#A3B8AE',
      glow1: 'rgba(46, 77, 61, 0.18)', glow2: 'rgba(135, 162, 150, 0.12)',
    },
    [MODES.LIGHT]: {
      ...commonLightSurfaces,
      primary700: '#064e3b', primary600: '#0d241a', primary500: '#163a2a',
      primary400: '#22543d', primary300: '#6ee7b7', primary100: '#d1fae5',
      secondary600: '#56746A', secondary500: '#6B8A7D', secondary400: '#87A296',
      glow1: 'rgba(16, 185, 129, 0.05)', glow2: 'rgba(52, 211, 153, 0.05)',
    },
  },

  // ───────────────────────── AMETHYST PURPLE ─────────────────────────
  [THEMES.AMETHYST_PURPLE]: {
    [MODES.DARK]: {
      ...commonDarkSurfaces,
      primary700: '#4A1D8F', primary600: '#5E28B0', primary500: '#7535D4',
      primary400: '#9055E8', primary300: '#A975F2', primary100: '#DBC3FB',
      secondary600: '#AD2C81', secondary500: '#CC3A9E', secondary400: '#E861BF',
      glow1: 'rgba(117, 53, 212, 0.15)', glow2: 'rgba(204, 58, 158, 0.1)',
    },
    [MODES.LIGHT]: {
      ...commonLightSurfaces,
      primary700: '#451787', primary600: '#3B1278', primary500: '#4A1D8F',
      primary400: '#6626BF', primary300: '#A975F2', primary100: '#EDE4FC',
      secondary600: '#9E2474', secondary500: '#AD2C81', secondary400: '#CC3A9E',
      glow1: 'rgba(117, 53, 212, 0.05)', glow2: 'rgba(204, 58, 158, 0.05)',
    },
  },

  // ───────────────────────── SUNSET ORANGE ─────────────────────────
  [THEMES.SUNSET_ORANGE]: {
    [MODES.DARK]: {
      ...commonDarkSurfaces,
      primary700: '#A33E0F', primary600: '#C74A12', primary500: '#EA580C',
      primary400: '#F57833', primary300: '#FA9A61', primary100: '#FDE0CD',
      secondary600: '#B22525', secondary500: '#DC2626', secondary400: '#F25252',
      glow1: 'rgba(234, 88, 12, 0.15)', glow2: 'rgba(220, 38, 38, 0.1)',
    },
    [MODES.LIGHT]: {
      ...commonLightSurfaces,
      primary700: '#8A320A', primary600: '#702606', primary500: '#8A320A',
      primary400: '#C74A12', primary300: '#F57833', primary100: '#FEF0E6',
      secondary600: '#941B1B', secondary500: '#B22525', secondary400: '#DC2626',
      glow1: 'rgba(234, 88, 12, 0.05)', glow2: 'rgba(220, 38, 38, 0.05)',
    },
  },

  // ───────────────────────── CRIMSON RED ─────────────────────────
  [THEMES.CRIMSON_RED]: {
    [MODES.DARK]: {
      ...commonDarkSurfaces,
      primary700: '#9F1226', primary600: '#BE122C', primary500: '#E11D48',
      primary400: '#ED4768', primary300: '#F47890', primary100: '#FCE0E6',
      secondary600: '#9F2456', secondary500: '#BE2A66', secondary400: '#E13B7E',
      glow1: 'rgba(225, 29, 72, 0.15)', glow2: 'rgba(190, 42, 102, 0.1)',
    },
    [MODES.LIGHT]: {
      ...commonLightSurfaces,
      primary700: '#8A0E1F', primary600: '#6E0A17', primary500: '#8A0E1F',
      primary400: '#BE122C', primary300: '#ED4768', primary100: '#FDF0F3',
      secondary600: '#8A1C49', secondary500: '#9F2456', secondary400: '#BE2A66',
      glow1: 'rgba(225, 29, 72, 0.05)', glow2: 'rgba(190, 42, 102, 0.05)',
    },
  },
};

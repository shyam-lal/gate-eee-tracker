/**
 * GATE Vault — Switchable Color Scheme System
 * 
 * Change ACTIVE_THEME to switch the entire app's color scheme.
 * All components use CSS custom properties that resolve per-theme.
 */

export const THEMES = Object.freeze({
  ORIGINAL_BLUE: 'original-blue',
  FOREST_GREEN: 'forest-green',
});

// ━━━ SWITCH THEME HERE ━━━
export const ACTIVE_THEME = THEMES.FOREST_GREEN;

export const themeColors = {
  [THEMES.ORIGINAL_BLUE]: {
    // Surfaces (slate family)
    base:        '#020617',
    surface950:  '#020617',
    surface900:  '#0f172a',
    surface800:  '#1e293b',
    surface700:  '#334155',
    surface600:  '#475569',
    surface500:  '#64748b',
    surface400:  '#94a3b8',

    // Primary accent (indigo family)
    primary700:  '#4338ca',
    primary600:  '#4f46e5',
    primary500:  '#6366f1',
    primary400:  '#818cf8',
    primary300:  '#a5b4fc',
    primary100:  '#e0e7ff',

    // Secondary accent (purple, for gradients)
    secondary600: '#9333ea',
    secondary500: '#a855f7',
    secondary400: '#c084fc',

    // Atmosphere glows
    glow1: 'rgba(99, 102, 241, 0.1)',
    glow2: 'rgba(147, 51, 234, 0.1)',

    // Glassmorphism recipe
    glassBlur:          '12px',
    glassBgOpacity:     '0.4',
    glassBorderOpacity: '0.05',
  },

  [THEMES.FOREST_GREEN]: {
    // Surfaces — neutral darks (green is accent only, not background)
    base:        '#030712',
    surface950:  '#030712',
    surface900:  '#111318',
    surface800:  '#1c1e24',
    surface700:  '#2e3038',
    surface600:  '#44464f',
    surface500:  '#6b6e78',
    surface400:  '#9ca0ab',

    // Primary accent — muted forest green (#2E4D3D base)
    primary700:  '#233B2E',
    primary600:  '#2E4D3D',
    primary500:  '#3D6652',
    primary400:  '#5A8A73',
    primary300:  '#7FB09A',
    primary100:  '#C8DDD2',

    // Secondary accent — sage (#87A296 base)
    secondary600: '#6B8A7D',
    secondary500: '#87A296',
    secondary400: '#A3B8AE',

    // Atmosphere glows — subtle forest mist
    glow1: 'rgba(46, 77, 61, 0.12)',
    glow2: 'rgba(135, 162, 150, 0.08)',

    // Glassmorphism — clean, calm
    glassBlur:          '16px',
    glassBgOpacity:     '0.35',
    glassBorderOpacity: '0.08',
  },
};

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ACTIVE_THEME, MODES, THEMES, themeColors } from '../theme/colors';

const ThemeContext = createContext({
  theme: ACTIVE_THEME,
  mode: MODES.DARK,
  toggleMode: () => {},
  setMode: () => {},
  setTheme: () => {},
});

/**
 * Apply a theme+mode's CSS custom properties to document root.
 */
function applyThemeVars(theme, mode) {
  const root = document.documentElement;
  const colors = themeColors[theme][mode];

  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);

  // Surfaces
  root.style.setProperty('--color-base',        colors.base);
  root.style.setProperty('--color-surface-950',  colors.surface950);
  root.style.setProperty('--color-surface-900',  colors.surface900);
  root.style.setProperty('--color-surface-800',  colors.surface800);
  root.style.setProperty('--color-surface-700',  colors.surface700);
  root.style.setProperty('--color-surface-600',  colors.surface600);
  root.style.setProperty('--color-surface-500',  colors.surface500);
  root.style.setProperty('--color-surface-400',  colors.surface400);

  // Text
  root.style.setProperty('--color-heading',      colors.heading);
  root.style.setProperty('--color-body',         colors.body);
  root.style.setProperty('--color-muted',        colors.muted);

  // Primary
  root.style.setProperty('--color-primary-700',  colors.primary700);
  root.style.setProperty('--color-primary-600',  colors.primary600);
  root.style.setProperty('--color-primary-500',  colors.primary500);
  root.style.setProperty('--color-primary-400',  colors.primary400);
  root.style.setProperty('--color-primary-300',  colors.primary300);
  root.style.setProperty('--color-primary-100',  colors.primary100);

  // Secondary
  root.style.setProperty('--color-secondary-600', colors.secondary600);
  root.style.setProperty('--color-secondary-500', colors.secondary500);
  root.style.setProperty('--color-secondary-400', colors.secondary400);

  // Ambience
  root.style.setProperty('--color-glow1',        colors.glow1);
  root.style.setProperty('--color-glow2',        colors.glow2);

  // Glass
  root.style.setProperty('--glass-blur',          colors.glassBlur);
  root.style.setProperty('--glass-bg-opacity',    colors.glassBgOpacity);
  root.style.setProperty('--glass-border-opacity', colors.glassBorderOpacity);
}

/**
 * ThemeProvider — supports runtime dark/light mode switching and color theme switching.
 * Persists user preference in localStorage.
 */
export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('vault-theme-mode');
      if (saved === MODES.DARK || saved === MODES.LIGHT) return saved;
    } catch {}
    return MODES.DARK;
  });

  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('vault-theme-family');
      if (Object.values(THEMES).includes(saved)) return saved;
    } catch {}
    return ACTIVE_THEME;
  });

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try { localStorage.setItem('vault-theme-mode', newMode); } catch {}
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try { localStorage.setItem('vault-theme-family', newTheme); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === MODES.DARK ? MODES.LIGHT : MODES.DARK);
  }, [mode, setMode]);

  // Apply vars whenever mode or theme changes
  useEffect(() => {
    applyThemeVars(theme, mode);
  }, [mode, theme]);

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode, setMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

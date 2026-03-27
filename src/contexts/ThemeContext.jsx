import { createContext, useContext, useEffect } from 'react';
import { ACTIVE_THEME, themeColors } from '../theme/colors';

const ThemeContext = createContext({ theme: ACTIVE_THEME });

/**
 * ThemeProvider — applies the active theme's CSS custom properties
 * to the document root on mount. All Tailwind theme-aware classes
 * (bg-base, bg-surface-*, bg-primary-*, etc.) resolve through these vars.
 */
export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    const colors = themeColors[ACTIVE_THEME];

    root.setAttribute('data-theme', ACTIVE_THEME);

    // Map JS keys → CSS custom properties
    root.style.setProperty('--color-base',        colors.base);
    root.style.setProperty('--color-surface-950',  colors.surface950);
    root.style.setProperty('--color-surface-900',  colors.surface900);
    root.style.setProperty('--color-surface-800',  colors.surface800);
    root.style.setProperty('--color-surface-700',  colors.surface700);
    root.style.setProperty('--color-surface-600',  colors.surface600);
    root.style.setProperty('--color-surface-500',  colors.surface500);
    root.style.setProperty('--color-surface-400',  colors.surface400);

    root.style.setProperty('--color-primary-700',  colors.primary700);
    root.style.setProperty('--color-primary-600',  colors.primary600);
    root.style.setProperty('--color-primary-500',  colors.primary500);
    root.style.setProperty('--color-primary-400',  colors.primary400);
    root.style.setProperty('--color-primary-300',  colors.primary300);
    root.style.setProperty('--color-primary-100',  colors.primary100);

    root.style.setProperty('--color-secondary-600', colors.secondary600);
    root.style.setProperty('--color-secondary-500', colors.secondary500);
    root.style.setProperty('--color-secondary-400', colors.secondary400);

    root.style.setProperty('--color-glow1',        colors.glow1);
    root.style.setProperty('--color-glow2',        colors.glow2);

    root.style.setProperty('--glass-blur',          colors.glassBlur);
    root.style.setProperty('--glass-bg-opacity',    colors.glassBgOpacity);
    root.style.setProperty('--glass-border-opacity', colors.glassBorderOpacity);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: ACTIVE_THEME }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

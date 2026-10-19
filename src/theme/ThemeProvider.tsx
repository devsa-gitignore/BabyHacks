'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'day' | 'night';
type ThemeApi = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => Theme };

const ThemeContext = createContext<ThemeApi>({ theme: 'day', setTheme: () => {}, toggle: () => 'day' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('day');

  // The inline script in <head> already set data-theme before paint; sync React to it.
  useEffect(() => {
    const t = document.documentElement.dataset.theme === 'night' ? 'night' : 'day';
    setThemeState(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('wk.theme', t);
    } catch {}
    setThemeState(t);
  }, []);

  const toggle = useCallback((): Theme => {
    const next: Theme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
    setTheme(next);
    return next;
  }, [setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

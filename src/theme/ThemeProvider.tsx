'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'day' | 'night';
type ThemeApi = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => Theme };

const ThemeContext = createContext<ThemeApi>({ theme: 'day', setTheme: () => {}, toggle: () => 'day' });

const applyThemeToDOM = (t: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.dataset.theme = t;
  document.documentElement.classList.toggle('dark', t === 'night');
  document.documentElement.classList.toggle('night', t === 'night');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'night' ? '#0a081a' : '#3876ba');
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('day');

  // The inline script in <head> already set data-theme before paint; sync React to it.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('wk.theme');
    } catch {}
    const domTheme = document.documentElement.getAttribute('data-theme') || document.documentElement.dataset.theme;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial: Theme =
      stored === 'night' || stored === 'day'
        ? (stored as Theme)
        : domTheme === 'night' || (!stored && prefersDark)
          ? 'night'
          : 'day';
    applyThemeToDOM(initial);
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    applyThemeToDOM(t);
    try {
      localStorage.setItem('wk.theme', t);
    } catch {}
    setThemeState(t);
  }, []);

  const toggle = useCallback((): Theme => {
    const next: Theme = theme === 'night' ? 'day' : 'night';
    setTheme(next);
    return next;
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

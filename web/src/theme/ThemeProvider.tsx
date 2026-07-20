'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; resolved: ResolvedTheme; cycle: () => void }>({ theme: 'auto', resolved: 'light', cycle: () => {} });

export function useTheme() { return useContext(ThemeCtx); }

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'auto' ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('auto');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('edina-theme') as Theme | null;
    const initial = stored || 'auto';
    setTheme(initial);
    const r = resolveTheme(initial);
    setResolved(r);
    applyTheme(r);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'auto') {
        const newR = getSystemTheme();
        setResolved(newR);
        applyTheme(newR);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const cycle = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
    setTheme(next);
    localStorage.setItem('edina-theme', next);
    const r = resolveTheme(next);
    setResolved(r);
    applyTheme(r);
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, resolved, cycle }}>{children}</ThemeCtx.Provider>;
}

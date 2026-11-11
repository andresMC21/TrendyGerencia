import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const EVENT = 'trendy:theme';
const KEY = 'trendy.theme';

function storedTheme(): Theme | null {
  try { const value = localStorage.getItem(KEY); return value === 'dark' || value === 'light' ? value : null; }
  catch { return null; }
}

export function initializeTheme() {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    document.documentElement.dataset.theme = storedTheme() ?? (media.matches ? 'dark' : 'light');
    window.dispatchEvent(new Event(EVENT));
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', (event) => { if (event.key === KEY || event.key === null) apply(); });
}

const subscribe = (listener: () => void) => { window.addEventListener(EVENT, listener); return () => window.removeEventListener(EVENT, listener); };
const snapshot = (): Theme => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'light' as Theme);
  const toggle = () => {
    const next = snapshot() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* The theme still works for this session. */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return { theme, toggle };
}

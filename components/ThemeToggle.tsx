'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const THEME_EVENT = 'rnews-theme-change';

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerTheme(): Theme {
  return 'dark';
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-800 dark:hover:text-zinc-200"
      aria-label="切换主题"
    >
      {theme === 'dark' ? '浅色' : '深色'}
    </button>
  );
}

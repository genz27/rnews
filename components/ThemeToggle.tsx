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

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
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
      className={
        compact
          ? 'inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'
          : 'text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-800 dark:hover:text-zinc-200'
      }
      aria-label="切换主题"
    >
      {compact ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {theme === 'dark' ? (
            <circle cx="12" cy="12" r="4.5" />
          ) : (
            <path d="M16 13.5A6 6 0 0 1 10.5 8 5.2 5.2 0 1 0 16 16.5 6 6 0 0 1 16 13.5z" />
          )}
        </svg>
      ) : theme === 'dark' ? (
        '浅色'
      ) : (
        '深色'
      )}
    </button>
  );
}

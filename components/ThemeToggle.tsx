'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  if (!mounted) {
    return <span className="text-xs text-zinc-500">浅色</span>;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="text-xs text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
      aria-label="切换主题"
    >
      {theme === 'dark' ? '浅色' : '深色'}
    </button>
  );
}

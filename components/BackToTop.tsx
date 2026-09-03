'use client';

import { useEffect, useState } from 'react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-4 z-30 rounded-full border border-zinc-200/80 bg-zinc-50/90 px-3 py-2 text-xs text-zinc-600 shadow-sm backdrop-blur-md transition hover:border-zinc-300 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:border-white/[0.16] dark:hover:text-zinc-100 lg:bottom-6 lg:right-8"
    >
      回到顶部
    </button>
  );
}

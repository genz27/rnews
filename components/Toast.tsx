'use client';

import { useEffect } from 'react';

type ToastProps = {
  message: string | null;
  onDone: () => void;
};

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-zinc-200/80 bg-zinc-50/95 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur-md animate-in dark:border-white/[0.08] dark:bg-zinc-900/95 dark:text-zinc-200"
    >
      {message}
    </div>
  );
}

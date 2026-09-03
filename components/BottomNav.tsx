'use client';

const TABS = [
  { id: '推荐', label: '推荐' },
  { id: '社区', label: '社区' },
  { id: 'AI', label: 'AI' },
  { id: '资讯', label: '资讯' },
  { id: '全部', label: '全部' },
] as const;

export function BottomNav({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  const active = TABS.some((tab) => tab.id === selected) ? selected : '全部';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-zinc-50/95 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/95 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const current = active === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onSelect(tab.id)}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                  current
                    ? 'text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
                aria-current={current ? 'page' : undefined}
              >
                <TabIcon name={tab.id} active={current} />
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 1.8 : 1.5;
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={stroke} aria-hidden>
      {name === '推荐' ? (
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
      ) : name === '社区' ? (
        <>
          <circle cx="8" cy="9" r="2.2" />
          <circle cx="16" cy="9" r="2.2" />
          <path d="M4.5 18c.6-2.4 2.4-3.6 4.5-3.6s3.9 1.2 4.5 3.6M12.8 18c.4-1.6 1.5-2.6 3.2-2.6 1.8 0 2.9 1 3.3 2.6" strokeLinecap="round" />
        </>
      ) : name === 'AI' ? (
        <>
          <rect x="6" y="7" width="12" height="11" rx="2.5" />
          <path d="M9 11h.01M15 11h.01M9.5 15h5" strokeLinecap="round" />
          <path d="M12 4v3" strokeLinecap="round" />
        </>
      ) : name === '资讯' ? (
        <>
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M8 9h8M8 12h8M8 15h5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M5 7h14M5 12h14M5 17h9" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

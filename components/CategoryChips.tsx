'use client';

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  onPrefetch?: (category: string) => void;
  layout?: 'row' | 'stack';
}

export function CategoryChips({
  categories,
  selected,
  onSelect,
  onPrefetch,
  layout = 'row',
}: CategoryChipsProps) {
  const activeIndex = Math.max(0, categories.indexOf(selected));

  const activate = (category: string) => {
    onPrefetch?.(category);
    onSelect(category);
  };

  if (layout === 'stack') {
    return (
      <nav className="relative flex flex-col gap-1">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-9 rounded-md bg-zinc-100 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-white/[0.06]"
          style={{ transform: `translateY(${activeIndex * 40}px)` }}
        />
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              activate(category);
            }}
            onPointerEnter={() => onPrefetch?.(category)}
            onClick={() => activate(category)}
            className={`relative z-10 h-9 cursor-pointer rounded-md px-3 text-left text-sm transition-colors duration-150 ${
              selected === category
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200'
            }`}
            aria-current={selected === category ? 'page' : undefined}
          >
            {category}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="flex gap-x-5 gap-y-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            activate(category);
          }}
          onPointerEnter={() => onPrefetch?.(category)}
          onClick={() => activate(category)}
          className={`relative shrink-0 cursor-pointer pb-1 text-sm transition-colors duration-150 ${
            selected === category
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200'
          }`}
          aria-current={selected === category ? 'page' : undefined}
        >
          {category}
          <span
            className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-zinc-900 transition-transform duration-200 ease-out dark:bg-zinc-100 ${
              selected === category ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

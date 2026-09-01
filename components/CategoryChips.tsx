'use client';

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  layout?: 'row' | 'stack';
}

export function CategoryChips({
  categories,
  selected,
  onSelect,
  layout = 'row',
}: CategoryChipsProps) {
  if (layout === 'stack') {
    return (
      <nav className="flex flex-col gap-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`rounded-md px-3 py-2 text-left text-sm transition-colors duration-200 ${
              selected === category
                ? 'bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-50'
                : 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
            }`}
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
          onClick={() => onSelect(category)}
          className={`shrink-0 text-sm transition-colors duration-200 ${
            selected === category
              ? 'text-zinc-900 dark:text-zinc-50'
              : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

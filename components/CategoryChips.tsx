'use client';

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
            selected === category
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
              : 'bg-white text-zinc-600 hover:bg-rose-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

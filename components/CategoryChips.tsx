'use client';

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-x-4 gap-y-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`shrink-0 text-[13px] transition-colors duration-200 ${
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

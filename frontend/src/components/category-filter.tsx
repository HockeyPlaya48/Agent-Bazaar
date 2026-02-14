"use client";

interface Category {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
}

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  categories: readonly Category[];
}

export function CategoryFilter({
  selected,
  onSelect,
  categories,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
          !selected
            ? "bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            : "border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(selected === cat.value ? null : cat.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            selected === cat.value
              ? "bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              : "border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
          }`}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}

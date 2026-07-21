// src/mobile/ui/ChipGroup.tsx
// Grupo de chips com etiqueta (single-select, com wrap) — usado nas sheets
// de filtros e em escolhas curtas de formulários (estado, tipo de freebet…).

interface ChipGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

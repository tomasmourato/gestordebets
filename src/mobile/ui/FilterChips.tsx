// src/mobile/ui/FilterChips.tsx
// Fila de chips com scroll horizontal para filtros rápidos (estado, casa,
// desporto…). Substitui os dropdowns densos do desktop no mobile. Um chip
// pode indicar seleção ativa e (opcionalmente) abrir a sheet de filtros.

import React from "react";
import { tapHaptic } from "../../lib/haptics";

export interface ChipOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: ChipOption[];
  /** Valor selecionado (single-select). */
  value: string;
  onChange: (value: string) => void;
  /** Slot à esquerda — ex.: botão "Filtros" que abre a sheet completa. */
  leading?: React.ReactNode;
}

export function FilterChips({ options, value, onChange, leading }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-0.5">
      {leading}
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              void tapHaptic("light");
              onChange(opt.value);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

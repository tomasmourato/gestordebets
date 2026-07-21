// src/mobile/ui/SegmentedControl.tsx
// Controlo segmentado (estilo iOS/Android) para alternar entre poucas
// opções mutuamente exclusivas — ex.: separadores dentro de um ecrã. Para
// muitas opções ou filtros, usar antes <FilterChips>.

import { motion } from "motion/react";
import { tapHaptic } from "../../lib/haptics";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="relative flex p-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/70">
      {segments.map((seg) => {
        const isActive = seg.value === value;
        return (
          <button
            key={seg.value}
            onClick={() => {
              if (!isActive) {
                void tapHaptic("light");
                onChange(seg.value);
              }
            }}
            className="relative flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId="segmented-active"
                className="absolute inset-0 rounded-md bg-white dark:bg-zinc-950 shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500 dark:text-zinc-400"}`}>
              {seg.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

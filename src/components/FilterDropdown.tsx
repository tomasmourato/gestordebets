import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export interface FilterDropdownOption<T extends string> {
  value: T;
  label: string;
}

interface FilterDropdownProps<T extends string> {
  value: T;
  options: Array<FilterDropdownOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTriggerClick?: () => void;
}

export default function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  open: controlledOpen,
  onOpenChange,
  onTriggerClick
}: FilterDropdownProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpen = controlledOpen ?? internalOpen;
  const selectedOption = options.find(option => option.value === value);

  const setOpen = (open: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (onTriggerClick) onTriggerClick();
          else setOpen(!isOpen);
        }}
        className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-xs font-semibold text-slate-800 outline-none transition-colors hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-indigo-500 cursor-pointer"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-150 dark:text-slate-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] max-h-72 min-w-full origin-top overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
            role="listbox"
            aria-label={ariaLabel}
          >
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    setOpen(false);
                    onChange(option.value);
                  }}
                  className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

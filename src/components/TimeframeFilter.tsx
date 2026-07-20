import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import FilterDropdown from "./FilterDropdown";

export type Timeframe = "ALL" | "7_DAYS" | "30_DAYS" | "90_DAYS" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM";
type RangeEndpoint = "start" | "end";

export interface TimeframeFilterValue {
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
}

export const EMPTY_TIMEFRAME_FILTER: TimeframeFilterValue = {
  timeframe: "ALL",
  startDate: "",
  endDate: "",
};

export const TIMEFRAME_OPTIONS: Array<{ value: Timeframe; label: string }> = [
  { value: "ALL", label: "Todo o Período" },
  { value: "7_DAYS", label: "Últimos 7 dias" },
  { value: "30_DAYS", label: "Últimos 30 dias" },
  { value: "90_DAYS", label: "Últimos 90 dias" },
  { value: "THIS_MONTH", label: "Este mês" },
  { value: "THIS_YEAR", label: "Este ano" },
  { value: "CUSTOM", label: "Período personalizado" },
];

export const isTimeframe = (value: string | null): value is Timeframe =>
  TIMEFRAME_OPTIONS.some(option => option.value === value);

export const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromLocalDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateKey = (dateKey: string) => {
  const date = fromLocalDateKey(dateKey);
  return date ? new Intl.DateTimeFormat("pt-PT").format(date) : "dd/mm/aaaa";
};

const calendarDaysFor = (month: Date) => {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const firstVisibleDay = new Date(firstOfMonth);
  firstVisibleDay.setDate(firstOfMonth.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return date;
  });
};

export function resolveTimeframeRange(value: TimeframeFilterValue, now = new Date()) {
  if (value.timeframe === "ALL") return { start: "", end: "" };
  if (value.timeframe === "CUSTOM") return { start: value.startDate, end: value.endDate };

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  if (value.timeframe === "7_DAYS") start.setDate(today.getDate() - 6);
  if (value.timeframe === "30_DAYS") start.setDate(today.getDate() - 29);
  if (value.timeframe === "90_DAYS") start.setDate(today.getDate() - 89);
  if (value.timeframe === "THIS_MONTH") start.setDate(1);
  if (value.timeframe === "THIS_YEAR") start.setMonth(0, 1);
  return { start: toLocalDateKey(start), end: toLocalDateKey(today) };
}

export function rangeSpansAtLeastTwoMonths(start: Date, end: Date) {
  const threshold = new Date(start);
  threshold.setMonth(threshold.getMonth() + 2);
  return end >= threshold;
}

interface TimeframeFilterProps {
  value: TimeframeFilterValue;
  onChange: (value: TimeframeFilterValue) => void;
}

export default function TimeframeFilter({ value, onChange }: TimeframeFilterProps) {
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [isTimeframeMenuOpen, setIsTimeframeMenuOpen] = useState(false);
  const [activeRangeEndpoint, setActiveRangeEndpoint] = useState<RangeEndpoint>("start");
  const containerRef = useRef<HTMLDivElement>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const calendarDays = useMemo(() => calendarDaysFor(calendarMonth), [calendarMonth]);

  useEffect(() => {
    if (!isCustomRangeOpen && !isTimeframeMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsCustomRangeOpen(false);
        setIsTimeframeMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCustomRangeOpen(false);
        setIsTimeframeMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCustomRangeOpen, isTimeframeMenuOpen]);

  const openCustomRangePicker = () => {
    const endpoint: RangeEndpoint = value.startDate && !value.endDate ? "end" : "start";
    const preferredDate = fromLocalDateKey(endpoint === "end" ? value.endDate : value.startDate) || new Date();
    setActiveRangeEndpoint(endpoint);
    setCalendarMonth(new Date(preferredDate.getFullYear(), preferredDate.getMonth(), 1));
    setIsCustomRangeOpen(true);
  };

  const selectCalendarDate = (date: Date) => {
    const dateKey = toLocalDateKey(date);
    if (activeRangeEndpoint === "start") {
      onChange({
        timeframe: "CUSTOM",
        startDate: dateKey,
        endDate: value.endDate && dateKey <= value.endDate ? value.endDate : "",
      });
      setActiveRangeEndpoint("end");
      return;
    }
    if (value.startDate && dateKey < value.startDate) {
      onChange({ timeframe: "CUSTOM", startDate: dateKey, endDate: value.startDate });
    } else {
      onChange({ ...value, timeframe: "CUSTOM", endDate: dateKey });
    }
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <FilterDropdown
        value={value.timeframe}
        options={TIMEFRAME_OPTIONS}
        open={isTimeframeMenuOpen}
        onOpenChange={setIsTimeframeMenuOpen}
        onTriggerClick={() => {
          if (value.timeframe === "CUSTOM") {
            if (isCustomRangeOpen) {
              setIsCustomRangeOpen(false);
              setIsTimeframeMenuOpen(true);
            } else if (isTimeframeMenuOpen) {
              setIsTimeframeMenuOpen(false);
            } else {
              openCustomRangePicker();
            }
            return;
          }
          setIsCustomRangeOpen(false);
          setIsTimeframeMenuOpen(current => !current);
        }}
        onChange={(timeframe) => {
          onChange({ ...value, timeframe });
          if (timeframe === "CUSTOM") openCustomRangePicker();
          else setIsCustomRangeOpen(false);
        }}
        ariaLabel="Filtrar por período"
      />

      <AnimatePresence>
        {value.timeframe === "CUSTOM" && isCustomRangeOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] max-h-[calc(100vh-8rem)] w-[min(22rem,calc(100vw-3rem))] select-none overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
            role="dialog"
            aria-label="Escolher período personalizado"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
                <CalendarRange size={15} />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Período personalizado</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">As datas inicial e final são incluídas.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["start", "end"] as RangeEndpoint[]).map(endpoint => {
                const dateKey = endpoint === "start" ? value.startDate : value.endDate;
                return (
                  <div key={endpoint} className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {endpoint === "start" ? "Data inicial" : "Data final"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRangeEndpoint(endpoint);
                        const date = fromLocalDateKey(dateKey || value.startDate);
                        if (date) setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                      }}
                      className={`flex h-10 w-full items-center justify-between rounded-md border px-2.5 text-left text-xs font-semibold outline-none transition-all cursor-pointer ${
                        activeRangeEndpoint === endpoint
                          ? "border-indigo-500 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/10 dark:bg-indigo-950/40 dark:text-indigo-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
                      }`}
                    >
                      <span>{formatDateKey(dateKey)}</span>
                      <CalendarRange size={13} className="text-slate-400" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="mb-2 flex items-center justify-between px-1">
                <button type="button" onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300 cursor-pointer" aria-label="Mês anterior">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
                  {calendarMonth.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
                </span>
                <button type="button" onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300 cursor-pointer" aria-label="Mês seguinte">
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => <span key={day} className="flex h-6 items-center justify-center text-[9px] font-bold uppercase text-slate-400 dark:text-slate-600">{day}</span>)}
              </div>
              <motion.div key={`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`} initial={{ opacity: 0.45, x: 3 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12, ease: "easeOut" }} className="grid grid-cols-7 gap-0.5">
                {calendarDays.map(date => {
                  const dateKey = toLocalDateKey(date);
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isStart = dateKey === value.startDate;
                  const isEnd = dateKey === value.endDate;
                  const isRangeEdge = isStart || isEnd;
                  const isInRange = Boolean(value.startDate && value.endDate && dateKey > value.startDate && dateKey < value.endDate);
                  const isToday = dateKey === toLocalDateKey(new Date());
                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() => selectCalendarDate(date)}
                      className={`relative flex aspect-square items-center justify-center rounded-md text-[10px] font-semibold outline-none transition-colors cursor-pointer ${
                        isRangeEdge
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-950/20 hover:bg-indigo-500"
                          : isInRange
                            ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-200 dark:hover:bg-indigo-900"
                            : isCurrentMonth
                              ? "text-slate-700 hover:bg-white hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                              : "text-slate-300 hover:bg-white hover:text-slate-500 dark:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-500"
                      }`}
                      aria-label={date.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
                      aria-pressed={isRangeEdge}
                    >
                      {date.getDate()}
                      {isToday && !isRangeEdge && <span className="absolute bottom-1 h-0.5 w-0.5 rounded-full bg-indigo-500" />}
                    </button>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

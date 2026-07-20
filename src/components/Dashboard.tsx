import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  HelpCircle,
  Award,
  Percent,
  Layers,
  ArrowUpRight,
  Filter,
  CalendarRange,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Bet, BetStatus, DashboardStats } from "../types";
import { calculateDashboardStats, safeNum } from "../utils";
import FilterDropdown from "./FilterDropdown";
import { rangeSpansAtLeastTwoMonths } from "./TimeframeFilter";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  LineChart,
  Line
} from "recharts";

interface DashboardProps {
  bets: Bet[];
  currency: string;
  isDark: boolean;
  onOpenBets: (filters: DashboardBetsFilters) => void;
}

export interface DashboardBetsFilters {
  status: BetStatus;
  bookmaker?: string;
  sport?: string;
  type?: string;
  money?: string;
  timeframe?: Timeframe;
  dateFrom?: string;
  dateTo?: string;
}

type Timeframe = "ALL" | "7_DAYS" | "30_DAYS" | "90_DAYS" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM";
type RangeEndpoint = "start" | "end";

const TIMEFRAME_OPTIONS: Array<{ value: Timeframe; label: string }> = [
  { value: "ALL", label: "Todo o Período" },
  { value: "7_DAYS", label: "Últimos 7 dias" },
  { value: "30_DAYS", label: "Últimos 30 dias" },
  { value: "90_DAYS", label: "Últimos 90 dias" },
  { value: "THIS_MONTH", label: "Este mês" },
  { value: "THIS_YEAR", label: "Este ano" },
  { value: "CUSTOM", label: "Período personalizado" }
];

const toLocalDateKey = (date: Date) => {
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

export default function Dashboard({ bets: allBets, currency, isDark, onOpenBets }: DashboardProps) {
  // Filtros do dashboard (D2): recalculam TODAS as estatísticas/gráficos para o
  // subconjunto escolhido. As opções vêm da lista completa; o cálculo usa a
  // lista filtrada `bets` (sombreada abaixo).
  const [filterBookmaker, setFilterBookmaker] = useState("ALL");
  const [filterSport, setFilterSport] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterFreebet, setFilterFreebet] = useState("ALL");
  const [filterTimeframe, setFilterTimeframe] = useState<Timeframe>("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [isTimeframeMenuOpen, setIsTimeframeMenuOpen] = useState(false);
  const [activeRangeEndpoint, setActiveRangeEndpoint] = useState<RangeEndpoint>("start");
  const customRangeContainerRef = useRef<HTMLDivElement>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    if (!isCustomRangeOpen && !isTimeframeMenuOpen) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!customRangeContainerRef.current?.contains(event.target as Node)) {
        setIsCustomRangeOpen(false);
        setIsTimeframeMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCustomRangeOpen(false);
        setIsTimeframeMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCustomRangeOpen, isTimeframeMenuOpen]);

  const bookmakerOptions = useMemo(
    () => Array.from(new Set(allBets.map(b => b.bookmaker).filter((b): b is string => !!b))).sort(),
    [allBets]
  );
  const sportOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allBets
            .flatMap(b => (b.selections || []).map(s => s.sport))
            .filter((s): s is string => !!s)
        )
      ).sort(),
    [allBets]
  );

  const timeframeRange = useMemo(() => {
    if (filterTimeframe === "ALL") return { start: "", end: "" };
    if (filterTimeframe === "CUSTOM") return { start: customStartDate, end: customEndDate };

    const today = new Date();
    const start = new Date(today);

    if (filterTimeframe === "7_DAYS") start.setDate(today.getDate() - 6);
    if (filterTimeframe === "30_DAYS") start.setDate(today.getDate() - 29);
    if (filterTimeframe === "90_DAYS") start.setDate(today.getDate() - 89);
    if (filterTimeframe === "THIS_MONTH") start.setDate(1);
    if (filterTimeframe === "THIS_YEAR") start.setMonth(0, 1);

    return { start: toLocalDateKey(start), end: toLocalDateKey(today) };
  }, [filterTimeframe, customStartDate, customEndDate]);

  const calendarDays = useMemo(() => calendarDaysFor(calendarMonth), [calendarMonth]);

  const openCustomRangePicker = () => {
    const endpoint: RangeEndpoint = customStartDate && !customEndDate ? "end" : "start";
    const preferredDate = fromLocalDateKey(endpoint === "end" ? customEndDate : customStartDate) || new Date();
    setActiveRangeEndpoint(endpoint);
    setCalendarMonth(new Date(preferredDate.getFullYear(), preferredDate.getMonth(), 1));
    setIsCustomRangeOpen(true);
  };

  const selectCalendarDate = (date: Date) => {
    const dateKey = toLocalDateKey(date);

    if (activeRangeEndpoint === "start") {
      setCustomStartDate(dateKey);
      if (customEndDate && dateKey > customEndDate) setCustomEndDate("");
      setActiveRangeEndpoint("end");
      return;
    }

    if (customStartDate && dateKey < customStartDate) {
      setCustomStartDate(dateKey);
      setCustomEndDate(customStartDate);
    } else {
      setCustomEndDate(dateKey);
    }
  };

  // `bets` sombreia a prop: é o subconjunto filtrado que todo o código abaixo usa.
  const bets = useMemo(
    () =>
      allBets.filter(b => {
        if (filterBookmaker !== "ALL" && b.bookmaker !== filterBookmaker) return false;
        if (filterType !== "ALL" && b.type !== filterType) return false;
        if (filterFreebet === "FREEBET" && !b.isFreebet) return false;
        if (filterFreebet === "NORMAL" && b.isFreebet) return false;
        if (filterSport !== "ALL" && !(b.selections || []).some(s => s.sport === filterSport)) return false;
        if (timeframeRange.start || timeframeRange.end) {
          const betDate = b.dateTime?.slice(0, 10) || "";
          if (!betDate) return false;
          if (timeframeRange.start && betDate < timeframeRange.start) return false;
          if (timeframeRange.end && betDate > timeframeRange.end) return false;
        }
        return true;
      }),
    [allBets, filterBookmaker, filterSport, filterType, filterFreebet, timeframeRange]
  );

  const hasFilters =
    filterBookmaker !== "ALL" || filterSport !== "ALL" || filterType !== "ALL" || filterFreebet !== "ALL" || filterTimeframe !== "ALL";

  const activeFilterCount = [filterBookmaker, filterSport, filterType, filterFreebet, filterTimeframe]
    .filter(value => value !== "ALL").length;

  const clearFilters = () => {
    setFilterBookmaker("ALL");
    setFilterSport("ALL");
    setFilterType("ALL");
    setFilterFreebet("ALL");
    setFilterTimeframe("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setIsCustomRangeOpen(false);
    setIsTimeframeMenuOpen(false);
    setActiveRangeEndpoint("start");
  };

  const openBetsForStatus = (status: BetStatus) => {
    onOpenBets({
      status,
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterFreebet !== "ALL" ? filterFreebet : undefined,
      timeframe: filterTimeframe !== "ALL" ? filterTimeframe : undefined,
      dateFrom: timeframeRange.start || undefined,
      dateTo: timeframeRange.end || undefined
    });
  };

  const stats = useMemo(() => calculateDashboardStats(bets), [bets]);

  // O Recharts é desenhado em SVG com cores explícitas, por isso não reage
  // às classes `dark:` do Tailwind — as cores dos eixos, grelha e tooltips
  // têm de ser trocadas manualmente conforme o tema efetivo.
  const chart = useMemo(
    () => ({
      grid: isDark ? "#1E293B" : "#F1F5F9",
      axis: isDark ? "#64748B" : "#94A3B8",
      dot: isDark ? "#0F172A" : "#fff",
      tooltip: {
        backgroundColor: isDark ? "#0F172A" : "#fff",
        borderColor: isDark ? "#334155" : "#E2E8F0",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        fontSize: "12px",
        color: isDark ? "#E2E8F0" : "#0F172A"
      }
    }),
    [isDark]
  );

  // 1. Prepare data for profit history chart
  const profitChartData = useMemo(() => {
    // Sort settled bets chronologically by dateTime
    const settledBets = bets
      .filter(b => b.status !== "POR_LIQUIDAR")
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    let runningProfit = 0;
    const data = settledBets.map((bet, index) => {
      runningProfit += safeNum(bet.netProfit);
      return {
        index: index + 1,
        data: bet.dateTime ? bet.dateTime.split(" ")[0] : "Sem Data", // Just date
        lucro: Number(runningProfit.toFixed(2)),
        lucroIndividual: safeNum(bet.netProfit),
        evento: (bet.selections && bet.selections[0]?.event) || "Vários"
      };
    });

    // If empty, add a default start point
    if (data.length === 0) {
      return [{ index: 0, data: "Sem Dados", lucro: 0, lucroIndividual: 0, evento: "" }];
    }

    // Add initial 0 point
    return [{ index: 0, data: "Início", lucro: 0, lucroIndividual: 0, evento: "Início" }, ...data];
  }, [bets]);

  const monthlyChartBounds = useMemo(() => {
    const settledDates = bets
      .filter(b => b.status !== "POR_LIQUIDAR")
      .map(b => fromLocalDateKey(b.dateTime?.slice(0, 10) || ""))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    const fallback = new Date();
    const rangeStart = fromLocalDateKey(timeframeRange.start) || settledDates[0] || fallback;
    const rangeEnd = fromLocalDateKey(timeframeRange.end) || settledDates.at(-1) || rangeStart;
    const chronologicalStart = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const chronologicalEnd = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
    return { start: chronologicalStart, end: chronologicalEnd };
  }, [bets, timeframeRange]);

  const showMonthlyPerformance = useMemo(() => {
    return rangeSpansAtLeastTwoMonths(monthlyChartBounds.start, monthlyChartBounds.end);
  }, [monthlyChartBounds]);

  // 1b. Prepare monthly buckets for the active timeframe. Empty months inside
  // the selected range stay visible with zero values, but months outside it do not.
  const monthlyPerformanceData = useMemo(() => {
    const monthsData: { year: number; month: number; label: string; profit: number; volume: number; betsCount: number }[] = [];
    const monthNamesPT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const firstMonth = new Date(monthlyChartBounds.start.getFullYear(), monthlyChartBounds.start.getMonth(), 1);
    const lastMonth = new Date(monthlyChartBounds.end.getFullYear(), monthlyChartBounds.end.getMonth(), 1);

    for (let cursor = new Date(firstMonth); cursor <= lastMonth; cursor.setMonth(cursor.getMonth() + 1)) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      monthsData.push({
        year: y,
        month: m,
        label: `${monthNamesPT[m]} ${String(y).substring(2)}`,
        profit: 0,
        volume: 0,
        betsCount: 0
      });
    }

    bets.forEach(b => {
      if (b.status === "POR_LIQUIDAR") return;
      if (!b.dateTime) return;
      
      const datePart = b.dateTime.split(" ")[0];
      const parts = datePart.split("-").map(Number);
      if (parts.length < 2) return;
      const year = parts[0];
      const month = parts[1];
      if (!year || !month) return;
      
      const betMonthIdx = month - 1;
      
      const found = monthsData.find(md => md.year === year && md.month === betMonthIdx);
      if (found) {
        found.profit += safeNum(b.netProfit);
        if (!b.isFreebet) {
          found.volume += safeNum(b.stake);
        }
        found.betsCount++;
      }
    });

    return monthsData.map(md => ({
      mes: md.label,
      "Lucro Líquido": Number(md.profit.toFixed(2)),
      "Volume": Number(md.volume.toFixed(2)),
      "Apostas": md.betsCount
    }));
  }, [bets, monthlyChartBounds]);

  // 2. Prepare data for Bookmaker distribution
  const bookmakerData = useMemo(() => {
    const counts: Record<string, { stake: number; profit: number; count: number }> = {};
    bets.forEach(b => {
      const bkm = b.bookmaker || "Outra";
      if (!counts[bkm]) {
        counts[bkm] = { stake: 0, profit: 0, count: 0 };
      }
      counts[bkm].count++;
      if (b.status !== "POR_LIQUIDAR") {
        if (!b.isFreebet) counts[bkm].stake += safeNum(b.stake);
        counts[bkm].profit += safeNum(b.netProfit);
      }
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      apostas: data.count,
      volume: Number(safeNum(data.stake).toFixed(2)),
      lucro: Number(safeNum(data.profit).toFixed(2))
    })).sort((a, b) => b.lucro - a.lucro);
  }, [bets]);

  // 3. Prepare data for Bet Status distribution.
  // "Distribuição de Resultados" mostra apenas apostas RESOLVIDAS — as
  // pendentes (POR_LIQUIDAR) não são um resultado. Antes eram incluídas como
  // fatia "Pendente", o que fazia a soma das fatias não bater certo com o
  // número central "Resolvidas". (correção do bug D1)
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      GANHA: 0,
      PERDIDA: 0,
      ANULADA: 0,
      MEIO_GANHA: 0,
      MEIO_PERDIDA: 0,
      CASHOUT: 0,
    };

    bets.forEach(b => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      }
    });

    return [
      { name: "Ganha", status: "GANHA" as BetStatus, value: statusCounts.GANHA, color: "#10B981" },
      { name: "Meio Ganha", status: "MEIO_GANHA" as BetStatus, value: statusCounts.MEIO_GANHA, color: "#34D399" },
      { name: "Cashout", status: "CASHOUT" as BetStatus, value: statusCounts.CASHOUT, color: "#8B5CF6" },
      { name: "Anulada", status: "ANULADA" as BetStatus, value: statusCounts.ANULADA, color: "#9CA3AF" },
      { name: "Meio Perdida", status: "MEIO_PERDIDA" as BetStatus, value: statusCounts.MEIO_PERDIDA, color: "#F87171" },
      { name: "Perdida", status: "PERDIDA" as BetStatus, value: statusCounts.PERDIDA, color: "#EF4444" },
    ].filter(item => item.value > 0);
  }, [bets]);

  // Freebet summary stats (calculated solely from registered bets)
  const freebetStats = useMemo(() => {
    const freebetBets = bets.filter(b => b.isFreebet);
    const resolvedFreebetBets = freebetBets.filter(b => b.status !== "POR_LIQUIDAR");
    const fbProfit = resolvedFreebetBets.reduce((sum, b) => sum + safeNum(b.netProfit), 0);
    const fbWins = resolvedFreebetBets.filter(b => b.status === "GANHA" || b.status === "MEIO_GANHA").length;
    const totalStakeUsed = freebetBets.reduce((sum, b) => sum + safeNum(b.stake), 0);

    return {
      usageCount: freebetBets.length,
      resolvedCount: resolvedFreebetBets.length,
      totalStakeUsed,
      profit: fbProfit,
      winRate: resolvedFreebetBets.length > 0 ? (fbWins / resolvedFreebetBets.length) * 100 : 0
    };
  }, [bets]);

  // Insights helper
  const insights = useMemo(() => {
    const settled = bets.filter(b => b.status !== "POR_LIQUIDAR");
    if (settled.length === 0) return null;

    const highestWin = [...settled]
      .filter(b => b.status === "GANHA" || b.status === "MEIO_GANHA")
      .sort((a, b) => safeNum(b.netProfit) - safeNum(a.netProfit))[0];

    const settledWins = settled.filter(b => b.status === "GANHA" || b.status === "MEIO_GANHA");
    const averageWonOdd = settledWins.length > 0
      ? settledWins.reduce((acc, curr) => acc + safeNum(curr.odd), 0) / settledWins.length
      : 1.00;

    const bestBkm = bookmakerData[0];

    return {
      highestWin,
      averageWonOdd: Number(averageWonOdd.toFixed(2)),
      bestBkm
    };
  }, [bets, bookmakerData]);

  return (
    <div className="space-y-6" id="dashboard-tab">

      {/* Filtros (D2) */}
      <div className="overflow-visible rounded-lg border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900" id="dashboard-filters">
        <div className="flex flex-col gap-3 bg-slate-50/60 p-4 dark:bg-slate-950/20 xl:flex-row xl:items-center">
          <div className="flex min-w-fit items-center justify-between gap-3 xl:justify-start">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Filter size={13} /> Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {activeFilterCount}
                </span>
              )}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] font-semibold text-slate-400 transition-colors hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-300 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <FilterDropdown
              value={filterBookmaker}
              options={[{ value: "ALL", label: "Todas as Casas" }, ...bookmakerOptions.map(bookmaker => ({ value: bookmaker, label: bookmaker }))]}
              onChange={setFilterBookmaker}
              ariaLabel="Filtrar por casa de apostas"
            />

            <FilterDropdown
              value={filterSport}
              options={[{ value: "ALL", label: "Todos os Desportos" }, ...sportOptions.map(sport => ({ value: sport, label: sport }))]}
              onChange={setFilterSport}
              ariaLabel="Filtrar por desporto"
            />

            <FilterDropdown
              value={filterType}
              options={[
                { value: "ALL", label: "Qualquer Tipo" },
                { value: "SIMPLES", label: "Simples" },
                { value: "MULTIPLA", label: "Múltipla" }
              ]}
              onChange={setFilterType}
              ariaLabel="Filtrar por tipo de aposta"
            />

            <FilterDropdown
              value={filterFreebet}
              options={[
                { value: "ALL", label: "Dinheiro e Freebet" },
                { value: "NORMAL", label: "Dinheiro Real" },
                { value: "FREEBET", label: "Freebet" }
              ]}
              onChange={setFilterFreebet}
              ariaLabel="Filtrar por tipo de dinheiro"
            />

            <div ref={customRangeContainerRef} className="relative min-w-0">
              <FilterDropdown
                value={filterTimeframe}
                options={TIMEFRAME_OPTIONS}
                open={isTimeframeMenuOpen}
                onOpenChange={setIsTimeframeMenuOpen}
                onTriggerClick={() => {
                  if (filterTimeframe === "CUSTOM") {
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
                onChange={(nextTimeframe) => {
                  setFilterTimeframe(nextTimeframe);
                  if (nextTimeframe === "CUSTOM") openCustomRangePicker();
                  else setIsCustomRangeOpen(false);
                }}
                ariaLabel="Filtrar por período"
              />

              <AnimatePresence>
                {filterTimeframe === "CUSTOM" && isCustomRangeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100vh-8rem)] w-[min(22rem,calc(100vw-3rem))] select-none overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
                    role="dialog"
                    aria-label="Escolher período personalizado"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
                          <CalendarRange size={15} />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Período personalizado</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">As datas inicial e final são incluídas.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Data inicial</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRangeEndpoint("start");
                            const date = fromLocalDateKey(customStartDate);
                            if (date) setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                          }}
                          className={`flex h-10 w-full items-center justify-between rounded-md border px-2.5 text-left text-xs font-semibold outline-none transition-all cursor-pointer ${
                            activeRangeEndpoint === "start"
                              ? "border-indigo-500 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/10 dark:bg-indigo-950/40 dark:text-indigo-200"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
                          }`}
                        >
                          <span>{formatDateKey(customStartDate)}</span>
                          <CalendarRange size={13} className="text-slate-400" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Data final</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRangeEndpoint("end");
                            const date = fromLocalDateKey(customEndDate || customStartDate);
                            if (date) setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                          }}
                          className={`flex h-10 w-full items-center justify-between rounded-md border px-2.5 text-left text-xs font-semibold outline-none transition-all cursor-pointer ${
                            activeRangeEndpoint === "end"
                              ? "border-indigo-500 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/10 dark:bg-indigo-950/40 dark:text-indigo-200"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
                          }`}
                        >
                          <span>{formatDateKey(customEndDate)}</span>
                          <CalendarRange size={13} className="text-slate-400" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="mb-2 flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300 cursor-pointer"
                          aria-label="Mês anterior"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
                          {calendarMonth.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300 cursor-pointer"
                          aria-label="Mês seguinte"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>

                      <div className="mb-1 grid grid-cols-7">
                        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => (
                          <span key={day} className="flex h-6 items-center justify-center text-[9px] font-bold uppercase text-slate-400 dark:text-slate-600">
                            {day}
                          </span>
                        ))}
                      </div>

                      <motion.div
                        key={`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`}
                        initial={{ opacity: 0.45, x: 3 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.12, ease: "easeOut" }}
                        className="grid grid-cols-7 gap-0.5"
                      >
                        {calendarDays.map(date => {
                          const dateKey = toLocalDateKey(date);
                          const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                          const isStart = dateKey === customStartDate;
                          const isEnd = dateKey === customEndDate;
                          const isRangeEdge = isStart || isEnd;
                          const isInRange = Boolean(customStartDate && customEndDate && dateKey > customStartDate && dateKey < customEndDate);
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
                              {isToday && !isRangeEdge && (
                                <span className="absolute bottom-1 h-0.5 w-0.5 rounded-full bg-indigo-500" />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {bets.length} de {allBets.length} apostas
          </span>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Profit Card */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40" id="card-net-profit">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lucro Líquido</p>
              <h3 className={`text-3xl font-light mt-1.5 tracking-tight font-display ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              {stats.netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Retorno: <strong className="text-slate-700 dark:text-slate-200 font-medium">{stats.totalReturn.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</strong></span>
            <span className={`font-semibold flex items-center gap-0.5 ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {stats.netProfit >= 0 ? "+" : ""}{stats.totalStake > 0 ? (safeNum(stats.netProfit / stats.totalStake) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
        </div>

        {/* ROI / Yield Card */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40" id="card-roi">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ROI / Yield</p>
              <h3 className={`text-3xl font-light mt-1.5 tracking-tight font-display ${stats.yield >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.yield >= 0 ? "+" : ""}{safeNum(stats.yield).toFixed(2)}%
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.yield >= 0 ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Volume: <strong className="text-slate-700 dark:text-slate-200 font-medium">{stats.totalStake.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</strong></span>
            <span className="text-slate-400 dark:text-slate-500">Eficiência</span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40" id="card-winrate">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Taxa de Acerto</p>
              <h3 className="text-3xl font-light mt-1.5 tracking-tight text-slate-800 dark:text-slate-100 font-display">
                {safeNum(stats.winRate).toFixed(1)}%
              </h3>
            </div>
            <div className="p-2 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-xs">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.winRate)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              <span>{stats.wonBets} Ganhas</span>
              <span>{bets.filter(b => b.status !== "POR_LIQUIDAR").length} Resolvidas</span>
            </div>
          </div>
        </div>

        {/* Total Bets Card */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40" id="card-totalbets">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total de Apostas</p>
              <h3 className="text-3xl font-light mt-1.5 tracking-tight text-slate-800 dark:text-slate-100 font-display">
                {stats.totalBets} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">registadas</span>
              </h3>
            </div>
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {stats.pendingBets} Pendentes</span>
            <span className="text-slate-400 dark:text-slate-500">Ativas</span>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className={`grid grid-cols-1 gap-6 ${showMonthlyPerformance ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        
        {/* Evolution Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[380px]" id="chart-profit-evolution">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display">Evolução do Lucro Líquido</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Evolução acumulada ao longo das apostas resolvidas</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={profitChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="data"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickFormatter={(v) => `${v}${currency}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toFixed(2)}${currency}`, "Lucro Acumulado"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const payloadData = payload[0].payload;
                      return `Aposta #${payloadData.index} (${payloadData.data}) - ${payloadData.evento}`;
                    }
                    return label;
                  }}
                  contentStyle={chart.tooltip}
                />
                <Area 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[380px]" id="chart-status-distribution">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display mb-1">Distribuição de Resultados</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Percentagem por estado de aposta</p>
          
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {statusData.length > 0 ? (
              <>
                <div className="relative flex-1 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            onClick={() => openBetsForStatus(entry.status)}
                            className="cursor-pointer outline-none transition-opacity hover:opacity-80"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value} Apostas`]}
                        contentStyle={chart.tooltip}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Text */}
                  <div className="absolute text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Resolvidas</p>
                    <p className="text-3xl font-light text-slate-800 dark:text-slate-100 font-display mt-0.5">
                      {bets.filter(b => b.status !== "POR_LIQUIDAR").length}
                    </p>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                  {statusData.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => openBetsForStatus(item.status)}
                      className="group flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                      title={`Ver apostas: ${item.name}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate group-hover:underline">{item.name} ({item.value})</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                <AlertCircle className="stroke-1 text-slate-300 dark:text-slate-600 mb-2" size={32} />
                <p className="text-xs">Nenhum resultado registado ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance Chart */}
        {showMonthlyPerformance && (
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[380px]" id="chart-monthly-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display">Desempenho Mensal</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Lucro líquido dentro do período selecionado</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyPerformanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: chart.axis }}
                  tickFormatter={(v) => `${v}${currency}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toFixed(2)}${currency}`, "Lucro Líquido"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const payloadData = payload[0].payload;
                      return `${payloadData.mes}: ${payloadData.Apostas} Apostas | Volume: ${payloadData.Volume}${currency}`;
                    }
                    return label;
                  }}
                  contentStyle={chart.tooltip}
                />
                <Line 
                  type="monotone" 
                  dataKey="Lucro Líquido" 
                  stroke="#0D9488" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: chart.dot }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

      </div>

      {/* Bookmaker Breakdown & Freebets Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookmaker Table */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 lg:col-span-2 flex flex-col" id="bookmakers-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display">Desempenho por Casa de Apostas</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Análise de rentabilidade e volume por operador</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Operador</th>
                  <th className="py-2.5 text-center">Apostas</th>
                  <th className="py-2.5 text-right">Volume</th>
                  <th className="py-2.5 text-right">Lucro Líquido</th>
                  <th className="py-2.5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookmakerData.map((bkm, idx) => {
                  const bkmRoi = bkm.volume > 0 ? (bkm.lucro / bkm.volume) * 100 : 0;
                  return (
                    <tr key={idx} className="text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-100">{bkm.name}</td>
                      <td className="py-2.5 text-center">{bkm.apostas}</td>
                      <td className="py-2.5 text-right font-mono">{bkm.volume.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</td>
                      <td className={`py-2.5 text-right font-semibold font-mono ${bkm.lucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {bkm.lucro >= 0 ? "+" : ""}{bkm.lucro.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
                      </td>
                      <td className={`py-2.5 text-right font-medium font-mono ${bkmRoi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {bkmRoi >= 0 ? "+" : ""}{bkmRoi.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {bookmakerData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 dark:text-slate-500">Sem registos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Freebets Overview card */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between" id="freebets-performance-summary">
          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display mb-1">Análise de Freebets</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Estatísticas de desempenho das apostas com freebet</p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total de Freebets Registadas:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{freebetStats.usageCount}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total Investido (Freebet):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{freebetStats.totalStakeUsed.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Lucro Líquido Gerado:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{freebetStats.profit.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Taxa de Acerto (Freebets):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{safeNum(freebetStats.winRate).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Resolvidas / Total:</span>
              <span>{freebetStats.resolvedCount} de {freebetStats.usageCount}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${freebetStats.usageCount > 0 
                    ? (freebetStats.resolvedCount / freebetStats.usageCount) * 100 
                    : 0}%` 
                }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Insights Row */}
      {insights && (
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-insights">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded mt-0.5 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Operador Mais Rentável</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Onde fazes mais dinheiro</p>
              {insights.bestBkm && insights.bestBkm.lucro > 0 ? (
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {insights.bestBkm.name} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({insights.bestBkm.lucro > 0 ? "+" : ""}{safeNum(insights.bestBkm.lucro).toFixed(2)}{currency})</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Sem dados suficientes</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded mt-0.5 shrink-0">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Odd Média das Apostas Ganhas</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Nível médio de risco vitorioso</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                {insights.averageWonOdd > 1 ? safeNum(insights.averageWonOdd).toFixed(2) : "1.00"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded mt-0.5 shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Maior Lucro Individual</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">O teu boletim de maior sucesso</p>
              {insights.highestWin ? (
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate max-w-[200px]">
                  +{safeNum(insights.highestWin.netProfit).toFixed(2)}{currency}
                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 ml-1">
                    ({insights.highestWin.selections && insights.highestWin.selections[0]?.event || "Múltipla"})
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Nenhum prémio ganho.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

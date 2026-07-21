import React, { useMemo, useState } from "react";
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
  ArrowUpRight
} from "lucide-react";
import { Bet, BetStatus, BookieAccount, DashboardStats } from "../types";
import { calculateDashboardStats, safeNum } from "../utils";
import FilterDropdown from "./FilterDropdown";
import FiltersBar from "./FiltersBar";
import TimeframeFilter, {
  EMPTY_TIMEFRAME_FILTER,
  fromLocalDateKey,
  rangeSpansAtLeastTwoMonths,
  resolveTimeframeRange,
  type Timeframe,
  type TimeframeFilterValue,
} from "./TimeframeFilter";
import { EMPTY_BET_FILTERS, readFilters, serializeFilters } from "../lib/filterParams";
import { useUrlFilterSync } from "../hooks/useUrlFilterSync";
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
  // Contas por casa do utilizador; ausente/vazio na vista de um amigo
  // (não conhecemos as contas dele) — o filtro de conta fica escondido.
  accounts?: BookieAccount[];
  // Opcional: drill-down para a lista de apostas filtrada. Ausente na vista
  // read-only de um amigo (não há BetsManager próprio para onde navegar).
  onOpenBets?: (filters: DashboardBetsFilters) => void;
  // Query string inicial ("?account=…"), vinda do SSR ou do URL no arranque.
  initialSearch?: string;
}

export interface DashboardBetsFilters {
  // "RESOLVED" é um pseudo-estado (todas menos POR_LIQUIDAR) usado pelo
  // drill-down do gráfico "Resolvidas"; o histórico trata-o em matchesStatus.
  status: BetStatus | "RESOLVED";
  bookmaker?: string;
  sport?: string;
  type?: string;
  money?: string;
  timeframe?: Timeframe;
  account?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function Dashboard({ bets: allBets, currency, isDark, onOpenBets, accounts = [], initialSearch }: DashboardProps) {
  // Filtros do dashboard (D2): recalculam TODAS as estatísticas/gráficos para o
  // subconjunto escolhido. As opções vêm da lista completa; o cálculo usa a
  // lista filtrada `bets` (sombreada abaixo).
  const initialFilters = useMemo(
    () => readFilters(new URLSearchParams(initialSearch ?? "")),
    [initialSearch]
  );

  const [filterBookmaker, setFilterBookmaker] = useState(initialFilters.bookmaker);
  // "ALL" | "NONE" (apostas sem conta) | id de uma conta
  const [filterAccount, setFilterAccount] = useState(initialFilters.account);
  const [filterSport, setFilterSport] = useState(initialFilters.sport);
  const [filterType, setFilterType] = useState(initialFilters.type);
  const [filterFreebet, setFilterFreebet] = useState(initialFilters.money);
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilterValue>(initialFilters.timeframe);

  // Filtros <-> URL: cada alteração fica no histórico do browser e o
  // back/forward volta a aplicá-la sem remontar o dashboard.
  const filterSearch = useMemo(
    () => serializeFilters({
      ...EMPTY_BET_FILTERS,
      bookmaker: filterBookmaker,
      account: filterAccount,
      sport: filterSport,
      type: filterType,
      money: filterFreebet,
      timeframe: timeframeFilter,
    }),
    [filterBookmaker, filterAccount, filterSport, filterType, filterFreebet, timeframeFilter]
  );

  useUrlFilterSync({
    path: "/dashboard",
    search: filterSearch,
    onExternalChange: (params) => {
      const next = readFilters(params);
      setFilterBookmaker(next.bookmaker);
      setFilterAccount(next.account);
      setFilterSport(next.sport);
      setFilterType(next.type);
      setFilterFreebet(next.money);
      setTimeframeFilter(next.timeframe);
    },
  });

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

  const timeframeRange = useMemo(() => resolveTimeframeRange(timeframeFilter), [timeframeFilter]);

  // `bets` sombreia a prop: é o subconjunto filtrado que todo o código abaixo usa.
  const bets = useMemo(
    () =>
      allBets.filter(b => {
        // Apostas ignoradas nunca contam para estatísticas/gráficos.
        if (b.isIgnored) return false;
        if (filterBookmaker !== "ALL" && b.bookmaker !== filterBookmaker) return false;
        if (filterAccount === "NONE" && b.accountId) return false;
        if (filterAccount !== "ALL" && filterAccount !== "NONE" && b.accountId !== filterAccount) return false;
        if (filterType !== "ALL" && b.type !== filterType) return false;
        // Mesma semântica do filtro de dinheiro do BetsManager, para o
        // drill-down mostrar exatamente as apostas contadas aqui.
        if (filterFreebet === "FREEBET" && !b.isFreebet) return false;
        if (filterFreebet === "RISK_FREE" && !b.isRiskFree) return false;
        if (filterFreebet === "NORMAL" && (b.isFreebet || b.isRiskFree)) return false;
        if (filterSport !== "ALL" && !(b.selections || []).some(s => s.sport === filterSport)) return false;
        if (timeframeRange.start || timeframeRange.end) {
          const betDate = b.dateTime?.slice(0, 10) || "";
          if (!betDate) return false;
          if (timeframeRange.start && betDate < timeframeRange.start) return false;
          if (timeframeRange.end && betDate > timeframeRange.end) return false;
        }
        return true;
      }),
    [allBets, filterBookmaker, filterAccount, filterSport, filterType, filterFreebet, timeframeRange]
  );

  const activeFilterCount = [filterBookmaker, filterAccount, filterSport, filterType, filterFreebet, timeframeFilter.timeframe]
    .filter(value => value !== "ALL").length;

  const clearFilters = () => {
    setFilterBookmaker("ALL");
    setFilterAccount("ALL");
    setFilterSport("ALL");
    setFilterType("ALL");
    setFilterFreebet("ALL");
    setTimeframeFilter({ ...EMPTY_TIMEFRAME_FILTER });
  };

  // Só o dono do painel pode navegar para o histórico (drill-down). Na vista
  // read-only do perfil de um amigo não há `onOpenBets`, por isso os gráficos
  // não devem parecer nem comportar-se como clicáveis.
  const canDrill = Boolean(onOpenBets);

  const openBetsForStatus = (status: BetStatus) => {
    onOpenBets?.({
      status,
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      account: filterAccount !== "ALL" ? filterAccount : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterFreebet !== "ALL" ? filterFreebet : undefined,
      timeframe: timeframeFilter.timeframe !== "ALL" ? timeframeFilter.timeframe : undefined,
      dateFrom: timeframeRange.start || undefined,
      dateTo: timeframeRange.end || undefined
    });
  };

  // Drill-down do centro do donut: abre o histórico só com as apostas resolvidas
  // (todas menos POR_LIQUIDAR), respeitando os filtros ativos do painel.
  const openResolvedBets = () => {
    onOpenBets?.({
      status: "RESOLVED",
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      account: filterAccount !== "ALL" ? filterAccount : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterFreebet !== "ALL" ? filterFreebet : undefined,
      timeframe: timeframeFilter.timeframe !== "ALL" ? timeframeFilter.timeframe : undefined,
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
      grid: isDark ? "#27272a" : "#f4f4f5",
      axis: isDark ? "#71717a" : "#a1a1aa",
      dot: isDark ? "#18181b" : "#fff",
      tooltip: {
        backgroundColor: isDark ? "#18181b" : "#fff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        fontSize: "12px",
        color: isDark ? "#e4e4e7" : "#18181b"
      }
    }),
    [isDark]
  );

  // 1. Prepare data for profit history chart
  const profitChartData = useMemo(() => {
    // Sort settled bets chronologically by dateTime
    // "YYYY-MM-DD HH:mm" só é aceite pelo Date com o "T" — sem o replace o
    // Safari/iOS devolve Invalid Date e a ordenação do gráfico desfaz-se.
    const settledBets = bets
      .filter(b => b.status !== "POR_LIQUIDAR")
      .sort((a, b) => new Date(a.dateTime.replace(" ", "T")).getTime() - new Date(b.dateTime.replace(" ", "T")).getTime());

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
      <div className="overflow-visible rounded-sm border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900" id="dashboard-filters">
        <FiltersBar
          activeFilterCount={activeFilterCount}
          onClear={clearFilters}
          trailing={
            <span className="shrink-0 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              {bets.length} de {allBets.length} apostas
            </span>
          }
        >
          <FilterDropdown
            className="flex-1 min-w-40"
            value={filterBookmaker}
            options={[{ value: "ALL", label: "Todas as Casas" }, ...bookmakerOptions.map(bookmaker => ({ value: bookmaker, label: bookmaker }))]}
            onChange={setFilterBookmaker}
            ariaLabel="Filtrar por casa de apostas"
          />

          {accounts.length > 0 && (
            <FilterDropdown
              className="flex-1 min-w-40"
              value={filterAccount}
              options={[
                { value: "ALL", label: "Todas as Contas" },
                ...accounts.map(account => ({ value: account.id, label: `${account.bookmaker} · ${account.label}` })),
                { value: "NONE", label: "Sem conta" }
              ]}
              onChange={setFilterAccount}
              ariaLabel="Filtrar por conta"
            />
          )}

          <FilterDropdown
            className="flex-1 min-w-40"
            value={filterSport}
            options={[{ value: "ALL", label: "Todos os Desportos" }, ...sportOptions.map(sport => ({ value: sport, label: sport }))]}
            onChange={setFilterSport}
            ariaLabel="Filtrar por desporto"
          />

          <FilterDropdown
            className="flex-1 min-w-40"
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
            className="flex-1 min-w-40"
            value={filterFreebet}
            options={[
              { value: "ALL", label: "Dinheiro e Freebet" },
              { value: "NORMAL", label: "Dinheiro Real" },
              { value: "FREEBET", label: "Freebet" },
              { value: "RISK_FREE", label: "Sem risco" }
            ]}
            onChange={setFilterFreebet}
            ariaLabel="Filtrar por tipo de dinheiro"
          />

          <TimeframeFilter
            className="flex-1 min-w-40"
            value={timeframeFilter}
            onChange={setTimeframeFilter}
          />
        </FiltersBar>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Profit Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-net-profit">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Lucro Líquido</p>
              <h3 className={`text-2xl font-bold mt-1.5 tracking-tight font-mono ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              {stats.netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Retorno: <strong className="text-zinc-700 dark:text-zinc-200 font-medium">{stats.totalReturn.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</strong></span>
            <span className={`font-semibold flex items-center gap-0.5 ${stats.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {stats.netProfit >= 0 ? "+" : ""}{stats.totalStake > 0 ? (safeNum(stats.netProfit / stats.totalStake) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
        </div>

        {/* ROI / Yield Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-roi">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">ROI / Yield</p>
              <h3 className={`text-2xl font-bold mt-1.5 tracking-tight font-mono ${stats.yield >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {stats.yield >= 0 ? "+" : ""}{safeNum(stats.yield).toFixed(2)}%
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.yield >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Volume: <strong className="text-zinc-700 dark:text-zinc-200 font-medium">{stats.totalStake.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</strong></span>
            <span className="text-zinc-400 dark:text-zinc-500">Eficiência</span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-winrate">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Taxa de Acerto</p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight text-zinc-800 dark:text-zinc-100 font-mono">
                {safeNum(stats.winRate).toFixed(1)}%
              </h3>
            </div>
            <div className="p-2 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 text-xs">
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.winRate)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              <span>{stats.wonBets} Ganhas</span>
              <span>{bets.filter(b => b.status !== "POR_LIQUIDAR").length} Resolvidas</span>
            </div>
          </div>
        </div>

        {/* Total Bets Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40" id="card-totalbets">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Total de Apostas</p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight text-zinc-800 dark:text-zinc-100 font-mono">
                {stats.totalBets} <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">registadas</span>
              </h3>
            </div>
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {stats.pendingBets} Pendentes</span>
            <span className="text-zinc-400 dark:text-zinc-500">Ativas</span>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className={`grid grid-cols-1 gap-6 ${showMonthlyPerformance ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        
        {/* Evolution Chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px]" id="chart-profit-evolution">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">Evolução do Lucro Líquido</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Evolução acumulada ao longo das apostas resolvidas</p>
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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
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
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px]" id="chart-status-distribution">
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display mb-1">Distribuição de Resultados</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Percentagem por estado de aposta</p>
          
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
                            onClick={canDrill ? () => openBetsForStatus(entry.status) : undefined}
                            className={`outline-none transition-opacity ${canDrill ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value} Apostas`]}
                        contentStyle={chart.tooltip}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Text — clicável: leva ao histórico das resolvidas */}
                  <button
                    type="button"
                    onClick={openResolvedBets}
                    disabled={!onOpenBets}
                    title={onOpenBets ? "Ver apostas resolvidas no histórico" : undefined}
                    className={`group absolute flex flex-col items-center text-center bg-transparent border-0 outline-none rounded-sm ${onOpenBets ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className={`text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest transition-colors ${canDrill ? "group-hover:text-emerald-600 dark:group-hover:text-emerald-400" : ""}`}>Resolvidas</span>
                    <span className={`text-2xl font-bold text-zinc-800 dark:text-zinc-100 font-mono mt-0.5 ${canDrill ? "group-hover:underline" : ""}`}>
                      {bets.filter(b => b.status !== "POR_LIQUIDAR").length}
                    </span>
                  </button>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  {statusData.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={canDrill ? () => openBetsForStatus(item.status) : undefined}
                      disabled={!canDrill}
                      className={`group flex items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-zinc-600 transition-colors dark:text-zinc-200 ${canDrill ? "hover:bg-zinc-50 hover:text-emerald-600 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer" : "cursor-default"}`}
                      title={canDrill ? `Ver apostas: ${item.name}` : undefined}
                    >
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                      <span className={`truncate ${canDrill ? "group-hover:underline" : ""}`}>{item.name} ({item.value})</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
                <AlertCircle className="stroke-1 text-zinc-300 dark:text-zinc-600 mb-2" size={32} />
                <p className="text-xs">Nenhum resultado registado ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance Chart */}
        {showMonthlyPerformance && (
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[380px]" id="chart-monthly-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">Desempenho Mensal</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Lucro líquido dentro do período selecionado</p>
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
                  stroke="#06b6d4" 
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
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 lg:col-span-2 flex flex-col" id="bookmakers-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display">Desempenho por Casa de Apostas</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Análise de rentabilidade e volume por operador</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Operador</th>
                  <th className="py-2.5 text-center">Apostas</th>
                  <th className="py-2.5 text-right">Volume</th>
                  <th className="py-2.5 text-right">Lucro Líquido</th>
                  <th className="py-2.5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {bookmakerData.map((bkm, idx) => {
                  const bkmRoi = bkm.volume > 0 ? (bkm.lucro / bkm.volume) * 100 : 0;
                  return (
                    <tr key={idx} className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 font-medium text-zinc-800 dark:text-zinc-100">{bkm.name}</td>
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
                    <td colSpan={5} className="py-4 text-center text-zinc-400 dark:text-zinc-500">Sem registos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Freebets Overview card */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between" id="freebets-performance-summary">
          <div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display mb-1">Análise de Freebets</h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Estatísticas de desempenho das apostas com freebet</p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Total de Freebets Registadas:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{freebetStats.usageCount}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Total Investido (Freebet):</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{freebetStats.totalStakeUsed.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Lucro Líquido Gerado:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{freebetStats.profit.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Taxa de Acerto (Freebets):</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{safeNum(freebetStats.winRate).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
              <span>Resolvidas / Total:</span>
              <span>{freebetStats.resolvedCount} de {freebetStats.usageCount}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
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
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-4 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-insights">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded mt-0.5 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Operador Mais Rentável</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Onde fazes mais dinheiro</p>
              {insights.bestBkm && insights.bestBkm.lucro > 0 ? (
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1">
                  {insights.bestBkm.name} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">({insights.bestBkm.lucro > 0 ? "+" : ""}{safeNum(insights.bestBkm.lucro).toFixed(2)}{currency})</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Sem dados suficientes</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded mt-0.5 shrink-0">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Odd Média das Apostas Ganhas</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Nível médio de risco vitorioso</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1 font-mono">
                {insights.averageWonOdd > 1 ? safeNum(insights.averageWonOdd).toFixed(2) : "1.00"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded mt-0.5 shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Maior Lucro Individual</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">O teu boletim de maior sucesso</p>
              {insights.highestWin ? (
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1 truncate max-w-[200px]">
                  +{safeNum(insights.highestWin.netProfit).toFixed(2)}{currency}
                  <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500 ml-1">
                    ({insights.highestWin.selections && insights.highestWin.selections[0]?.event || "Múltipla"})
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Nenhum prémio ganho.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

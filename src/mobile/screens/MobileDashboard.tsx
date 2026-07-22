// src/mobile/screens/MobileDashboard.tsx
// Dashboard mobile touch-first com paridade total com o dashboard web:
// filtros (em bottom sheet), 4 cartões KPI, evolução do lucro, distribuição
// de resultados, lucro por mês, desempenho por casa, análise de freebets e
// insights. Reutiliza calculateDashboardStats (src/utils.ts) e espelha as
// agregações do desktop para os números baterem certo.
//
// Gráficos em modo estático (isAnimationActive=false): melhor desempenho no
// WebView e sem dependência de requestAnimationFrame.

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  Award,
  Clock,
  Filter,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  Tooltip,
} from "recharts";
import { Bet, BetStatus, BookieAccount } from "../../types";
import type { DashboardBetsFilters } from "../../components/Dashboard";
import { calculateDashboardStats, safeNum } from "../../utils";
import { SectionHeader, MobileCard, ListGroup, ListItem, BottomSheet, Pressable, ChipGroup } from "../ui";

interface MobileDashboardProps {
  bets: Bet[];
  currency: string;
  isDark: boolean;
  accounts?: BookieAccount[];
  onOpenBets?: (filters: DashboardBetsFilters) => void;
}

type Timeframe = "ALL" | "7_DAYS" | "30_DAYS" | "90_DAYS" | "THIS_MONTH" | "THIS_YEAR" | "CUSTOM";

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "ALL", label: "Todo o período" },
  { value: "7_DAYS", label: "7 dias" },
  { value: "30_DAYS", label: "30 dias" },
  { value: "90_DAYS", label: "90 dias" },
  { value: "THIS_MONTH", label: "Este mês" },
  { value: "THIS_YEAR", label: "Este ano" },
  { value: "CUSTOM", label: "Personalizado" },
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "Qualquer tipo" },
  { value: "SIMPLES", label: "Simples" },
  { value: "MULTIPLA", label: "Múltipla" },
];

const MONEY_OPTIONS = [
  { value: "ALL", label: "Dinheiro e freebet" },
  { value: "NORMAL", label: "Dinheiro real" },
  { value: "FREEBET", label: "Freebet" },
  { value: "RISK_FREE", label: "Sem risco" },
];

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const STATUS_META: { name: string; status: BetStatus; color: string }[] = [
  { name: "Ganha", status: "GANHA", color: "#10B981" },
  { name: "Meio ganha", status: "MEIO_GANHA", color: "#34D399" },
  { name: "Cashout", status: "CASHOUT", color: "#8B5CF6" },
  { name: "Anulada", status: "ANULADA", color: "#9CA3AF" },
  { name: "Meio perdida", status: "MEIO_PERDIDA", color: "#F87171" },
  { name: "Perdida", status: "PERDIDA", color: "#EF4444" },
];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function MobileDashboard({
  bets: allBets,
  currency,
  isDark,
  accounts = [],
  onOpenBets,
}: MobileDashboardProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterBookmaker, setFilterBookmaker] = useState("ALL");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [filterSport, setFilterSport] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterMoney, setFilterMoney] = useState("ALL");
  const [filterTimeframe, setFilterTimeframe] = useState<Timeframe>("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const money = (n: number) =>
    `${safeNum(n).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency}`;
  const signed = (n: number) => `${n >= 0 ? "+" : ""}${money(n)}`;

  const bookmakerOptions = useMemo(
    () => Array.from(new Set(allBets.map((b) => b.bookmaker).filter((b): b is string => !!b))).sort(),
    [allBets],
  );
  const sportOptions = useMemo(
    () =>
      Array.from(
        new Set(allBets.flatMap((b) => (b.selections || []).map((s) => s.sport)).filter((s): s is string => !!s)),
      ).sort(),
    [allBets],
  );

  const range = useMemo(() => {
    if (filterTimeframe === "ALL") return { start: "", end: "" };
    if (filterTimeframe === "CUSTOM") return { start: customStart, end: customEnd };
    const today = new Date();
    const start = new Date(today);
    if (filterTimeframe === "7_DAYS") start.setDate(today.getDate() - 6);
    if (filterTimeframe === "30_DAYS") start.setDate(today.getDate() - 29);
    if (filterTimeframe === "90_DAYS") start.setDate(today.getDate() - 89);
    if (filterTimeframe === "THIS_MONTH") start.setDate(1);
    if (filterTimeframe === "THIS_YEAR") start.setMonth(0, 1);
    return { start: toKey(start), end: toKey(today) };
  }, [filterTimeframe, customStart, customEnd]);

  // Subconjunto filtrado — mesma semântica do dashboard desktop.
  const bets = useMemo(
    () =>
      allBets.filter((b) => {
        // Apostas ignoradas nunca contam para estatísticas/gráficos (mesma
        // regra do Dashboard desktop — sem isto os números divergiam).
        if (b.isIgnored) return false;
        if (filterBookmaker !== "ALL" && b.bookmaker !== filterBookmaker) return false;
        if (filterAccount === "NONE" && b.accountId) return false;
        if (filterAccount !== "ALL" && filterAccount !== "NONE" && b.accountId !== filterAccount) return false;
        if (filterType !== "ALL" && b.type !== filterType) return false;
        if (filterMoney === "FREEBET" && !b.isFreebet) return false;
        if (filterMoney === "RISK_FREE" && !b.isRiskFree) return false;
        if (filterMoney === "NORMAL" && (b.isFreebet || b.isRiskFree)) return false;
        if (filterSport !== "ALL" && !(b.selections || []).some((s) => s.sport === filterSport)) return false;
        if (range.start || range.end) {
          const day = b.dateTime?.slice(0, 10) || "";
          if (!day) return false;
          if (range.start && day < range.start) return false;
          if (range.end && day > range.end) return false;
        }
        return true;
      }),
    [allBets, filterBookmaker, filterAccount, filterSport, filterType, filterMoney, range],
  );

  const activeFilterCount = [filterBookmaker, filterAccount, filterSport, filterType, filterMoney, filterTimeframe]
    .filter((v) => v !== "ALL").length;

  const clearFilters = () => {
    setFilterBookmaker("ALL");
    setFilterAccount("ALL");
    setFilterSport("ALL");
    setFilterType("ALL");
    setFilterMoney("ALL");
    setFilterTimeframe("ALL");
    setCustomStart("");
    setCustomEnd("");
  };

  const stats = useMemo(() => calculateDashboardStats(bets), [bets]);
  const settledCount = useMemo(() => bets.filter((b) => b.status !== "POR_LIQUIDAR").length, [bets]);

  // Drill-down mantendo os filtros ativos, como no desktop.
  const openBetsForStatus = (status: BetStatus) => {
    onOpenBets?.({
      status,
      bookmaker: filterBookmaker !== "ALL" ? filterBookmaker : undefined,
      account: filterAccount !== "ALL" ? filterAccount : undefined,
      sport: filterSport !== "ALL" ? filterSport : undefined,
      type: filterType !== "ALL" ? filterType : undefined,
      money: filterMoney !== "ALL" ? filterMoney : undefined,
      dateFrom: range.start || undefined,
      dateTo: range.end || undefined,
    });
  };

  // Evolução cumulativa do lucro.
  const profitSeries = useMemo(() => {
    const settled = bets
      .filter((b) => b.status !== "POR_LIQUIDAR")
      .sort(
        (a, b) =>
          new Date(a.dateTime.replace(" ", "T")).getTime() - new Date(b.dateTime.replace(" ", "T")).getTime(),
      );
    let running = 0;
    const data = settled.map((bet, i) => {
      running += safeNum(bet.netProfit);
      return { i: i + 1, lucro: Number(running.toFixed(2)) };
    });
    return [{ i: 0, lucro: 0 }, ...data];
  }, [bets]);

  // Lucro por mês (últimos 6 meses).
  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: { year: number; month: number; label: string; profit: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTHS_PT[d.getMonth()], profit: 0 });
    }
    bets.forEach((b) => {
      if (b.status === "POR_LIQUIDAR" || !b.dateTime) return;
      const [y, m] = b.dateTime.split(" ")[0].split("-").map(Number);
      if (!y || !m) return;
      const found = months.find((md) => md.year === y && md.month === m - 1);
      if (found) found.profit += safeNum(b.netProfit);
    });
    return months.map((md) => ({ mes: md.label, lucro: Number(md.profit.toFixed(2)) }));
  }, [bets]);

  // Distribuição de resultados (só resolvidas).
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    bets.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return STATUS_META.map((m) => ({ ...m, value: counts[m.status] || 0 })).filter((m) => m.value > 0);
  }, [bets]);

  // Desempenho por casa de apostas.
  const bookmakerData = useMemo(() => {
    const acc: Record<string, { stake: number; profit: number; count: number }> = {};
    bets.forEach((b) => {
      const key = b.bookmaker || "Outra";
      if (!acc[key]) acc[key] = { stake: 0, profit: 0, count: 0 };
      acc[key].count++;
      if (b.status !== "POR_LIQUIDAR") {
        if (!b.isFreebet) acc[key].stake += safeNum(b.stake);
        acc[key].profit += safeNum(b.netProfit);
      }
    });
    return Object.entries(acc)
      .map(([name, d]) => ({
        name,
        apostas: d.count,
        volume: Number(safeNum(d.stake).toFixed(2)),
        lucro: Number(safeNum(d.profit).toFixed(2)),
      }))
      .sort((a, b) => b.lucro - a.lucro);
  }, [bets]);

  // Análise de freebets.
  const freebetStats = useMemo(() => {
    const fb = bets.filter((b) => b.isFreebet);
    const resolved = fb.filter((b) => b.status !== "POR_LIQUIDAR");
    const profit = resolved.reduce((s, b) => s + safeNum(b.netProfit), 0);
    const wins = resolved.filter((b) => b.status === "GANHA" || b.status === "MEIO_GANHA").length;
    return {
      usageCount: fb.length,
      resolvedCount: resolved.length,
      totalStakeUsed: fb.reduce((s, b) => s + safeNum(b.stake), 0),
      profit,
      winRate: resolved.length > 0 ? (wins / resolved.length) * 100 : 0,
    };
  }, [bets]);

  // Insights.
  const insights = useMemo(() => {
    const settled = bets.filter((b) => b.status !== "POR_LIQUIDAR");
    if (settled.length === 0) return null;
    const highestWin = [...settled]
      .filter((b) => b.status === "GANHA" || b.status === "MEIO_GANHA")
      .sort((a, b) => safeNum(b.netProfit) - safeNum(a.netProfit))[0];
    const wins = settled.filter((b) => b.status === "GANHA" || b.status === "MEIO_GANHA");
    const averageWonOdd =
      wins.length > 0 ? wins.reduce((acc, c) => acc + safeNum(c.odd), 0) / wins.length : 1.0;
    return { highestWin, averageWonOdd: Number(averageWonOdd.toFixed(2)), bestBkm: bookmakerData[0] };
  }, [bets, bookmakerData]);

  const profitPositive = stats.netProfit >= 0;
  const areaColor = profitPositive ? "#10b981" : "#f43f5e";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipStyle = {
    background: isDark ? "#18181b" : "#fff",
    border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`,
    borderRadius: 8,
    fontSize: 11,
  };

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex items-center gap-2">
        <Pressable
          as="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
        >
          <Filter size={14} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Pressable>
        {activeFilterCount > 0 && (
          <Pressable
            as="button"
            onClick={clearFilters}
            className="px-3 py-2 rounded-full text-xs font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Limpar
          </Pressable>
        )}
      </div>

      {/* KPI 1 — Lucro líquido (herói, com evolução) */}
      <MobileCard className="!p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
              Lucro líquido
            </p>
            <h3 className={`mt-1.5 text-3xl font-bold font-display tabular-nums ${profitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {signed(stats.netProfit)}
            </h3>
          </div>
          <span className={`p-2 rounded-lg ${profitPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
            {profitPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </span>
        </div>

        <div className="h-24 mt-2 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={profitSeries} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={areaColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="lucro" stroke={areaColor} strokeWidth={2} fill="url(#dashArea)" isAnimationActive={false} dot={false} />
              <Tooltip cursor={false} contentStyle={tooltipStyle} formatter={(v) => [money(Number(v)), "Lucro"]} labelFormatter={() => ""} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Retorno: <strong className="text-zinc-700 dark:text-zinc-200 font-medium">{money(stats.totalReturn)}</strong></span>
          <span className={`font-semibold ${profitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {stats.netProfit >= 0 ? "+" : ""}{stats.totalStake > 0 ? (safeNum(stats.netProfit / stats.totalStake) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
      </MobileCard>

      {/* KPIs 2–4 em grelha */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="ROI / Yield"
          icon={Percent}
          tone={stats.yield >= 0 ? "positive" : "negative"}
          value={`${stats.yield >= 0 ? "+" : ""}${safeNum(stats.yield).toFixed(2)}%`}
          footer={<span>Volume <strong className="text-zinc-700 dark:text-zinc-200">{money(stats.totalStake)}</strong></span>}
        />
        <KpiCard
          label="Taxa de acerto"
          icon={Award}
          tone="cyan"
          value={`${safeNum(stats.winRate).toFixed(1)}%`}
          footer={
            <div className="w-full">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.winRate)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                <span>{stats.wonBets} ganhas</span>
                <span>{settledCount} resolvidas</span>
              </div>
            </div>
          }
        />
        <KpiCard
          label="Total de apostas"
          icon={Layers}
          tone="blue"
          value={String(stats.totalBets)}
          footer={<span className="flex items-center gap-1"><Clock size={11} className="text-blue-500" />{stats.pendingBets} pendentes</span>}
        />
        <KpiCard
          label="Volume total"
          icon={TrendingUp}
          tone="neutral"
          value={money(stats.totalStake)}
          footer={<span>Retorno {money(stats.totalReturn)}</span>}
        />
      </div>

      {/* Distribuição de resultados */}
      {statusData.length > 0 && (
        <>
          <SectionHeader>Distribuição de resultados</SectionHeader>
          <MobileCard>
            <div className="h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              {/* Total ao centro */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-display tabular-nums text-zinc-900 dark:text-zinc-100">{settledCount}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Resolvidas</span>
              </div>
            </div>

            {/* Legenda tocável (drill-down) */}
            <div className="mt-2 -mx-4 -mb-4">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
                {statusData.map((row) => (
                  <ListItem
                    key={row.status}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                        {row.name}
                      </span>
                    }
                    trailing={String(row.value)}
                    chevron={!!onOpenBets}
                    onClick={onOpenBets ? () => openBetsForStatus(row.status) : undefined}
                  />
                ))}
              </div>
            </div>
          </MobileCard>
        </>
      )}

      {/* Lucro por mês */}
      <SectionHeader>Lucro por mês</SectionHeader>
      <MobileCard>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySeries} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: isDark ? "#27272a55" : "#f4f4f555" }} contentStyle={tooltipStyle} formatter={(v) => [money(Number(v)), "Lucro"]} />
              <Bar dataKey="lucro" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {monthlySeries.map((m, i) => (
                  <Cell key={i} fill={m.lucro >= 0 ? "#10b981" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MobileCard>

      {/* Desempenho por casa de apostas */}
      <SectionHeader>Desempenho por casa</SectionHeader>
      {bookmakerData.length > 0 ? (
        <ListGroup>
          {bookmakerData.map((bkm) => {
            const roi = bkm.volume > 0 ? (bkm.lucro / bkm.volume) * 100 : 0;
            return (
              <ListItem
                key={bkm.name}
                title={bkm.name}
                subtitle={`${bkm.apostas} apostas · Volume ${money(bkm.volume)}`}
                trailing={
                  <span className="text-right">
                    <span className={`block font-semibold ${bkm.lucro >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {signed(bkm.lucro)}
                    </span>
                    <span className={`block text-[10px] ${roi >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {roi >= 0 ? "+" : ""}{roi.toFixed(1)}% ROI
                    </span>
                  </span>
                }
              />
            );
          })}
        </ListGroup>
      ) : (
        <MobileCard className="text-center text-xs text-zinc-400 dark:text-zinc-500">Sem registos.</MobileCard>
      )}

      {/* Análise de freebets */}
      <SectionHeader>Análise de freebets</SectionHeader>
      <MobileCard>
        <div className="space-y-2.5 text-xs">
          <Row label="Freebets registadas" value={String(freebetStats.usageCount)} />
          <Row label="Total investido (freebet)" value={money(freebetStats.totalStakeUsed)} />
          <Row
            label="Lucro líquido gerado"
            value={signed(freebetStats.profit)}
            valueClass={freebetStats.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          />
          <Row label="Taxa de acerto (freebets)" value={`${safeNum(freebetStats.winRate).toFixed(1)}%`} />
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">
            <span>Resolvidas / total</span>
            <span>{freebetStats.resolvedCount} de {freebetStats.usageCount}</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${freebetStats.usageCount > 0 ? (freebetStats.resolvedCount / freebetStats.usageCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </MobileCard>

      {/* Insights */}
      {insights && (
        <>
          <SectionHeader>Insights</SectionHeader>
          <MobileCard className="space-y-4">
            <Insight
              icon={CheckCircle2}
              tone="emerald"
              title="Operador mais rentável"
              hint="Onde fazes mais dinheiro"
              value={
                insights.bestBkm && insights.bestBkm.lucro > 0
                  ? `${insights.bestBkm.name} (${signed(insights.bestBkm.lucro)})`
                  : "Sem dados suficientes"
              }
            />
            <Insight
              icon={ArrowUpRight}
              tone="emerald"
              title="Odd média das ganhas"
              hint="Nível médio de risco vitorioso"
              value={insights.averageWonOdd > 1 ? safeNum(insights.averageWonOdd).toFixed(2) : "1.00"}
            />
            <Insight
              icon={Award}
              tone="amber"
              title="Maior lucro individual"
              hint="O teu boletim de maior sucesso"
              value={
                insights.highestWin
                  ? `${signed(safeNum(insights.highestWin.netProfit))} · ${insights.highestWin.selections?.[0]?.event || "Múltipla"}`
                  : "Nenhum prémio ganho."
              }
            />
          </MobileCard>
        </>
      )}

      {stats.totalBets === 0 && (
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">
          Sem apostas para os filtros escolhidos.
        </div>
      )}

      {/* Sheet de filtros */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        headerAction={
          activeFilterCount > 0 ? (
            <Pressable as="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1">
              Limpar tudo
            </Pressable>
          ) : undefined
        }
      >
        <div className="space-y-4 pb-2">
          <ChipGroup
            label="Período"
            options={TIMEFRAME_OPTIONS}
            value={filterTimeframe}
            onChange={(v) => setFilterTimeframe(v as Timeframe)}
          />

          {filterTimeframe === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">De</span>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">Até</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
                />
              </label>
            </div>
          )}

          <ChipGroup
            label="Casa de apostas"
            options={[{ value: "ALL", label: "Todas" }, ...bookmakerOptions.map((b) => ({ value: b, label: b }))]}
            value={filterBookmaker}
            onChange={setFilterBookmaker}
          />

          {accounts.length > 0 && (
            <ChipGroup
              label="Conta"
              options={[
                { value: "ALL", label: "Todas" },
                ...accounts.map((a) => ({ value: a.id, label: `${a.bookmaker} · ${a.label}` })),
                { value: "NONE", label: "Sem conta" },
              ]}
              value={filterAccount}
              onChange={setFilterAccount}
            />
          )}

          {sportOptions.length > 0 && (
            <ChipGroup
              label="Desporto"
              options={[{ value: "ALL", label: "Todos" }, ...sportOptions.map((s) => ({ value: s, label: s }))]}
              value={filterSport}
              onChange={setFilterSport}
            />
          )}

          <ChipGroup label="Tipo" options={TYPE_OPTIONS} value={filterType} onChange={setFilterType} />
          <ChipGroup label="Dinheiro" options={MONEY_OPTIONS} value={filterMoney} onChange={setFilterMoney} />

          <Pressable
            as="button"
            onClick={() => setFiltersOpen(false)}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center"
          >
            Ver {bets.length} {bets.length === 1 ? "aposta" : "apostas"}
          </Pressable>
        </div>
      </BottomSheet>
    </div>
  );
}

// ---------------------------------------------------------------- auxiliares

const TONES: Record<string, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  blue: "text-blue-600 dark:text-blue-400",
  neutral: "text-zinc-800 dark:text-zinc-100",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
};

function KpiCard({
  label,
  icon: Icon,
  value,
  tone,
  footer,
}: {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  value: string;
  tone: keyof typeof TONES | string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono leading-tight">
          {label}
        </p>
        <Icon size={14} className={TONES[tone] || TONES.neutral} />
      </div>
      <p className={`mt-1.5 text-xl font-bold font-display tabular-nums ${TONES[tone] || TONES.neutral}`}>{value}</p>
      {footer && (
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
          {footer}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = "text-zinc-800 dark:text-zinc-100" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`font-semibold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function Insight({
  icon: Icon,
  tone,
  title,
  hint,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: string;
  title: string;
  hint: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`p-2 rounded-lg shrink-0 ${tone === "amber" ? "bg-amber-500/10" : "bg-emerald-500/10"} ${TONES[tone]}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{title}</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}


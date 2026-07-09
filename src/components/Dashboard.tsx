import React, { useMemo } from "react";
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
import { Bet, DashboardStats } from "../types";
import { calculateDashboardStats, safeNum } from "../utils";
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
}

export default function Dashboard({ bets, currency }: DashboardProps) {
  const stats = useMemo(() => calculateDashboardStats(bets), [bets]);

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

  // 1b. Prepare data for Monthly Performance (last 6 months)
  const monthlyPerformanceData = useMemo(() => {
    const now = new Date();
    const monthsData: { year: number; month: number; label: string; profit: number; volume: number; betsCount: number }[] = [];
    
    const monthNamesPT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
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
  }, [bets]);

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

  // 3. Prepare data for Bet Status distribution
  const statusData = useMemo(() => {
    const statusCounts = {
      GANHA: 0,
      PERDIDA: 0,
      ANULADA: 0,
      MEIO_GANHA: 0,
      MEIO_PERDIDA: 0,
      POR_LIQUIDAR: 0,
    };

    bets.forEach(b => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      }
    });

    return [
      { name: "Ganha", value: statusCounts.GANHA, color: "#10B981" },
      { name: "Meio Ganha", value: statusCounts.MEIO_GANHA, color: "#34D399" },
      { name: "Anulada", value: statusCounts.ANULADA, color: "#9CA3AF" },
      { name: "Meio Perdida", value: statusCounts.MEIO_PERDIDA, color: "#F87171" },
      { name: "Perdida", value: statusCounts.PERDIDA, color: "#EF4444" },
      { name: "Pendente", value: statusCounts.POR_LIQUIDAR, color: "#3B82F6" },
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

  // Custom tooltips
  const formatValue = (value: number) => `${safeNum(value).toFixed(2)}${currency}`;

  return (
    <div className="space-y-6" id="dashboard-tab">
      
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Profit Card */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col justify-between transition-colors hover:bg-slate-50/50" id="card-net-profit">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro Líquido</p>
              <h3 className={`text-3xl font-light mt-1.5 tracking-tight font-display ${stats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {stats.netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Retorno: <strong className="text-slate-700 font-medium">{stats.totalReturn.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</strong></span>
            <span className={`font-semibold flex items-center gap-0.5 ${stats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {stats.netProfit >= 0 ? "+" : ""}{stats.totalStake > 0 ? (safeNum(stats.netProfit / stats.totalStake) * 100).toFixed(1) : "0.0"}%
            </span>
          </div>
        </div>

        {/* ROI / Yield Card */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col justify-between transition-colors hover:bg-slate-50/50" id="card-roi">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROI / Yield</p>
              <h3 className={`text-3xl font-light mt-1.5 tracking-tight font-display ${stats.yield >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                {stats.yield >= 0 ? "+" : ""}{safeNum(stats.yield).toFixed(2)}%
              </h3>
            </div>
            <div className={`p-2 rounded ${stats.yield >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"}`}>
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Volume: <strong className="text-slate-700 font-medium">{stats.totalStake.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</strong></span>
            <span className="text-slate-400">Eficiência</span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col justify-between transition-colors hover:bg-slate-50/50" id="card-winrate">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Acerto</p>
              <h3 className="text-3xl font-light mt-1.5 tracking-tight text-slate-800 font-display">
                {safeNum(stats.winRate).toFixed(1)}%
              </h3>
            </div>
            <div className="p-2 rounded bg-teal-50 text-teal-600">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1 text-xs">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.winRate)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{stats.wonBets} Ganhas</span>
              <span>{bets.filter(b => b.status !== "POR_LIQUIDAR").length} Resolvidas</span>
            </div>
          </div>
        </div>

        {/* Total Bets Card */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col justify-between transition-colors hover:bg-slate-50/50" id="card-totalbets">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Apostas</p>
              <h3 className="text-3xl font-light mt-1.5 tracking-tight text-slate-800 font-display">
                {stats.totalBets} <span className="text-xs text-slate-400 font-normal">registadas</span>
              </h3>
            </div>
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {stats.pendingBets} Pendentes</span>
            <span className="text-slate-400">Ativas</span>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evolution Chart */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col h-[380px]" id="chart-profit-evolution">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 tracking-tight font-display">Evolução do Lucro Líquido</h4>
              <p className="text-xs text-slate-400 mt-0.5">Evolução acumulada ao longo das apostas resolvidas</p>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="data" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
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
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    borderColor: "#E2E8F0", 
                    borderRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    fontSize: "12px"
                  }}
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
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col h-[380px]" id="chart-status-distribution">
          <h4 className="text-base font-semibold text-slate-900 tracking-tight font-display mb-1">Distribuição de Resultados</h4>
          <p className="text-xs text-slate-400 mb-4">Percentagem por estado de aposta</p>
          
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
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value} Apostas`]}
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          borderColor: "#E2E8F0", 
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Central Text */}
                  <div className="absolute text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resolvidas</p>
                    <p className="text-3xl font-light text-slate-800 font-display mt-0.5">
                      {bets.filter(b => b.status !== "POR_LIQUIDAR").length}
                    </p>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <AlertCircle className="stroke-1 text-slate-300 mb-2" size={32} />
                <p className="text-xs">Nenhum resultado registado ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance Chart */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col h-[380px]" id="chart-monthly-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 tracking-tight font-display">Desempenho Mensal</h4>
              <p className="text-xs text-slate-400 mt-0.5">Evolução do lucro líquido nos últimos 6 meses</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyPerformanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="mes" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
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
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    borderColor: "#E2E8F0", 
                    borderRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    fontSize: "12px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Lucro Líquido" 
                  stroke="#0D9488" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bookmaker Breakdown & Freebets Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookmaker Table */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 lg:col-span-2 flex flex-col" id="bookmakers-performance">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-base font-semibold text-slate-900 tracking-tight font-display">Desempenho por Casa de Apostas</h4>
              <p className="text-xs text-slate-400 mt-0.5">Análise de rentabilidade e volume por operador</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">Operador</th>
                  <th className="py-2.5 text-center">Apostas</th>
                  <th className="py-2.5 text-right">Volume</th>
                  <th className="py-2.5 text-right">Lucro Líquido</th>
                  <th className="py-2.5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookmakerData.map((bkm, idx) => {
                  const bkmRoi = bkm.volume > 0 ? (bkm.lucro / bkm.volume) * 100 : 0;
                  return (
                    <tr key={idx} className="text-slate-600 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 font-medium text-slate-800">{bkm.name}</td>
                      <td className="py-2.5 text-center">{bkm.apostas}</td>
                      <td className="py-2.5 text-right font-mono">{bkm.volume.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</td>
                      <td className={`py-2.5 text-right font-semibold font-mono ${bkm.lucro >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {bkm.lucro >= 0 ? "+" : ""}{bkm.lucro.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
                      </td>
                      <td className={`py-2.5 text-right font-medium font-mono ${bkmRoi >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {bkmRoi >= 0 ? "+" : ""}{bkmRoi.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {bookmakerData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">Sem registos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Freebets Overview card */}
        <div className="bg-white rounded-sm p-5 border border-slate-200 flex flex-col justify-between" id="freebets-performance-summary">
          <div>
            <h4 className="text-base font-semibold text-slate-900 tracking-tight font-display mb-1">Análise de Freebets</h4>
            <p className="text-xs text-slate-400 mb-4">Estatísticas de desempenho das apostas com freebet</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total de Freebets Registadas:</span>
                <span className="font-semibold text-slate-800">{freebetStats.usageCount}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Investido (Freebet):</span>
                <span className="font-semibold text-slate-800">{freebetStats.totalStakeUsed.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Lucro Líquido Gerado:</span>
                <span className="font-bold text-emerald-600">
                  +{freebetStats.profit.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}{currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Taxa de Acerto (Freebets):</span>
                <span className="font-semibold text-slate-800">{safeNum(freebetStats.winRate).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Resolvidas / Total:</span>
              <span>{freebetStats.resolvedCount} de {freebetStats.usageCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
        <div className="bg-white rounded-sm p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-insights">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded mt-0.5 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Operador Mais Rentável</p>
              <p className="text-xs text-slate-400 mt-0.5">Onde fazes mais dinheiro</p>
              {insights.bestBkm && insights.bestBkm.lucro > 0 ? (
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {insights.bestBkm.name} <span className="text-xs font-normal text-slate-500">({insights.bestBkm.lucro > 0 ? "+" : ""}{safeNum(insights.bestBkm.lucro).toFixed(2)}{currency})</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-500 mt-1">Sem dados suficientes</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded mt-0.5 shrink-0">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Odd Média das Apostas Ganhas</p>
              <p className="text-xs text-slate-400 mt-0.5">Nível médio de risco vitorioso</p>
              <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                {insights.averageWonOdd > 1 ? safeNum(insights.averageWonOdd).toFixed(2) : "1.00"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded mt-0.5 shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Maior Lucro Individual</p>
              <p className="text-xs text-slate-400 mt-0.5">O teu boletim de maior success</p>
              {insights.highestWin ? (
                <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-[200px]">
                  +{safeNum(insights.highestWin.netProfit).toFixed(2)}{currency} 
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    ({insights.highestWin.selections && insights.highestWin.selections[0]?.event || "Múltipla"})
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-500 mt-1">Nenhum prémio ganho.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

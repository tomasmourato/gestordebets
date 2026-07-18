// Aba "AI Insights": dicas de picks para os jogos de hoje, geradas pelo
// Gemini com pesquisa Google (jogos/odds reais) e cacheadas por dia no
// servidor. Inclui aviso claro: é conteúdo gerado por IA, sem garantias.

import React, { useEffect, useState } from "react";
import {
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { authFetch, parseJsonResponse, SessionExpiredError } from "../lib/authApi";

interface Pick {
  sport: string;
  competition: string;
  match: string;
  kickoffLisbon: string;
  market: string;
  selection: string;
  approxOdd: number | null;
  confidence: number;
  rationale: string;
}

interface InsightsResponse {
  date: string;
  generatedAt: string;
  summary: string;
  picks: Pick[];
}

interface AIInsightsProps {
  onSessionExpired: () => void;
}

function ConfidenceDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Confiança ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
          }`}
        ></span>
      ))}
    </span>
  );
}

export default function AIInsights({ onSessionExpired }: AIInsightsProps) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/insights");
      const body = await parseJsonResponse(res);
      if (!res.ok) throw new Error(body.error || "Não foi possível obter as dicas de hoje.");
      setData(body as InsightsResponse);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agrupa por desporto mantendo a ordem de chegada.
  const groups = new Map<string, Pick[]>();
  for (const pick of data?.picks ?? []) {
    const list = groups.get(pick.sport) || [];
    list.push(pick);
    groups.set(pick.sport, list);
  }

  const formattedDate = data?.date
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "full" }).format(new Date(`${data.date}T12:00:00`))
    : "";
  const generatedTime = data?.generatedAt
    ? new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(data.generatedAt))
    : "";

  return (
    <div className="space-y-5" id="insights-tab">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" /> AI Insights
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {formattedDate ? `Dicas para ${formattedDate}` : "Dicas de picks para os jogos de hoje"}
            {generatedTime && ` · geradas às ${generatedTime}`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* Aviso: conteúdo gerado por IA + jogo responsável */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-sm flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
        <ShieldAlert size={15} className="shrink-0 mt-0.5" />
        <span>
          Sugestões geradas automaticamente por IA com pesquisa web — podem conter erros em
          jogos, horários ou odds, e <strong>não garantem qualquer resultado</strong>. Nada
          disto é aconselhamento financeiro. Aposta apenas o que podes perder. +18 · jogo
          responsável.
        </span>
      </div>

      {/* Estados */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            A analisar os jogos de hoje…
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Na primeira visita do dia a análise é gerada na hora — pode demorar até um minuto.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={20} className="text-rose-500" />
          <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>
          <button
            onClick={load}
            className="px-3.5 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Resumo do dia */}
          {data.summary && (
            <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-3">
              <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Picks por desporto */}
          {[...groups.entries()].map(([sport, picks]) => (
            <div key={sport}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                {sport}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {picks.map((pick, i) => (
                  <div
                    key={`${pick.match}-${i}`}
                    className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {pick.match}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          {pick.competition}
                          {pick.kickoffLisbon && (
                            <>
                              <span>·</span>
                              <Clock size={10} /> {pick.kickoffLisbon}
                            </>
                          )}
                        </p>
                      </div>
                      {pick.approxOdd !== null && (
                        <span className="shrink-0 text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 px-2 py-1 rounded-sm">
                          @{pick.approxOdd.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-sm">
                        {pick.market}: <span className="text-indigo-600 dark:text-indigo-300">{pick.selection}</span>
                      </span>
                      <ConfidenceDots level={pick.confidence} />
                    </div>

                    {pick.rationale && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {pick.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pb-2">
            As odds são aproximadas no momento da geração e mudam ao longo do dia — confirma
            sempre na casa de apostas. Uma análise nova é gerada a cada dia.
          </p>
        </>
      )}
    </div>
  );
}

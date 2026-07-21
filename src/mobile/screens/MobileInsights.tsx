// src/mobile/screens/MobileInsights.tsx
// AI Insights mobile: as mesmas dicas diárias (/api/insights, cacheadas por
// dia no servidor) em cards touch-first, com pull-to-refresh e o mesmo aviso
// de conteúdo gerado por IA do desktop.

import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, AlertTriangle, Clock, Sparkles, ShieldAlert } from "lucide-react";
import { authFetch, parseJsonResponse, SessionExpiredError } from "../../lib/authApi";
import { SectionHeader, MobileCard, Pressable, PullToRefresh } from "../ui";

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

interface MobileInsightsProps {
  onSessionExpired: () => void;
}

function ConfidenceDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Confiança ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`}></span>
      ))}
    </span>
  );
}

export default function MobileInsights({ onSessionExpired }: MobileInsightsProps) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
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
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <PullToRefresh onRefresh={load}>
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" /> AI Insights
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {formattedDate ? `Dicas para ${formattedDate}` : "Dicas para os jogos de hoje"}
              {generatedTime && ` · ${generatedTime}`}
            </p>
          </div>
          <Pressable
            as="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            disabled={loading}
            aria-label="Atualizar dicas"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Pressable>
        </div>

        {/* Aviso IA + jogo responsável */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
          <ShieldAlert size={15} className="shrink-0 mt-0.5" />
          <span>
            Sugestões geradas por IA com pesquisa web — podem conter erros e <strong>não garantem qualquer resultado</strong>. Nada disto é aconselhamento financeiro. Aposta apenas o que podes perder. +18 · jogo responsável.
          </span>
        </div>

        {loading && (
          <MobileCard className="!p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">A analisar os jogos de hoje…</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Na primeira visita do dia a análise é gerada na hora — pode demorar até um minuto.
            </p>
          </MobileCard>
        )}

        {!loading && error && (
          <MobileCard className="!p-6 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={20} className="text-rose-500" />
            <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>
            <Pressable
              as="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              Tentar novamente
            </Pressable>
          </MobileCard>
        )}

        {!loading && !error && data && (
          <>
            {data.summary && (
              <MobileCard className="flex items-start gap-3">
                <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{data.summary}</p>
              </MobileCard>
            )}

            {[...groups.entries()].map(([sport, picks]) => (
              <div key={sport}>
                <SectionHeader>{sport}</SectionHeader>
                <div className="space-y-3">
                  {picks.map((pick, i) => (
                    <MobileCard key={`${pick.match}-${i}`} className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{pick.match}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
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
                          <span className="shrink-0 text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2 py-1 rounded-lg">
                            @{pick.approxOdd.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg">
                          {pick.market}: <span className="text-emerald-600 dark:text-emerald-300">{pick.selection}</span>
                        </span>
                        <ConfidenceDots level={pick.confidence} />
                      </div>

                      {pick.rationale && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{pick.rationale}</p>
                      )}
                    </MobileCard>
                  ))}
                </div>
              </div>
            ))}

            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center pb-2">
              As odds são aproximadas e mudam ao longo do dia — confirma sempre na casa de apostas.
            </p>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}

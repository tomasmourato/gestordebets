// Aba "AI Insights": duas secções —
//  1) Dicas de picks para os jogos de hoje (geradas pelo Gemini com pesquisa
//     Google e cacheadas por dia no servidor);
//  2) Avaliar aposta: o utilizador cola um print e/ou descreve a aposta e a IA
//     estima o Valor Esperado (EV), odd justa, edge e Kelly, com justificação.
// Ambas incluem o aviso: conteúdo gerado por IA, sem garantias.

import React, { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  Calculator,
  Image as ImageIcon,
  X,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Scale,
  ListChecks,
  ClipboardPaste,
} from "lucide-react";
import { authFetch, parseJsonResponse, SessionExpiredError } from "../lib/authApi";
import {
  requestBetEvaluation,
  verdictTone,
  formatEvPct,
  type BetEvaluationResponse,
  type EvaluatedBet,
} from "../lib/betEvaluation";

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

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function ConfidenceDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Confiança ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        ></span>
      ))}
    </span>
  );
}

// Classes por tom do veredito (positivo/neutro/negativo).
function toneClasses(bet: EvaluatedBet) {
  const tone = verdictTone(bet.verdict);
  if (tone === "positive")
    return {
      badge: "bg-emerald-600 text-white",
      soft: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
      Icon: TrendingUp,
    };
  if (tone === "negative")
    return {
      badge: "bg-rose-600 text-white",
      soft: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
      Icon: TrendingDown,
    };
  return {
    badge: "bg-zinc-600 text-white",
    soft: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700",
    Icon: Minus,
  };
}

const AI_DISCLAIMER =
  "Conteúdo gerado por IA com pesquisa web — a probabilidade e o Valor Esperado são estimativas, podem conter erros e não garantem qualquer resultado. Nada disto é aconselhamento financeiro. Aposta apenas o que podes perder. +18 · jogo responsável.";

export default function AIInsights({ onSessionExpired }: AIInsightsProps) {
  const [mode, setMode] = useState<"picks" | "evaluate">("picks");

  // ---- Dicas de hoje ----
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

  // ---- Avaliar aposta ----
  const [evalText, setEvalText] = useState("");
  const [evalImage, setEvalImage] = useState<string | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<BetEvaluationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEvalFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setEvalError("Seleciona um ficheiro de imagem (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setEvalError("A imagem excede 3MB. Recorta o print e tenta novamente.");
      return;
    }
    setEvalError(null);
    const reader = new FileReader();
    reader.onloadend = () => setEvalImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runEvaluation = async () => {
    if (!evalText.trim() && !evalImage) return;
    setEvalLoading(true);
    setEvalError(null);
    setEvaluation(null);
    try {
      const result = await requestBetEvaluation({
        imageBase64: evalImage ?? undefined,
        text: evalText.trim() || undefined,
      });
      setEvaluation(result);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired();
        return;
      }
      setEvalError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setEvalLoading(false);
    }
  };

  // Colar print com Ctrl+V (só no modo de avaliação). Só intercetamos quando a
  // área de transferência traz mesmo uma imagem — colar texto continua a ir
  // normalmente para a caixa de descrição.
  useEffect(() => {
    if (mode !== "evaluate") return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (!items[i].type.startsWith("image/")) continue;
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault();
          handleEvalFile(file);
        }
        return;
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Agrupa picks por desporto mantendo a ordem de chegada.
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-500" /> AI Insights
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {mode === "picks"
              ? formattedDate
                ? `Dicas para ${formattedDate}${generatedTime ? ` · geradas às ${generatedTime}` : ""}`
                : "Dicas de picks para os jogos de hoje"
              : "Cola um print e/ou descreve a aposta — a IA estima o Valor Esperado"}
          </p>
        </div>
        {mode === "picks" && (
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        )}
      </div>

      {/* Alternador de secção */}
      <div className="inline-flex rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 text-xs font-semibold">
        <button
          onClick={() => setMode("picks")}
          className={`px-3 py-1.5 rounded-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === "picks"
              ? "bg-emerald-600 text-white"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Sparkles size={13} /> Dicas de hoje
        </button>
        <button
          onClick={() => setMode("evaluate")}
          className={`px-3 py-1.5 rounded-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === "evaluate"
              ? "bg-emerald-600 text-white"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Calculator size={13} /> Avaliar aposta
        </button>
      </div>

      {/* Aviso: conteúdo gerado por IA + jogo responsável */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-sm flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
        <ShieldAlert size={15} className="shrink-0 mt-0.5" />
        <span>{AI_DISCLAIMER}</span>
      </div>

      {/* =============== MODO: DICAS DE HOJE =============== */}
      {mode === "picks" && (
        <>
          {loading && (
            <div className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">A analisar os jogos de hoje…</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Na primeira visita do dia a análise é gerada na hora — pode demorar até um minuto.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={20} className="text-rose-500" />
              <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>
              <button
                onClick={load}
                className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {data.summary && (
                <div className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-4 flex items-start gap-3">
                  <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{data.summary}</p>
                </div>
              )}

              {[...groups.entries()].map(([sport, picks]) => (
                <div key={sport}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                    {sport}
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {picks.map((pick, i) => (
                      <div
                        key={`${pick.match}-${i}`}
                        className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-4 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                              {pick.match}
                            </p>
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
                            <span className="shrink-0 text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2 py-1 rounded-sm">
                              @{pick.approxOdd.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-sm">
                            {pick.market}: <span className="text-emerald-600 dark:text-emerald-300">{pick.selection}</span>
                          </span>
                          <ConfidenceDots level={pick.confidence} />
                        </div>

                        {pick.rationale && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{pick.rationale}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center pb-2">
                As odds são aproximadas no momento da geração e mudam ao longo do dia — confirma sempre na casa de
                apostas. Uma análise nova é gerada a cada dia.
              </p>
            </>
          )}
        </>
      )}

      {/* =============== MODO: AVALIAR APOSTA =============== */}
      {mode === "evaluate" && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <textarea
              value={evalText}
              onChange={(e) => setEvalText(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Descreve a aposta: evento, mercado, seleção, odd e casa. Ex.: Benfica vencer o Porto @2.10 na Betano. (podes também colar um print do boletim com Ctrl+V)"
              className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:border-emerald-600 resize-y"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-emerald-300 dark:hover:border-emerald-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon size={13} /> {evalImage ? "Trocar print" : "Anexar print"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleEvalFile(file);
                  e.target.value = "";
                }}
              />
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1">
                <ClipboardPaste size={12} /> ou cola com <kbd className="px-1 py-0.5 rounded-sm border border-zinc-300 dark:border-zinc-600 font-mono text-[9px]">Ctrl+V</kbd>
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Máx. 3MB · PNG, JPG, WEBP</span>
              <button
                onClick={runEvaluation}
                disabled={evalLoading || (!evalText.trim() && !evalImage)}
                className="ml-auto px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {evalLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></div>
                    A avaliar…
                  </>
                ) : (
                  <>
                    <Send size={13} /> Avaliar aposta
                  </>
                )}
              </button>
            </div>

            {evalImage && (
              <div className="relative inline-block">
                <img
                  src={evalImage}
                  alt="Print da aposta"
                  className="max-h-40 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 object-contain"
                />
                <button
                  onClick={() => setEvalImage(null)}
                  aria-label="Remover imagem"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center border border-zinc-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {evalError && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{evalError}</p>}
          </div>

          {evalLoading && (
            <div className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                A pesquisar e a calcular o Valor Esperado…
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                A IA pesquisa forma, lesões e odds de mercado — pode demorar até um minuto.
              </p>
            </div>
          )}

          {!evalLoading && evaluation && (
            <div className="space-y-4">
              {evaluation.summary && (
                <div className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 p-4 flex items-start gap-3">
                  <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{evaluation.summary}</p>
                </div>
              )}

              {evaluation.bets.map((bet, i) => {
                const tc = toneClasses(bet);
                const halfKellyPct = bet.kellyFraction > 0 ? (bet.kellyFraction * 50).toFixed(1) : null;
                return (
                  <div
                    key={i}
                    className="bg-white dark:bg-zinc-900 rounded-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                  >
                    {/* Cabeçalho + EV */}
                    <div className="p-4 flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{bet.event}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {[bet.competition, bet.bookmaker].filter(Boolean).join(" · ")}
                          {bet.type === "MULTIPLA" && " · Múltipla"}
                        </p>
                        <p className="text-xs mt-1.5">
                          <span className="text-zinc-500 dark:text-zinc-400">{bet.market}: </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-300">{bet.selection}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-sm font-bold font-mono ${tc.badge}`}
                        >
                          <tc.Icon size={14} /> {formatEvPct(bet.expectedValuePct)}
                        </span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1">
                          Valor Esperado
                        </p>
                      </div>
                    </div>

                    {/* Veredito */}
                    <div className={`px-4 py-2 border-b text-[11px] font-semibold ${tc.soft}`}>
                      {bet.verdictLabel} — EV {formatEvPct(bet.expectedValuePct)} por unidade apostada
                    </div>

                    {/* Métricas */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                      <Metric label="Odd oferecida" value={bet.offeredOdd.toFixed(2)} icon={Target} />
                      <Metric label="Odd justa" value={bet.fairOdd.toFixed(2)} icon={Scale} />
                      <Metric label="Edge" value={`${bet.edgePct >= 0 ? "+" : ""}${bet.edgePct.toFixed(1)}%`} />
                      <Metric label="Prob. estimada" value={`${(bet.estimatedProbability * 100).toFixed(1)}%`} />
                      <Metric label="Prob. mercado" value={`${(bet.impliedProbability * 100).toFixed(1)}%`} />
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Confiança
                        </p>
                        <div className="mt-1.5 flex justify-center">
                          <ConfidenceDots level={bet.confidence} />
                        </div>
                      </div>
                    </div>

                    {halfKellyPct && (
                      <div className="px-4 pb-3 -mt-1">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Stake sugerida (½ Kelly):{" "}
                          <strong className="font-mono text-zinc-800 dark:text-zinc-100">{halfKellyPct}%</strong> do teu
                          banco. Kelly é agressivo — usa fração e nunca apostes mais do que podes perder.
                        </p>
                      </div>
                    )}

                    {/* Justificação + fatores + riscos */}
                    <div className="px-4 pb-4 space-y-3">
                      {bet.justification && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{bet.justification}</p>
                      )}

                      {bet.keyFactors.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
                            <ListChecks size={12} /> Fatores-chave
                          </p>
                          <ul className="space-y-1">
                            {bet.keyFactors.map((f, j) => (
                              <li key={j} className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-1 shrink-0">•</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {bet.risks.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
                            <AlertTriangle size={12} /> Riscos
                          </p>
                          <ul className="space-y-1">
                            {bet.risks.map((r, j) => (
                              <li key={j} className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                                <span className="text-amber-500 mt-1 shrink-0">•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {bet.legs && bet.legs.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                            Pernas da múltipla
                          </p>
                          <div className="space-y-1">
                            {bet.legs.map((leg, j) => (
                              <div
                                key={j}
                                className="flex items-center justify-between gap-2 text-[11px] bg-zinc-50 dark:bg-zinc-800/50 rounded-sm px-2.5 py-1.5"
                              >
                                <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-200">
                                  {leg.event} — <span className="text-emerald-600 dark:text-emerald-300">{leg.selection}</span>
                                </span>
                                <span className="shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
                                  {(leg.estimatedProbability * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </p>
      <p className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">{value}</p>
    </div>
  );
}

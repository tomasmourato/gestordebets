// src/lib/betEvaluation.ts
// Contrato partilhado entre a UI desktop (AIInsights) e a mobile
// (MobileInsights) para a avaliação de apostas por IA. O servidor
// (routes/insightsRoutes.ts, POST /api/insights/evaluate) faz a pesquisa e a
// estimativa de probabilidade e calcula os números (EV, edge, Kelly…); aqui
// só se descrevem os tipos e se faz o pedido.

import { authFetch, parseJsonResponse } from "./authApi";

export interface EvaluatedLeg {
  event: string;
  selection: string;
  estimatedProbability: number; // 0-1
}

export type BetVerdict = "VALOR" | "JUSTA" | "SEM_VALOR";

export interface EvaluatedBet {
  type: "SIMPLES" | "MULTIPLA";
  sport: string;
  competition: string;
  event: string;
  market: string;
  selection: string;
  bookmaker: string;
  offeredOdd: number;
  estimatedProbability: number; // 0-1, probabilidade justa estimada
  impliedProbability: number; // 0-1, 1/odd (com margem da casa)
  fairOdd: number; // 1/estimatedProbability
  expectedValue: number; // lucro médio por 1 unidade apostada
  expectedValuePct: number; // expectedValue * 100
  edgePct: number; // (estimated - implied) * 100
  kellyFraction: number; // fração do banco (Kelly completo), 0 se -EV
  verdict: BetVerdict;
  verdictLabel: string;
  confidence: number; // 1-5
  justification: string;
  keyFactors: string[];
  risks: string[];
  legs?: EvaluatedLeg[];
}

export interface BetEvaluationResponse {
  evaluatedAt: string;
  summary: string;
  bets: EvaluatedBet[];
}

/** Tom semântico do veredito, para cada shell mapear às suas cores. */
export function verdictTone(verdict: BetVerdict): "positive" | "neutral" | "negative" {
  if (verdict === "VALOR") return "positive";
  if (verdict === "SEM_VALOR") return "negative";
  return "neutral";
}

/** EV formatado com sinal, ex.: "+7.1%" / "-4.3%". */
export function formatEvPct(pct: number): string {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

/**
 * Pede a avaliação ao servidor. Lança SessionExpiredError (via authFetch) num
 * 401 — cada shell trata-o com o seu onSessionExpired.
 */
export async function requestBetEvaluation(payload: {
  imageBase64?: string;
  text?: string;
}): Promise<BetEvaluationResponse> {
  const res = await authFetch("/api/insights/evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(body.error || "Não foi possível avaliar a aposta.");
  return body as BetEvaluationResponse;
}

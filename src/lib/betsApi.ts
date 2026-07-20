// src/lib/betsApi.ts
// Camada de API para as apostas (bets). O PostgreSQL é a única fonte de
// verdade — estas funções falam com as rotas /api/bets protegidas por JWT
// e traduzem entre o formato snake_case da BD e o modelo Bet do frontend.

import { authFetch, parseJsonResponse } from "./authApi";
import { Bet, BetStatus, BetType, FreebetType, Selection, SelectionResult } from "../types";
import { safeNum } from "../utils";
import { normalizeBetStatus, parseBetMetadata } from "./betStatus";

// Linha crua devolvida pela API (colunas em snake_case).
type ApiBetRow = Record<string, any>;

const VALID_ORIGINS = ["MANUAL", "SCREENSHOT", "CSV"];
const VALID_FREEBET_TYPES: FreebetType[] = ["SNR", "SR"];
const VALID_SELECTION_RESULTS: SelectionResult[] = [
  "POR_LIQUIDAR",
  "GANHA",
  "PERDIDA",
  "ANULADA",
  "MEIO_GANHA",
  "MEIO_PERDIDA",
];

// ------------------------------------------------------------
// Normaliza as seleções vindas da BD (array, string JSON ou null)
// para um Selection[] garantindo que cada seleção tem um id.
// ------------------------------------------------------------
function normalizeSelections(raw: any, rowId: string): Selection[] {
  let arr: any = raw;

  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  }

  if (!Array.isArray(arr)) return [];

  return arr.map((s: any, idx: number): Selection => ({
    id: s?.id ?? `sel-${rowId}-${idx}`,
    event: s?.event ?? "",
    market: s?.market ?? "",
    choice: s?.choice ?? "",
    odd: safeNum(s?.odd),
    sport: s?.sport,
    betType: s?.betType,
    result: VALID_SELECTION_RESULTS.includes(s?.result) ? s.result : undefined,
  }));
}

// ------------------------------------------------------------
// mapBetFromApi: linha snake_case da BD -> modelo Bet (camelCase).
// ------------------------------------------------------------
export function mapBetFromApi(row: ApiBetRow): Bet {
  const metadata = parseBetMetadata(row.metadata);
  // A metadata de imports antigos permite recuperar cashouts que chegaram a
  // ser guardados como meio-ganha/meio-perdida antes do estado dedicado.
  const status = normalizeBetStatus(row.status, metadata);

  // Tipo: valida contra SIMPLES/MULTIPLA.
  let type = row.type as BetType;
  if (type !== "SIMPLES" && type !== "MULTIPLA") type = "SIMPLES";

  // Origem: valida contra MANUAL/SCREENSHOT/CSV.
  let origin = row.origin as Bet["origin"];
  if (!VALID_ORIGINS.includes(origin as string)) origin = "MANUAL";

  return {
    id: String(row.id),
    type,
    status,
    selections: normalizeSelections(row.selections, String(row.id)),
    stake: safeNum(row.stake),
    odd: safeNum(row.odd),
    isFreebet: row.is_freebet === true,
    freebetType: VALID_FREEBET_TYPES.includes(row.freebet_type)
      ? (row.freebet_type as FreebetType)
      : undefined,
    potentialReturn: safeNum(row.potential_return),
    finalReturn: safeNum(row.final_return),
    netProfit: safeNum(row.net_profit),
    bookmaker: row.bookmaker ?? "",
    dateTime: row.date_time ?? "",
    notes: row.notes ?? undefined,
    origin,
    comment: row.comment ?? undefined,
    tags: row.tags ?? undefined,
    metadata,
  };
}

// ------------------------------------------------------------
// mapBetToApi: modelo Bet -> corpo JSON (camelCase) que o backend espera.
// Sem id: o servidor gera-o na criação; na atualização o id vai no URL.
// ------------------------------------------------------------
export function mapBetToApi(bet: Bet) {
  return {
    type: bet.type,
    status: bet.status,
    stake: bet.stake,
    odd: bet.odd,
    isFreebet: bet.isFreebet,
    freebetType: bet.freebetType,
    potentialReturn: bet.potentialReturn,
    finalReturn: bet.finalReturn,
    netProfit: bet.netProfit,
    bookmaker: bet.bookmaker,
    dateTime: bet.dateTime,
    notes: bet.notes,
    origin: bet.origin,
    selections: bet.selections,
    comment: bet.comment,
    tags: bet.tags,
    metadata: bet.metadata,
  };
}

// ------------------------------------------------------------
// GET /api/bets -> lista todas as apostas do utilizador.
// ------------------------------------------------------------
export async function fetchBets(): Promise<Bet[]> {
  const res = await authFetch("/api/bets");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter as apostas.");
  return (data.bets as ApiBetRow[]).map(mapBetFromApi);
}

// ------------------------------------------------------------
// POST /api/bets -> cria uma aposta e devolve-a já mapeada.
// ------------------------------------------------------------
export async function createBet(bet: Bet): Promise<Bet> {
  const res = await authFetch("/api/bets", {
    method: "POST",
    body: JSON.stringify(mapBetToApi(bet)),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao criar a aposta.");
  return mapBetFromApi(data.bet);
}

// ------------------------------------------------------------
// POST /api/bets/bulk -> cria várias apostas numa só transação.
// ------------------------------------------------------------
export async function createBets(bets: Bet[]): Promise<Bet[]> {
  const res = await authFetch("/api/bets/bulk", {
    method: "POST",
    body: JSON.stringify({ bets: bets.map(mapBetToApi) }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao importar as apostas.");
  return (data.bets as ApiBetRow[]).map(mapBetFromApi);
}

// ------------------------------------------------------------
// PUT /api/bets/:id -> atualiza uma aposta e devolve-a já mapeada.
// ------------------------------------------------------------
export async function updateBet(bet: Bet): Promise<Bet> {
  const res = await authFetch(`/api/bets/${bet.id}`, {
    method: "PUT",
    body: JSON.stringify(mapBetToApi(bet)),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao atualizar a aposta.");
  return mapBetFromApi(data.bet);
}

// ------------------------------------------------------------
// DELETE /api/bets/:id -> apaga uma aposta.
// ------------------------------------------------------------
export async function deleteBet(id: string): Promise<void> {
  const res = await authFetch(`/api/bets/${id}`, { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao apagar a aposta.");
}

// ------------------------------------------------------------
// DELETE /api/bets -> apaga todas as apostas do utilizador.
// ------------------------------------------------------------
export async function deleteAllBets(): Promise<void> {
  const res = await authFetch("/api/bets", { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao apagar as apostas.");
}

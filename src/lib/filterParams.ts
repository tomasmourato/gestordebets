// Leitura/escrita dos filtros no query string. É o contrato partilhado entre o
// Dashboard, o histórico de apostas e o drill-down entre os dois: os mesmos
// nomes de parâmetros em todo o lado, para um URL colado noutro separador
// reproduzir exatamente a mesma vista.
//
// A pesquisa por texto do histórico entra aqui apenas quando é confirmada
// (Enter/desfocar); a UI mantém o rascunho local enquanto o utilizador escreve.

import {
  EMPTY_TIMEFRAME_FILTER,
  isTimeframe,
  type TimeframeFilterValue,
} from "../components/TimeframeFilter";

export interface BetFilters {
  // "ALL" | estado da aposta. Só o histórico usa; no dashboard fica sempre "ALL".
  status: string;
  bookmaker: string;
  // "ALL" | "NONE" (apostas sem conta) | id de uma conta
  account: string;
  sport: string;
  type: string;
  money: string;
  search: string;
  timeframe: TimeframeFilterValue;
}

export const EMPTY_BET_FILTERS: BetFilters = {
  status: "ALL",
  bookmaker: "ALL",
  account: "ALL",
  sport: "ALL",
  type: "ALL",
  money: "ALL",
  search: "",
  timeframe: EMPTY_TIMEFRAME_FILTER,
};

/** Lê os filtros de um query string. Valores em falta caem no equivalente a "sem filtro". */
export function readFilters(params: URLSearchParams): BetFilters {
  const single = (name: string) => params.get(name) || "ALL";

  const startDate = params.get("dateFrom") || "";
  const endDate = params.get("dateTo") || "";
  const requestedTimeframe = params.get("timeframe");

  return {
    status: single("status"),
    bookmaker: single("bookmaker"),
    account: single("account"),
    sport: single("sport"),
    type: single("type"),
    money: single("money"),
    search: params.get("search") || "",
    timeframe: {
      // Um intervalo explícito sem `timeframe` (ex.: drill-down antigo) conta
      // como período personalizado.
      timeframe: isTimeframe(requestedTimeframe)
        ? requestedTimeframe
        : (startDate || endDate ? "CUSTOM" : "ALL"),
      startDate,
      endDate,
    },
  };
}

/**
 * Serializa os filtros ativos. Devolve "" (sem "?") quando nada está filtrado,
 * para o URL de uma vista limpa ser apenas "/dashboard" ou "/bets".
 */
export function serializeFilters(filters: BetFilters): string {
  const params = new URLSearchParams();
  const set = (name: string, value: string) => {
    if (value && value !== "ALL") params.set(name, value);
  };

  set("status", filters.status);
  set("bookmaker", filters.bookmaker);
  set("account", filters.account);
  set("sport", filters.sport);
  set("type", filters.type);
  set("money", filters.money);
  set("search", filters.search.trim());
  set("timeframe", filters.timeframe.timeframe);

  // As datas só descrevem o filtro quando o período é personalizado; nos
  // períodos relativos ("últimos 7 dias") são derivadas e mudavam todos os dias.
  if (filters.timeframe.timeframe === "CUSTOM") {
    if (filters.timeframe.startDate) params.set("dateFrom", filters.timeframe.startDate);
    if (filters.timeframe.endDate) params.set("dateTo", filters.timeframe.endDate);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

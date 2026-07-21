// Lista única de colunas devolvidas ao frontend para uma aposta. Partilhada
// pela rota REST (GET /api/bets) e pelo SSR (server.ts), para os dois payloads
// nunca divergirem — divergirem já escondeu is_risk_free/account_id no SSR e
// partiu os filtros "Sem risco" e de conta nas páginas renderizadas no servidor.
//
// Convertemos DECIMAL -> float8 (senão o driver pg devolve strings) e
// formatamos a data para "YYYY-MM-DD HH:mm", o formato que o modelo Bet do
// frontend (mapBetFromApi) espera. Qualquer coluna aqui tem de ser lida por
// mapBetFromApi em src/lib/betsApi.ts.
export const BET_SELECT_COLUMNS = `
  id, type, status,
  stake::float8 AS stake, odd::float8 AS odd,
  is_freebet, freebet_type, is_risk_free, is_ignored,
  potential_return::float8 AS potential_return,
  final_return::float8 AS final_return,
  net_profit::float8 AS net_profit,
  bookmaker, account_id,
  to_char(date_time, 'YYYY-MM-DD HH24:MI') AS date_time,
  notes, origin, selections, comment, tags, metadata, created_at
`;

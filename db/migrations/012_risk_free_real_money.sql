-- ============================================================
-- Migração 012: aposta sem risco passa a contar dinheiro REAL
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Até aqui uma aposta sem risco perdida era neutra (final_return = stake,
-- net_profit = 0), assumindo que a stake voltava como freebet. O novo modelo
-- trata a stake como dinheiro real: uma derrota perde a stake, tal como uma
-- aposta normal (a freebet de reembolso é registada à parte). Só as linhas
-- PERDIDA e MEIO_PERDIDA sem risco tinham valores desatualizados — GANHA,
-- ANULADA e MEIO_GANHA já coincidiam com o cálculo de aposta normal.
--
-- PERDIDA:      final_return = 0,          net_profit = -stake
-- MEIO_PERDIDA: final_return = stake / 2,  net_profit = -stake / 2
-- ============================================================

UPDATE bets
SET final_return = 0,
    net_profit = ROUND(-stake, 2),
    updated_at = TIMEZONE('utc', NOW())
WHERE is_risk_free = TRUE
  AND status = 'PERDIDA'
  AND (final_return IS DISTINCT FROM 0
       OR net_profit IS DISTINCT FROM ROUND(-stake, 2));

UPDATE bets
SET final_return = ROUND(stake / 2, 2),
    net_profit = ROUND(-stake / 2, 2),
    updated_at = TIMEZONE('utc', NOW())
WHERE is_risk_free = TRUE
  AND status = 'MEIO_PERDIDA'
  AND (final_return IS DISTINCT FROM ROUND(stake / 2, 2)
       OR net_profit IS DISTINCT FROM ROUND(-stake / 2, 2));

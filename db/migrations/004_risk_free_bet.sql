-- ============================================================
-- Migração 004: aposta sem risco (risk-free bet)
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Adiciona a coluna is_risk_free. Uma aposta sem risco usa stake REAL (conta
-- para o stake total e uma vitória paga como uma aposta normal), mas uma
-- derrota total devolve a stake — tipicamente como freebet, registada à parte —
-- por isso o resultado desta aposta é neutro (net 0), como uma anulada.
--
-- É um modo mutuamente exclusivo com is_freebet: uma aposta sem risco NÃO é uma
-- freebet (o dinheiro apostado é real). A app garante a exclusividade; aqui
-- normalizamos eventuais linhas existentes por segurança.
-- ============================================================

ALTER TABLE bets ADD COLUMN IF NOT EXISTS is_risk_free BOOLEAN NOT NULL DEFAULT FALSE;

-- Exclusividade defensiva: se ambos estiverem a TRUE, "sem risco" prevalece
-- (o stake é real), por isso limpamos a flag de freebet nesses casos.
UPDATE bets SET is_freebet = FALSE WHERE is_risk_free = TRUE AND is_freebet = TRUE;

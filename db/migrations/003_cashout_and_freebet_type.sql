-- ============================================================
-- Migração 003: estado CASHOUT + tipo de freebet
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- (1) Reintroduz o estado 'CASHOUT' na constraint de status. A migração 002
--     tinha-o removido (era um valor legado); agora passa a ser um estado de
--     liquidação de primeira classe, cujo retorno fica na coluna final_return
--     já existente (não é preciso coluna nova para o valor do cashout).
--
-- (2) Adiciona a coluna freebet_type (SNR | SR). Ao contrário do cashout, o
--     TIPO de freebet não é recuperável a partir dos números guardados (numa
--     freebet pendente ou perdida o net_profit é 0 em ambos os tipos), por
--     isso tem de ser persistido.
--       - SNR = Stake Not Returned: ganho = (odd-1) * stake
--       - SR  = Stake Returned:     ganho = odd * stake  (comportamento atual)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Permitir o estado CASHOUT.
-- ------------------------------------------------------------
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_status_check;
ALTER TABLE bets ADD CONSTRAINT bets_status_check CHECK (
  status IN ('POR_LIQUIDAR', 'GANHA', 'PERDIDA', 'ANULADA', 'MEIO_GANHA', 'MEIO_PERDIDA', 'CASHOUT')
);

-- ------------------------------------------------------------
-- 2. Coluna freebet_type.
-- ------------------------------------------------------------
ALTER TABLE bets ADD COLUMN IF NOT EXISTS freebet_type TEXT;

-- Preenche as freebets existentes com 'SR' — preserva os números já gravados,
-- que foram calculados com a regra SR (net_profit = odd * stake). As apostas
-- novas recebem o tipo por omissão de cada casa através da app.
UPDATE bets SET freebet_type = 'SR' WHERE is_freebet = TRUE AND freebet_type IS NULL;

ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_freebet_type_check;
ALTER TABLE bets ADD CONSTRAINT bets_freebet_type_check CHECK (
  freebet_type IS NULL OR freebet_type IN ('SNR', 'SR')
);

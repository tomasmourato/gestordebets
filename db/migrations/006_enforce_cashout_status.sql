-- ============================================================
-- Migração 006: cashout é sempre guardado com status CASHOUT
--
-- (Renumerada de 004 -> 006: o 004 foi atribuído a outra feature — aposta sem
-- risco — no mesmo período; 006 mantém a sequência sem colisões.)
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
-- Corrige imports feitos antes do estado dedicado e protege a invariável na BD.
-- ============================================================

UPDATE bets
SET status = 'CASHOUT',
    updated_at = timezone('utc', now())
WHERE metadata IS NOT NULL
  AND (
    LOWER(COALESCE(metadata->>'isCashout', 'false')) = 'true'
    OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'originalStatus', '')), '[^a-z]', '', 'g')
      IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
    OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'betclicResult', '')), '[^a-z]', '', 'g')
      IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
    OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'settlementStatus', '')), '[^a-z]', '', 'g')
      IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
  )
  AND status <> 'CASHOUT';

ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_cashout_metadata_status_check;
ALTER TABLE bets ADD CONSTRAINT bets_cashout_metadata_status_check CHECK (
  status = 'CASHOUT'
  OR metadata IS NULL
  OR NOT (
    LOWER(COALESCE(metadata->>'isCashout', 'false')) = 'true'
    OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'originalStatus', '')), '[^a-z]', '', 'g')
      IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
    OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'betclicResult', '')), '[^a-z]', '', 'g')
      IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
    OR REGEXP_REPLACE(LOWER(COALESCE(metadata->>'settlementStatus', '')), '[^a-z]', '', 'g')
      IN ('cashout', 'cashedout', 'fullcashout', 'partialcashout')
  )
);

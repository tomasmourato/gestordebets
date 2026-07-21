-- ============================================================
-- Migração 002: alinhar a constraint de `status` com a aplicação
--
-- A tabela original tinha CHECK (status IN ('PENDENTE','GANHA','PERDIDA',
-- 'CASHOUT','ANULADA')). A aplicação usa POR_LIQUIDAR, MEIO_GANHA e
-- MEIO_PERDIDA, pelo que qualquer aposta não liquidada era rejeitada
-- (erro 23514) — era isto que fazia falhar a importação de CSV e os
-- dados de demonstração.
--
-- Esta migração é IDEMPOTENTE — pode ser executada várias vezes.
-- ============================================================

-- 1. Migra estados legados para o vocabulário atual.
UPDATE bets SET status = 'POR_LIQUIDAR' WHERE status = 'PENDENTE';
-- NOTA: originalmente esta migração convertia CASHOUT -> ANULADA, porque na
-- altura CASHOUT não era um estado válido. A migração 006 reintroduziu CASHOUT
-- como estado próprio, por isso a conversão foi removida: reexecutar o 002 numa
-- BD já com o 006 aplicado violaria bets_cashout_metadata_status_check.

-- 2. `status`/`type` eram VARCHAR com limite; TEXT remove o risco de
--    truncar valores mais longos como MEIO_PERDIDA.
ALTER TABLE bets ALTER COLUMN status TYPE TEXT;
ALTER TABLE bets ALTER COLUMN type TYPE TEXT;

-- 3. Substitui a constraint antiga pela lista atual de estados.
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_status_check;
ALTER TABLE bets ADD CONSTRAINT bets_status_check CHECK (
  status IN ('POR_LIQUIDAR', 'GANHA', 'PERDIDA', 'ANULADA', 'MEIO_GANHA', 'MEIO_PERDIDA', 'CASHOUT')
);

-- 4. O default antigo ('PENDENTE') violaria a nova constraint.
ALTER TABLE bets ALTER COLUMN status SET DEFAULT 'POR_LIQUIDAR';

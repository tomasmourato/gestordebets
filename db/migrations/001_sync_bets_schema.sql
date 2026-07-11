-- ============================================================
-- Migração 001: sincronizar o schema da tabela `bets` (e `users`)
--
-- Esta migração é IDEMPOTENTE — pode ser executada várias vezes em
-- segurança. Cola-a no editor SQL do Supabase para alinhar uma base de
-- dados existente com o que o código do backend espera.
--
-- Instalações novas devem usar db/schema.sql em vez desta migração.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Renomear colunas de versões antigas do backend, se existirem.
--    Uma versão anterior usava `bet_type` e `event_date` em vez de
--    `type` e `date_time`. Só renomeamos se a coluna antiga existir
--    e a nova ainda não.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bets' AND column_name = 'bet_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bets' AND column_name = 'type'
  ) THEN
    ALTER TABLE bets RENAME COLUMN bet_type TO type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bets' AND column_name = 'event_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bets' AND column_name = 'date_time'
  ) THEN
    ALTER TABLE bets RENAME COLUMN event_date TO date_time;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2. Garantir que todas as colunas necessárias existem na tabela bets.
-- ------------------------------------------------------------
ALTER TABLE bets ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS stake DECIMAL;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS odd DECIMAL;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS is_freebet BOOLEAN DEFAULT FALSE;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS potential_return DECIMAL;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS final_return DECIMAL;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS net_profit DECIMAL;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS bookmaker TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS date_time TIMESTAMP;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS selections JSONB;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- ------------------------------------------------------------
-- 3. Coluna `username` na tabela users (existente na BD em produção).
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);

-- ------------------------------------------------------------
-- 4. Índice para acelerar as consultas por utilizador.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);

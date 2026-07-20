-- ============================================================
-- Migração 007: múltiplas contas por casa de apostas
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Cada utilizador pode registar várias contas na mesma casa (ex.: duas contas
-- Betclic). Uma aposta pode (opcionalmente) pertencer a uma conta; apostas
-- antigas ficam com account_id NULL ("sem conta"). Apagar uma conta NÃO apaga
-- as apostas — ficam órfãs (SET NULL), continuando associadas à casa.
-- ============================================================

CREATE TABLE IF NOT EXISTS bookie_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT bookie_accounts_label_not_blank CHECK (LENGTH(TRIM(label)) > 0),
  CONSTRAINT bookie_accounts_bookmaker_not_blank CHECK (LENGTH(TRIM(bookmaker)) > 0),
  -- O mesmo nome de conta não pode repetir-se dentro da mesma casa.
  CONSTRAINT bookie_accounts_unique_label UNIQUE (user_id, bookmaker, label)
);

CREATE INDEX IF NOT EXISTS bookie_accounts_user_idx ON bookie_accounts (user_id, bookmaker);

ALTER TABLE bets ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES bookie_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bets_account_id ON bets (account_id);

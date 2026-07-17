-- ============================================================
-- Schema canónico da base de dados (PostgreSQL / Supabase)
--
-- Instalações NOVAS executam este ficheiro por completo.
-- Bases de dados EXISTENTES executam as migrações em db/migrations/ por ordem
-- (001, 002, 003, ...) para ajustar apenas o que falta, sem perder dados.
-- ============================================================

-- ------------------------------------------------------------
-- Utilizadores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------
-- Recuperação de password — tokens de uso único (hash SHA-256, expiram
-- em 1 hora). Ver migração 008.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------
-- Contas por casa de apostas — um utilizador pode ter várias contas na
-- mesma casa (ex.: duas contas Betclic). Ver migração 007.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookie_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT bookie_accounts_label_not_blank CHECK (LENGTH(TRIM(label)) > 0),
  CONSTRAINT bookie_accounts_bookmaker_not_blank CHECK (LENGTH(TRIM(bookmaker)) > 0),
  CONSTRAINT bookie_accounts_unique_label UNIQUE (user_id, bookmaker, label)
);

-- ------------------------------------------------------------
-- Apostas (bets) — PostgreSQL é a única fonte de verdade.
--
-- Notas de modelação:
--  * status inclui CASHOUT; o valor do cashout usa a coluna final_return.
--  * freebet_type (SNR|SR) tem de ser persistido porque o tipo não é
--    recuperável a partir dos números numa freebet pendente/perdida.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CONSTRAINT bets_bet_type_check CHECK (type IN ('SIMPLES', 'MULTIPLA')),
  status TEXT NOT NULL DEFAULT 'POR_LIQUIDAR'
    CONSTRAINT bets_status_check CHECK (
      status IN ('POR_LIQUIDAR', 'GANHA', 'PERDIDA', 'ANULADA', 'MEIO_GANHA', 'MEIO_PERDIDA', 'CASHOUT')
    ),
  stake DECIMAL NOT NULL,
  odd DECIMAL NOT NULL,
  is_freebet BOOLEAN DEFAULT FALSE,
  freebet_type TEXT
    CONSTRAINT bets_freebet_type_check CHECK (freebet_type IS NULL OR freebet_type IN ('SNR', 'SR')),
  -- Aposta sem risco: stake real, mas derrota total devolve a stake (net 0).
  is_risk_free BOOLEAN NOT NULL DEFAULT FALSE,
  potential_return DECIMAL,
  final_return DECIMAL,
  net_profit DECIMAL,
  bookmaker TEXT,
  -- Conta da casa a que a aposta pertence (opcional; NULL = "sem conta").
  account_id UUID REFERENCES bookie_accounts(id) ON DELETE SET NULL,
  date_time TIMESTAMP,
  notes TEXT,
  origin TEXT,
  selections JSONB,
  comment TEXT,
  tags TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT bets_cashout_metadata_status_check CHECK (
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
  )
);

-- ------------------------------------------------------------
-- Amizades (funcionalidade social) — pedidos e amizades aceites.
-- Linha dirigida requester_id -> addressee_id com status pending/accepted.
-- Ver db/migrations/005_social_friendships.sql para detalhes.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT friendships_status_check CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT friendships_not_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_account_id ON bets(account_id);
CREATE INDEX IF NOT EXISTS bookie_accounts_user_idx ON bookie_accounts (user_id, bookmaker);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships (requester_id, status);

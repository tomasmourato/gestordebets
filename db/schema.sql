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
  date_time TIMESTAMP,
  notes TEXT,
  origin TEXT,
  selections JSONB,
  comment TEXT,
  tags TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);

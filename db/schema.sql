-- ============================================================
-- Schema canónico da base de dados (PostgreSQL / Supabase)
--
-- Instalações NOVAS devem executar este ficheiro por completo.
-- Bases de dados EXISTENTES devem executar as migrações em db/migrations/
-- por ordem (001, 002, ...) para ajustar apenas o que falta, sem perder dados.
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
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CONSTRAINT bets_bet_type_check CHECK (type IN ('SIMPLES', 'MULTIPLA')),
  status TEXT NOT NULL DEFAULT 'POR_LIQUIDAR'
    CONSTRAINT bets_status_check CHECK (
      status IN ('POR_LIQUIDAR', 'GANHA', 'PERDIDA', 'ANULADA', 'MEIO_GANHA', 'MEIO_PERDIDA')
    ),
  stake DECIMAL NOT NULL,
  odd DECIMAL NOT NULL,
  is_freebet BOOLEAN DEFAULT FALSE,
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

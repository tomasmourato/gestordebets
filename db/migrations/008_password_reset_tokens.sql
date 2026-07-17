-- ============================================================
-- Migração 008: recuperação de password (tokens de reset)
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Cada pedido "esqueci-me da password" gera um token aleatório de uso único
-- enviado por email. Na BD guarda-se APENAS o hash SHA-256 do token — se a
-- BD vazar, os links de reset continuam inutilizáveis. Expira em 1 hora e
-- é marcado como usado ao primeiro reset com sucesso.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
  ON password_reset_tokens (user_id);

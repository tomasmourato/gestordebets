-- ============================================================
-- Migração 008: username da conta na casa de apostas
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Permite associar a cada bookie_account o username real usado na casa
-- (ex.: "pedroocoragem" na Betclic). A extensão deteta o username da sessão
-- ativa (ex.: GET /api/v2/me na Betclic) e encaminha as apostas importadas
-- para a conta correspondente automaticamente. Campo opcional; contas sem
-- username continuam a funcionar com a seleção manual no popup.
-- ============================================================

ALTER TABLE bookie_accounts ADD COLUMN IF NOT EXISTS username TEXT;

-- Um username não se repete dentro da mesma casa para o mesmo utilizador
-- (case-insensitive). NULL não conta para a unicidade (índice parcial).
CREATE UNIQUE INDEX IF NOT EXISTS bookie_accounts_username_key
  ON bookie_accounts (user_id, LOWER(bookmaker), LOWER(username))
  WHERE username IS NOT NULL;

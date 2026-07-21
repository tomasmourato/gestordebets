-- ============================================================
-- Migração 011: casas de apostas ativas por utilizador
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- O utilizador escolhe no site quais das casas suportadas (betclic, betano,
-- solverde) quer usar. A extensão lê esta lista e só mostra/importa dessas.
-- NULL = ainda não configurado -> a app trata como "todas as suportadas"
-- (comportamento retrocompatível). Um array vazio = nenhuma.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled_bookmakers TEXT[];

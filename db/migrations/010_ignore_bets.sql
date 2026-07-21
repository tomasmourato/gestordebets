-- ============================================================
-- Migração 010: ignorar apostas (excluir das estatísticas)
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Algumas apostas não devem contar para as estatísticas do utilizador — p.ex.
-- uma aposta feita para um amigo. Marcá-la como ignorada mantém-na visível no
-- histórico (assinalada) mas exclui-a de todos os totais/gráficos. O motivo
-- opcional reutiliza a coluna `comment` já existente.
-- ============================================================

ALTER TABLE bets ADD COLUMN IF NOT EXISTS is_ignored BOOLEAN NOT NULL DEFAULT FALSE;

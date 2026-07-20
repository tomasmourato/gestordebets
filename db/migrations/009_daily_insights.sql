-- ============================================================
-- Migração 009: cache diária dos AI Insights (dicas de picks)
--
-- (O número 008 fica reservado: pertence à migração de recuperação de
-- password, revertida mas recuperável do histórico do git.)
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- As dicas do dia são geradas UMA vez (Gemini + Google Search) e todos os
-- utilizadores leem a mesma linha — o UNIQUE em insight_date garante isso
-- mesmo com pedidos concorrentes (ON CONFLICT DO NOTHING na aplicação).
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_date DATE NOT NULL UNIQUE,
  content JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

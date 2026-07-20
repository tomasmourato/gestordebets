-- ============================================================
-- Migração 005: amizades (funcionalidade social)
--
-- IDEMPOTENTE — pode ser executada várias vezes em segurança.
--
-- Modela pedidos de amizade e amizades aceites numa única tabela dirigida:
--   requester_id -> addressee_id, com status 'pending' | 'accepted'.
-- Uma amizade aceite é bidirecional na leitura (ver amigo A<->B), mas a linha
-- guarda quem enviou o pedido. Impede-se duplicados exatos com um índice único
-- no par (requester_id, addressee_id); o inverso (B->A quando A->B já existe) é
-- tratado na aplicação (routes/socialRoutes.ts).
--
-- NOTA: o número 004 é usado por outra feature (aposta sem risco) noutro ramo;
-- esta migração é 005 para evitar colisão de ficheiros ao fundir os ramos.
-- ============================================================

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

-- Procurar rapidamente pedidos recebidos e amizades de um utilizador.
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships (requester_id, status);

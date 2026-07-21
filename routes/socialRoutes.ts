import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();

// Todas as rotas sociais exigem autenticação.
router.use(authenticateToken);

// ============================================================
// Colunas de bets devolvidas ao ver o perfil de um amigo. Espelham as de
// betsRoutes (mesmo formato que o modelo Bet do frontend espera) para poder
// reutilizar mapBetFromApi/Dashboard sem alterações.
// ============================================================
const BET_COLUMNS = `
  id, type, status,
  stake::float8 AS stake, odd::float8 AS odd,
  is_freebet, freebet_type, is_risk_free,
  potential_return::float8 AS potential_return,
  final_return::float8 AS final_return,
  net_profit::float8 AS net_profit,
  bookmaker,
  to_char(date_time, 'YYYY-MM-DD HH24:MI') AS date_time,
  notes, origin, selections, comment, tags, metadata, created_at
`;

// ------------------------------------------------------------
// Relação entre o utilizador autenticado (me) e outro utilizador.
// Devolve: 'none' | 'friends' | 'incoming' (ele pediu-me) | 'outgoing' (eu pedi).
// ------------------------------------------------------------
async function relationshipWith(meId: string, otherId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT requester_id, addressee_id, status
       FROM friendships
      WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)
      LIMIT 1`,
    [meId, otherId]
  );
  if (rows.length === 0) return "none";
  const row = rows[0];
  if (row.status === "accepted") return "friends";
  return row.requester_id === meId ? "outgoing" : "incoming";
}

// ============================================================
// GET /api/social/search?q=...  -> procura utilizadores por username.
// Exclui o próprio e anota a relação atual com cada resultado.
// ============================================================
router.get("/search", async (req: AuthenticatedRequest, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      res.json({ users: [] });
      return;
    }

    const { rows } = await pool.query(
      `SELECT id, username
         FROM users
        WHERE username ILIKE $1 AND id <> $2
        ORDER BY username
        LIMIT 10`,
      [`%${q}%`, req.user!.id]
    );

    const users = await Promise.all(
      rows.map(async (u) => ({
        id: u.id,
        username: u.username,
        relationship: await relationshipWith(req.user!.id, u.id),
      }))
    );

    res.json({ users });
  } catch (error) {
    console.error("Erro na procura de utilizadores:", error);
    res.status(500).json({ error: "Erro ao procurar utilizadores." });
  }
});

// ============================================================
// GET /api/social/friends  -> lista de amigos aceites.
// ============================================================
router.get("/friends", async (req: AuthenticatedRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, f.updated_at AS since
         FROM friendships f
         JOIN users u
           ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
        WHERE f.status = 'accepted'
          AND (f.requester_id = $1 OR f.addressee_id = $1)
        ORDER BY u.username`,
      [req.user!.id]
    );
    res.json({ friends: rows });
  } catch (error) {
    console.error("Erro ao listar amigos:", error);
    res.status(500).json({ error: "Erro ao obter os amigos." });
  }
});

// ============================================================
// GET /api/social/requests  -> pedidos pendentes (recebidos e enviados).
// ============================================================
router.get("/requests", async (req: AuthenticatedRequest, res) => {
  try {
    const incoming = await pool.query(
      `SELECT f.id, u.id AS user_id, u.username, f.created_at
         FROM friendships f
         JOIN users u ON u.id = f.requester_id
        WHERE f.addressee_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [req.user!.id]
    );
    const outgoing = await pool.query(
      `SELECT f.id, u.id AS user_id, u.username, f.created_at
         FROM friendships f
         JOIN users u ON u.id = f.addressee_id
        WHERE f.requester_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
      [req.user!.id]
    );
    res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({ error: "Erro ao obter os pedidos de amizade." });
  }
});

// ============================================================
// POST /api/social/requests  { username }  -> envia um pedido de amizade.
// Se já existir um pedido inverso pendente, aceita-o (torna-se amizade).
// ============================================================
router.post("/requests", async (req: AuthenticatedRequest, res) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    if (!username) {
      res.status(400).json({ error: "Indica o username do utilizador." });
      return;
    }

    const target = await pool.query("SELECT id, username FROM users WHERE username = $1", [username]);
    if (target.rows.length === 0) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    const other = target.rows[0];
    if (other.id === req.user!.id) {
      res.status(400).json({ error: "Não podes adicionar-te a ti próprio." });
      return;
    }

    // Já existe alguma relação (pendente ou aceite) entre os dois?
    const existing = await pool.query(
      `SELECT id, requester_id, status FROM friendships
        WHERE (requester_id = $1 AND addressee_id = $2)
           OR (requester_id = $2 AND addressee_id = $1)
        LIMIT 1`,
      [req.user!.id, other.id]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === "accepted") {
        res.status(409).json({ error: "Já são amigos." });
        return;
      }
      // Pendente. Se fui EU o destinatário (o outro já me tinha pedido),
      // aceito o pedido inverso em vez de criar um duplicado.
      if (row.requester_id === other.id) {
        await pool.query(
          "UPDATE friendships SET status = 'accepted', updated_at = TIMEZONE('utc', NOW()) WHERE id = $1",
          [row.id]
        );
        res.status(200).json({ success: true, status: "friends" });
        return;
      }
      res.status(409).json({ error: "Já enviaste um pedido a este utilizador." });
      return;
    }

    await pool.query(
      "INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending')",
      [req.user!.id, other.id]
    );
    res.status(201).json({ success: true, status: "outgoing" });
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
    res.status(500).json({ error: "Erro ao enviar o pedido de amizade." });
  }
});

// ============================================================
// POST /api/social/requests/:id/accept  -> aceita um pedido recebido.
// ============================================================
router.post("/requests/:id/accept", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `UPDATE friendships
          SET status = 'accepted', updated_at = TIMEZONE('utc', NOW())
        WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
        RETURNING id`,
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao aceitar pedido:", error);
    res.status(500).json({ error: "Erro ao aceitar o pedido." });
  }
});

// ============================================================
// DELETE /api/social/requests/:id  -> recusa (recebido) ou cancela (enviado)
// um pedido pendente. Só o destinatário ou o remetente o podem remover.
// ============================================================
router.delete("/requests/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM friendships
        WHERE id = $1 AND status = 'pending'
          AND (addressee_id = $2 OR requester_id = $2)
        RETURNING id`,
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover pedido:", error);
    res.status(500).json({ error: "Erro ao remover o pedido." });
  }
});

// ============================================================
// DELETE /api/social/friends/:userId  -> remove uma amizade aceite.
// ============================================================
router.delete("/friends/:userId", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM friendships
        WHERE status = 'accepted'
          AND ((requester_id = $1 AND addressee_id = $2)
            OR (requester_id = $2 AND addressee_id = $1))
        RETURNING id`,
      [req.user!.id, req.params.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Amizade não encontrada." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover amizade:", error);
    res.status(500).json({ error: "Erro ao remover a amizade." });
  }
});

// ============================================================
// GET /api/social/friends/:userId/bets  -> apostas de um amigo.
// GATE DE AUTORIZAÇÃO: só devolve as apostas se existir uma amizade ACEITE
// entre o utilizador autenticado e :userId. Caso contrário, 403.
// ============================================================
router.get("/friends/:userId/bets", async (req: AuthenticatedRequest, res) => {
  try {
    const relationship = await relationshipWith(req.user!.id, req.params.userId);
    if (relationship !== "friends") {
      res.status(403).json({ error: "Só podes ver as apostas dos teus amigos." });
      return;
    }

    const friend = await pool.query("SELECT id, username FROM users WHERE id = $1", [
      req.params.userId,
    ]);
    if (friend.rows.length === 0) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }

    const bets = await pool.query(
      `SELECT ${BET_COLUMNS}
         FROM bets
        WHERE user_id = $1 AND is_ignored = FALSE
        ORDER BY date_time DESC NULLS LAST, created_at DESC`,
      [req.params.userId]
    );

    res.json({ friend: friend.rows[0], bets: bets.rows });
  } catch (error) {
    console.error("Erro ao obter apostas do amigo:", error);
    res.status(500).json({ error: "Erro ao obter as apostas do amigo." });
  }
});

export default router;

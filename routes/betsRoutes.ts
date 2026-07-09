import { Router } from "express";
import pool from "../db/pool";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();

// Todas as rotas de bets exigem autenticação
router.use(authenticateToken);

// ============================================================
// GET /api/bets  -> lista só as bets do utilizador autenticado
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, bookmaker, bet_type, stake, odd, potential_return,
              status, event_date, selections, created_at
       FROM bets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user!.id]
    );
    res.json({ bets: result.rows });
  } catch (error) {
    console.error("Erro ao listar bets:", error);
    res.status(500).json({ error: "Erro ao obter as bets." });
  }
});

// ============================================================
// POST /api/bets  -> cria uma bet associada ao utilizador autenticado
// ============================================================
router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const {
      bookmaker,
      type,           // "SIMPLES" | "MULTIPLA"
      stake,
      odd,
      potentialReturn,
      dateTime,
      selections,
      status,
    } = req.body ?? {};

    if (stake == null || odd == null) {
      res.status(400).json({ error: "stake e odd são obrigatórios." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO bets
         (user_id, bookmaker, bet_type, stake, odd, potential_return,
          event_date, selections, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'PENDENTE'))
       RETURNING *`,
      [
        req.user!.id,          // <- é aqui que a bet fica vinculada ao ID do user autenticado
        bookmaker ?? null,
        type ?? null,
        stake,
        odd,
        potentialReturn ?? null,
        dateTime ?? null,
        selections ? JSON.stringify(selections) : null,
        status ?? null,
      ]
    );

    res.status(201).json({ success: true, bet: result.rows[0] });
  } catch (error) {
    console.error("Erro ao criar bet:", error);
    res.status(500).json({ error: "Erro ao guardar a bet." });
  }
});

// ============================================================
// PUT /api/bets/:id  -> atualiza uma bet (só se pertencer ao utilizador)
// ============================================================
router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, stake, odd, potentialReturn } = req.body ?? {};

    // A cláusula "AND user_id = $x" é a garantia de que um utilizador
    // nunca consegue editar a bet de outro, mesmo que adivinhe o ID.
    const result = await pool.query(
      `UPDATE bets
       SET status = COALESCE($1, status),
           stake = COALESCE($2, stake),
           odd = COALESCE($3, odd),
           potential_return = COALESCE($4, potential_return),
           updated_at = now()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [status ?? null, stake ?? null, odd ?? null, potentialReturn ?? null, id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Bet não encontrada." });
      return;
    }
    res.json({ success: true, bet: result.rows[0] });
  } catch (error) {
    console.error("Erro ao atualizar bet:", error);
    res.status(500).json({ error: "Erro ao atualizar a bet." });
  }
});

// ============================================================
// DELETE /api/bets/:id  -> apaga uma bet (só se pertencer ao utilizador)
// ============================================================
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM bets WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Bet não encontrada." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao apagar bet:", error);
    res.status(500).json({ error: "Erro ao apagar a bet." });
  }
});

export default router;

// routes/accountsRoutes.ts
// Contas por casa de apostas: um utilizador pode ter várias contas na mesma
// casa (ex.: duas contas Betclic) e associar apostas a cada uma. Apagar uma
// conta não apaga apostas — o FK em bets.account_id faz SET NULL.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();

// Todas as rotas exigem autenticação.
router.use(authenticateToken);

const ACCOUNT_COLUMNS = "id, bookmaker, label, created_at";
const MAX_LABEL_LENGTH = 60;
const MAX_ACCOUNTS = 100;

function cleanLabel(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const label = raw.trim();
  if (label.length === 0 || label.length > MAX_LABEL_LENGTH) return null;
  return label;
}

function cleanBookmaker(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const bookmaker = raw.trim();
  if (bookmaker.length === 0 || bookmaker.length > MAX_LABEL_LENGTH) return null;
  return bookmaker;
}

// ============================================================
// GET /api/accounts -> lista as contas do utilizador
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT ${ACCOUNT_COLUMNS}
       FROM bookie_accounts
       WHERE user_id = $1
       ORDER BY bookmaker ASC, label ASC`,
      [req.user!.id]
    );
    res.json({ accounts: result.rows });
  } catch (error) {
    console.error("Erro ao listar contas:", error);
    res.status(500).json({ error: "Erro ao obter as contas." });
  }
});

// ============================================================
// POST /api/accounts -> cria uma conta { bookmaker, label }
// ============================================================
router.post("/", async (req: AuthenticatedRequest, res) => {
  const bookmaker = cleanBookmaker(req.body?.bookmaker);
  const label = cleanLabel(req.body?.label);
  if (!bookmaker) {
    res.status(400).json({ error: "Indica a casa de apostas." });
    return;
  }
  if (!label) {
    res.status(400).json({ error: `O nome da conta é obrigatório (máx. ${MAX_LABEL_LENGTH} caracteres).` });
    return;
  }

  try {
    const count = await pool.query(
      "SELECT COUNT(*)::int AS n FROM bookie_accounts WHERE user_id = $1",
      [req.user!.id]
    );
    if (count.rows[0].n >= MAX_ACCOUNTS) {
      res.status(400).json({ error: `Limite de ${MAX_ACCOUNTS} contas atingido.` });
      return;
    }

    const result = await pool.query(
      `INSERT INTO bookie_accounts (user_id, bookmaker, label)
       VALUES ($1, $2, $3)
       RETURNING ${ACCOUNT_COLUMNS}`,
      [req.user!.id, bookmaker, label]
    );
    res.status(201).json({ success: true, account: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Já existe uma conta com esse nome nessa casa." });
      return;
    }
    console.error("Erro ao criar conta:", error);
    res.status(500).json({ error: "Erro ao criar a conta." });
  }
});

// ============================================================
// PUT /api/accounts/:id -> renomeia uma conta { label }
// (a casa não é editável: mudaria retroativamente a que casa as
// apostas associadas "pertencem" — cria antes uma conta nova)
// ============================================================
router.put("/:id", async (req: AuthenticatedRequest, res) => {
  const label = cleanLabel(req.body?.label);
  if (!label) {
    res.status(400).json({ error: `O nome da conta é obrigatório (máx. ${MAX_LABEL_LENGTH} caracteres).` });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE bookie_accounts
       SET label = $1, updated_at = timezone('utc', now())
       WHERE id = $2 AND user_id = $3
       RETURNING ${ACCOUNT_COLUMNS}`,
      [label, req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Conta não encontrada." });
      return;
    }
    res.json({ success: true, account: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Já existe uma conta com esse nome nessa casa." });
      return;
    }
    if (error?.code === "22P02") {
      res.status(404).json({ error: "Conta não encontrada." });
      return;
    }
    console.error("Erro ao renomear conta:", error);
    res.status(500).json({ error: "Erro ao renomear a conta." });
  }
});

// ============================================================
// DELETE /api/accounts/:id -> apaga a conta; as apostas ficam
// sem conta (account_id -> NULL) mas mantêm a casa.
// ============================================================
router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM bookie_accounts WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Conta não encontrada." });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === "22P02") {
      res.status(404).json({ error: "Conta não encontrada." });
      return;
    }
    console.error("Erro ao apagar conta:", error);
    res.status(500).json({ error: "Erro ao apagar a conta." });
  }
});

export default router;

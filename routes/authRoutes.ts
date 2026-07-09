import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is missing.");
  return secret;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user: { id: string; username: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY }
  );
}

// ============================================================
// POST /api/auth/register
// ============================================================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (!username || !email || !password) {
      res.status(400).json({ error: "username, email e password são obrigatórios." });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Email inválido." });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "A password deve ter pelo menos 8 caracteres." });
      return;
    }

    // Verifica se já existe um utilizador com este username ou email
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Username ou email já estão em uso." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    console.error("Erro no registo:", error);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

// ============================================================
// POST /api/auth/login
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "email e password são obrigatórios." });
      return;
    }

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    // Mensagem genérica de propósito: não revelar se foi o email ou a
    // password que falhou, para não facilitar enumeração de contas.
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Credenciais inválidas." });
      return;
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      res.status(401).json({ error: "Credenciais inválidas." });
      return;
    }

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao autenticar." });
  }
});

// ============================================================
// GET /api/auth/me  (rota protegida — devolve o utilizador atual)
// ============================================================
router.get("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Utilizador não encontrado." });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Erro ao obter utilizador:", error);
    res.status(500).json({ error: "Erro ao obter dados do utilizador." });
  }
});

export default router;

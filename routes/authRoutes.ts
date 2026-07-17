import { Router } from "express";
// bcryptjs (JS puro) em vez de bcrypt: o binário nativo do bcrypt resolve o
// caminho do .node em runtime, o que impede o bundler da Vercel de o incluir
// na função serverless (FUNCTION_INVOCATION_FAILED no arranque). Os hashes
// $2b$ são compatíveis entre os dois pacotes.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";

const router = Router();
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

// Hash pré-calculado de um valor aleatório. Usado no login quando o email não
// existe, para que o pedido demore o mesmo tempo que uma comparação real —
// senão a diferença de tempos revelava quais os emails registados.
const DUMMY_HASH = "$2b$12$N8eQ/Iq6zWr0kJfw.5gQCekaPVYadHUlGBDikr.Qg3ChTNIW6gQUa";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is missing.");
  return secret;
}

function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 3–32 caracteres: letras, números, ponto, hífen e underscore.
function isValidUsername(username: string): boolean {
  return typeof username === "string" && /^[A-Za-z0-9_.-]{3,32}$/.test(username);
}

// O algoritmo bcrypt só considera os primeiros 72 bytes da password; aceitar
// mais do que isso daria uma falsa sensação de segurança.
function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "A password deve ter pelo menos 8 caracteres.";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "A password não pode exceder 72 bytes.";
  }
  return null;
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
    if (!isValidUsername(username)) {
      res.status(400).json({ error: "Username inválido: 3 a 32 caracteres (letras, números, '.', '-' ou '_')." });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Email inválido." });
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
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

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email e password são obrigatórios." });
      return;
    }

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    // Mensagem genérica de propósito: não revelar se foi o email ou a
    // password que falhou, para não facilitar enumeração de contas.
    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.password_hash : DUMMY_HASH
    );

    if (!user || !passwordMatches) {
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
// Recuperação de password
//
// O token enviado por email nunca é guardado em claro: na BD fica só o
// hash SHA-256. Expira em 1 hora e é de uso único. As respostas de
// /forgot-password são sempre genéricas para não revelar que emails
// estão registados (mesma razão do DUMMY_HASH no login).
// ============================================================
const RESET_TOKEN_TTL_MINUTES = 60;

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Base para o link do email. Definida por APP_BASE_URL; sem ela, usa o
// domínio de produção (ou localhost em dev). Nunca derivada dos headers do
// pedido — um Host forjado poria links maliciosos em emails legítimos.
function appBaseUrl(): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, "");
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "https://gestordebets.vercel.app";
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

// ============================================================
// POST /api/auth/forgot-password  { email }
// ============================================================
router.post("/forgot-password", async (req, res) => {
  // Resposta única para todos os desfechos (email inexistente incluído).
  const genericResponse = {
    success: true,
    message: "Se o email estiver registado, enviámos instruções de recuperação.",
  };

  try {
    const { email } = req.body ?? {};
    if (!isValidEmail(email)) {
      // Formato inválido não revela nada — resposta genérica na mesma.
      res.json(genericResponse);
      return;
    }

    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      res.json(genericResponse);
      return;
    }

    // Um pedido novo invalida os tokens pendentes do mesmo utilizador e
    // aproveita para limpar tokens antigos já inúteis.
    const token = randomBytes(32).toString("base64url");
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < timezone('utc', now()) - interval '1 day'",
      [user.id]
    );
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, timezone('utc', now()) + ($3 || ' minutes')::interval)`,
      [user.id, hashResetToken(token), String(RESET_TOKEN_TTL_MINUTES)]
    );

    const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;
    try {
      const { sent } = await sendPasswordResetEmail(user.email, resetUrl);
      if (!sent) {
        // Sem RESEND_API_KEY (tipicamente em desenvolvimento): o link fica no
        // log do servidor para o fluxo poder ser testado na mesma.
        console.log(`[mailer] RESEND_API_KEY não configurada — link de reset para ${user.email}: ${resetUrl}`);
      }
    } catch (mailError) {
      // O erro de envio não chega ao cliente (senão revelava que o email
      // existe); fica no log para diagnóstico.
      console.error("Erro ao enviar email de recuperação:", mailError);
    }

    res.json(genericResponse);
  } catch (error) {
    console.error("Erro em forgot-password:", error);
    res.status(500).json({ error: "Erro ao processar o pedido." });
  }
});

// ============================================================
// POST /api/auth/reset-password  { token, password }
// ============================================================
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body ?? {};
    if (typeof token !== "string" || token.length < 20 || token.length > 128) {
      res.status(400).json({ error: "Link de recuperação inválido ou expirado." });
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    const result = await pool.query(
      `SELECT t.id AS token_id, u.id, u.username, u.email
       FROM password_reset_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = $1
         AND t.used_at IS NULL
         AND t.expires_at > timezone('utc', now())`,
      [hashResetToken(token)]
    );
    const row = result.rows[0];
    if (!row) {
      res.status(400).json({ error: "Link de recuperação inválido ou expirado. Pede um novo." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, row.id]);
    // Uso único: marca este token e apaga quaisquer outros do utilizador.
    await pool.query("UPDATE password_reset_tokens SET used_at = timezone('utc', now()) WHERE id = $1", [row.token_id]);
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1 AND id <> $2", [row.id, row.token_id]);

    // Auto-login: evita obrigar o utilizador a escrever já a password nova.
    const jwtToken = signToken(row);
    res.json({
      success: true,
      token: jwtToken,
      user: { id: row.id, username: row.username, email: row.email },
    });
  } catch (error) {
    console.error("Erro em reset-password:", error);
    res.status(500).json({ error: "Erro ao repor a password." });
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

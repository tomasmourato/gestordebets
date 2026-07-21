// routes/settingsRoutes.ts
// Definições do utilizador lidas tanto pelo site como pela extensão. Por agora
// guarda só as "casas ativas" — quais das casas suportadas (betclic/betano/
// solverde) o utilizador quer usar. A extensão consulta /api/settings para só
// mostrar/importar dessas casas.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticateToken);

// Casas suportadas pela importação (chaves em minúsculas, iguais às da extensão).
export const SUPPORTED_BOOKMAKERS = ["betclic", "betano", "solverde"] as const;

// Normaliza a lista enviada: só chaves suportadas, sem duplicados, minúsculas.
function cleanEnabled(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const key = item.trim().toLowerCase();
    if ((SUPPORTED_BOOKMAKERS as readonly string[]).includes(key)) seen.add(key);
  }
  // Mantém a ordem canónica das suportadas.
  return SUPPORTED_BOOKMAKERS.filter((k) => seen.has(k));
}

// ============================================================
// GET /api/settings -> { enabledBookmakers, supportedBookmakers }
// enabledBookmakers já resolvido: NULL na BD (não configurado) -> todas.
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT enabled_bookmakers FROM users WHERE id = $1",
      [req.user!.id]
    );
    const stored = result.rows[0]?.enabled_bookmakers ?? null;
    const enabledBookmakers = Array.isArray(stored)
      ? SUPPORTED_BOOKMAKERS.filter((k) => stored.includes(k))
      : [...SUPPORTED_BOOKMAKERS];
    res.json({ enabledBookmakers, supportedBookmakers: [...SUPPORTED_BOOKMAKERS] });
  } catch (error) {
    console.error("Erro ao obter definições:", error);
    res.status(500).json({ error: "Erro ao obter as definições." });
  }
});

// ============================================================
// PUT /api/settings -> guarda { enabledBookmakers: string[] }
// Array vazio = nenhuma casa ativa (permitido).
// ============================================================
router.put("/", async (req: AuthenticatedRequest, res) => {
  const enabled = cleanEnabled(req.body?.enabledBookmakers);
  if (enabled === null) {
    res.status(400).json({ error: "enabledBookmakers tem de ser uma lista." });
    return;
  }
  try {
    await pool.query(
      "UPDATE users SET enabled_bookmakers = $1 WHERE id = $2",
      [enabled, req.user!.id]
    );
    res.json({ success: true, enabledBookmakers: enabled, supportedBookmakers: [...SUPPORTED_BOOKMAKERS] });
  } catch (error) {
    console.error("Erro ao guardar definições:", error);
    res.status(500).json({ error: "Erro ao guardar as definições." });
  }
});

export default router;

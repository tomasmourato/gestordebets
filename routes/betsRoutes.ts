import { Router } from "express";
import pool from "../db/pool";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware";

const router = Router();

// Todas as rotas de bets exigem autenticação
router.use(authenticateToken);

// ============================================================
// Colunas devolvidas ao frontend. Convertemos DECIMAL -> float8
// (senão o driver pg devolve strings) e formatamos a data para o
// formato "YYYY-MM-DD HH:mm" que o modelo Bet do frontend espera.
// ============================================================
const BET_COLUMNS = `
  id, type, status,
  stake::float8 AS stake, odd::float8 AS odd,
  is_freebet,
  potential_return::float8 AS potential_return,
  final_return::float8 AS final_return,
  net_profit::float8 AS net_profit,
  bookmaker,
  to_char(date_time, 'YYYY-MM-DD HH24:MI') AS date_time,
  notes, origin, selections, comment, tags, metadata, created_at
`;

// Estados válidos de uma aposta (têm de coincidir com BetStatus no frontend)
const VALID_STATUSES = [
  "POR_LIQUIDAR",
  "GANHA",
  "PERDIDA",
  "ANULADA",
  "MEIO_GANHA",
  "MEIO_PERDIDA",
];

// ============================================================
// parseBetPayload
// Normaliza o corpo do pedido para os valores a gravar na BD.
// Devolve { error } quando algo é inválido (a rota responde 400)
// ou { values } com o array de valores prontos para o INSERT/UPDATE,
// pela mesma ordem das colunas.
// ============================================================
interface ParsedPayload {
  error?: string;
  values?: any[];
}

function trimOrNull(value: any): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function parseBetPayload(body: any): ParsedPayload {
  const b = body ?? {};

  // stake e odd são obrigatórios e têm de ser números finitos > 0
  const stake = Number(b.stake);
  const odd = Number(b.odd);
  if (!Number.isFinite(stake) || stake <= 0) {
    return { error: "stake tem de ser um número maior que 0." };
  }
  if (!Number.isFinite(odd) || odd <= 0) {
    return { error: "odd tem de ser um número maior que 0." };
  }

  // type: SIMPLES | MULTIPLA (default SIMPLES)
  let type = typeof b.type === "string" ? b.type.trim().toUpperCase() : "SIMPLES";
  if (type !== "SIMPLES" && type !== "MULTIPLA") type = "SIMPLES";

  // status: um dos seis valores válidos (default POR_LIQUIDAR)
  let status = typeof b.status === "string" ? b.status.trim().toUpperCase() : "POR_LIQUIDAR";
  if (!VALID_STATUSES.includes(status)) status = "POR_LIQUIDAR";

  // Campos numéricos opcionais: NaN -> erro se enviados, senão null
  const numericOrNull = (raw: any, label: string): number | null | { error: string } => {
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return { error: `${label} não é um número válido.` };
    return n;
  };

  const potentialReturn = numericOrNull(b.potentialReturn, "potentialReturn");
  if (potentialReturn && typeof potentialReturn === "object") return { error: potentialReturn.error };
  const finalReturn = numericOrNull(b.finalReturn, "finalReturn");
  if (finalReturn && typeof finalReturn === "object") return { error: finalReturn.error };
  const netProfit = numericOrNull(b.netProfit, "netProfit");
  if (netProfit && typeof netProfit === "object") return { error: netProfit.error };

  const isFreebet = b.isFreebet === true || b.isFreebet === "true";

  // dateTime: string vazia -> null
  const dateTime = trimOrNull(b.dateTime);

  // bookmaker: mantém-se tal como enviado (pode ser string vazia)
  const bookmaker = b.bookmaker == null ? null : String(b.bookmaker);

  // Campos de texto nullable: '' -> null
  const notes = trimOrNull(b.notes);
  const comment = trimOrNull(b.comment);
  const tags = trimOrNull(b.tags);
  const origin = trimOrNull(b.origin);

  // selections e metadata: JSON.stringify ou null
  const selections =
    b.selections === undefined || b.selections === null ? null : JSON.stringify(b.selections);
  const metadata =
    b.metadata === undefined || b.metadata === null ? null : JSON.stringify(b.metadata);

  // Ordem: type, status, stake, odd, is_freebet, potential_return,
  // final_return, net_profit, bookmaker, date_time, notes, origin,
  // selections, comment, tags, metadata
  return {
    values: [
      type,
      status,
      stake,
      odd,
      isFreebet,
      potentialReturn as number | null,
      finalReturn as number | null,
      netProfit as number | null,
      bookmaker,
      dateTime,
      notes,
      origin,
      selections,
      comment,
      tags,
      metadata,
    ],
  };
}

// ============================================================
// GET /api/bets  -> lista só as bets do utilizador autenticado
// ============================================================
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT ${BET_COLUMNS}
       FROM bets
       WHERE user_id = $1
       ORDER BY date_time DESC NULLS LAST, created_at DESC`,
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
    const parsed = parseBetPayload(req.body);
    if (parsed.error) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const result = await pool.query(
      `INSERT INTO bets
         (user_id, type, status, stake, odd, is_freebet, potential_return,
          final_return, net_profit, bookmaker, date_time, notes, origin,
          selections, comment, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING ${BET_COLUMNS}`,
      [req.user!.id, ...parsed.values!]
    );

    res.status(201).json({ success: true, bet: result.rows[0] });
  } catch (error) {
    console.error("Erro ao criar bet:", error);
    res.status(500).json({ error: "Erro ao guardar a bet." });
  }
});

// ============================================================
// POST /api/bets/bulk  -> cria várias bets numa transação
// ============================================================
router.post("/bulk", async (req: AuthenticatedRequest, res) => {
  const { bets } = req.body ?? {};

  if (!Array.isArray(bets) || bets.length === 0) {
    res.status(400).json({ error: "É necessário um array de bets não vazio." });
    return;
  }
  if (bets.length > 1000) {
    res.status(400).json({ error: "Não é possível importar mais de 1000 bets de uma vez." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inserted: any[] = [];
    for (let i = 0; i < bets.length; i++) {
      const parsed = parseBetPayload(bets[i]);
      if (parsed.error) {
        // Lança para forçar o ROLLBACK de todo o lote.
        throw { statusCode: 400, message: `Bet inválida no índice ${i}: ${parsed.error}` };
      }

      const result = await client.query(
        `INSERT INTO bets
           (user_id, type, status, stake, odd, is_freebet, potential_return,
            final_return, net_profit, bookmaker, date_time, notes, origin,
            selections, comment, tags, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING ${BET_COLUMNS}`,
        [req.user!.id, ...parsed.values!]
      );
      inserted.push(result.rows[0]);
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, bets: inserted });
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error && error.statusCode === 400) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Erro ao importar bets em lote:", error);
    res.status(500).json({ error: "Erro ao importar as bets." });
  } finally {
    client.release();
  }
});

// ============================================================
// PUT /api/bets/:id  -> substitui os campos editáveis de uma bet
// (o frontend envia sempre a aposta completa)
// ============================================================
router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = parseBetPayload(req.body);
    if (parsed.error) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    // A cláusula "AND user_id = $x" garante que um utilizador nunca
    // consegue editar a bet de outro, mesmo que adivinhe o ID.
    const result = await pool.query(
      `UPDATE bets
       SET type = $1, status = $2, stake = $3, odd = $4, is_freebet = $5,
           potential_return = $6, final_return = $7, net_profit = $8,
           bookmaker = $9, date_time = $10, notes = $11, origin = $12,
           selections = $13, comment = $14, tags = $15, metadata = $16,
           updated_at = timezone('utc', now())
       WHERE id = $17 AND user_id = $18
       RETURNING ${BET_COLUMNS}`,
      [...parsed.values!, id, req.user!.id]
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

// ============================================================
// DELETE /api/bets  -> apaga TODAS as bets do utilizador
// ============================================================
router.delete("/", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM bets WHERE user_id = $1",
      [req.user!.id]
    );
    res.json({ success: true, deleted: result.rowCount });
  } catch (error) {
    console.error("Erro ao apagar todas as bets:", error);
    res.status(500).json({ error: "Erro ao apagar as bets." });
  }
});

export default router;

import { Router } from "express";
import { BET_SELECT_COLUMNS } from "../db/betColumns.js";
import pool from "../db/pool.js";
import {
    AuthenticatedRequest,
    authenticateToken,
} from "../middleware/authMiddleware.js";
import { normalizeBetStatus } from "../src/lib/betStatus.js";

const router = Router();

// Todas as rotas de bets exigem autenticação
router.use(authenticateToken);

// Colunas devolvidas ao frontend — lista única partilhada com o SSR (server.ts).
const BET_COLUMNS = BET_SELECT_COLUMNS;

const VALID_FREEBET_TYPES = ["SNR", "SR"];
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================
// Garante que todos os accountIds enviados pertencem ao utilizador.
// Devolve null se ok, ou a mensagem de erro (a rota responde 400).
// Sem isto, um payload podia associar apostas à conta de outro user.
// ============================================================
async function validateAccountOwnership(
    db: { query: (text: string, params?: any[]) => Promise<any> },
    userId: string,
    accountIds: (string | null)[],
): Promise<string | null> {
    const unique = [
        ...new Set(accountIds.filter((id): id is string => id !== null)),
    ];
    if (unique.length === 0) return null;
    const result = await db.query(
        "SELECT id FROM bookie_accounts WHERE user_id = $1 AND id = ANY($2::uuid[])",
        [userId, unique],
    );
    if (result.rows.length !== unique.length) {
        return "Conta de casa de apostas inválida ou inexistente.";
    }
    return null;
}

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
    accountId?: string | null;
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
    let type =
        typeof b.type === "string" ? b.type.trim().toUpperCase() : "SIMPLES";
    if (type !== "SIMPLES" && type !== "MULTIPLA") type = "SIMPLES";

    // CASHOUT é um estado próprio. Além do valor explícito, aceitamos os nomes
    // usados pelas casas e corrigimos payloads legados cuja metadata ainda
    // acompanha MEIO_GANHA/MEIO_PERDIDA mas identifica um cashout real.
    const status = normalizeBetStatus(b.status, b.metadata);

    // Campos numéricos opcionais: NaN -> erro se enviados, senão null
    const numericOrNull = (
        raw: any,
        label: string,
    ): number | null | { error: string } => {
        if (raw === undefined || raw === null || raw === "") return null;
        const n = Number(raw);
        if (!Number.isFinite(n))
            return { error: `${label} não é um número válido.` };
        return n;
    };

    const potentialReturn = numericOrNull(b.potentialReturn, "potentialReturn");
    if (potentialReturn && typeof potentialReturn === "object")
        return { error: potentialReturn.error };
    const finalReturn = numericOrNull(b.finalReturn, "finalReturn");
    if (finalReturn && typeof finalReturn === "object")
        return { error: finalReturn.error };
    const netProfit = numericOrNull(b.netProfit, "netProfit");
    if (netProfit && typeof netProfit === "object")
        return { error: netProfit.error };

    const isRiskFree = b.isRiskFree === true || b.isRiskFree === "true";
    // Freebet e "sem risco" são mutuamente exclusivos; sem risco tem prioridade.
    const isFreebet =
        !isRiskFree && (b.isFreebet === true || b.isFreebet === "true");

    // freebetType: SNR | SR, ou null (não-freebet ou desconhecido)
    let freebetType: string | null =
        typeof b.freebetType === "string"
            ? b.freebetType.trim().toUpperCase()
            : null;
    if (freebetType !== null && !VALID_FREEBET_TYPES.includes(freebetType))
        freebetType = null;

    // dateTime: string vazia -> null
    const dateTime = trimOrNull(b.dateTime);

    // bookmaker: mantém-se tal como enviado (pode ser string vazia)
    const bookmaker = b.bookmaker == null ? null : String(b.bookmaker);

    // Campos de texto nullable: '' -> null
    const notes = trimOrNull(b.notes);
    const comment = trimOrNull(b.comment);
    const tags = trimOrNull(b.tags);
    const origin = trimOrNull(b.origin);

    // accountId: UUID de uma conta do utilizador ou null ("sem conta").
    // A propriedade da conta é validada pela rota (validateAccountOwnership).
    const accountIdRaw = trimOrNull(b.accountId);
    if (accountIdRaw !== null && !UUID_RE.test(accountIdRaw)) {
        return { error: "accountId inválido." };
    }
    const accountId = accountIdRaw;

    // selections e metadata: JSON.stringify ou null
    const selections =
        b.selections === undefined || b.selections === null
            ? null
            : JSON.stringify(b.selections);
    const metadata =
        b.metadata === undefined || b.metadata === null
            ? null
            : JSON.stringify(b.metadata);

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
            freebetType,
            isRiskFree,
            accountId,
        ],
        accountId,
    };
}

// ============================================================
// Erros do Postgres causados pelo payload (e não pelo servidor):
// devolvê-los como 400 com mensagem legível em vez de um 500 opaco.
// Foi um destes (23514, constraint de status desatualizada) que
// mascarou a falha da importação em bloco durante dias.
// ============================================================
function dbErrorMessage(error: any): string | null {
    switch (error?.code) {
        case "23514": // check_violation
            return "A aposta tem valores não permitidos pela base de dados (estado ou tipo). Corre as migrações em db/migrations/.";
        case "23502": // not_null_violation
            return `Campo obrigatório em falta na aposta (${error?.column ?? "desconhecido"}).`;
        case "22007": // invalid_datetime_format
        case "22008": // datetime_field_overflow
            return "Data/hora da aposta em formato inválido (usa YYYY-MM-DD HH:mm).";
        default:
            return null;
    }
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
            [req.user!.id],
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

        const accountError = await validateAccountOwnership(
            pool,
            req.user!.id,
            [parsed.accountId ?? null],
        );
        if (accountError) {
            res.status(400).json({ error: accountError });
            return;
        }

        const result = await pool.query(
            `INSERT INTO bets
         (user_id, type, status, stake, odd, is_freebet, potential_return,
          final_return, net_profit, bookmaker, date_time, notes, origin,
          selections, comment, tags, metadata, freebet_type, is_risk_free, account_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING ${BET_COLUMNS}`,
            [req.user!.id, ...parsed.values!],
        );

        res.status(201).json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
            return;
        }
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
        res.status(400).json({
            error: "É necessário um array de bets não vazio.",
        });
        return;
    }
    if (bets.length > 1000) {
        res.status(400).json({
            error: "Não é possível importar mais de 1000 bets de uma vez.",
        });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Valida todos os payloads (e a propriedade das contas) antes de inserir.
        const parsedAll: any[][] = [];
        const accountIds: (string | null)[] = [];
        for (let i = 0; i < bets.length; i++) {
            const parsed = parseBetPayload(bets[i]);
            if (parsed.error) {
                // Lança para forçar o ROLLBACK de todo o lote.
                throw {
                    statusCode: 400,
                    message: `Bet inválida no índice ${i}: ${parsed.error}`,
                };
            }
            parsedAll.push(parsed.values!);
            accountIds.push(parsed.accountId ?? null);
        }
        const accountError = await validateAccountOwnership(
            client,
            req.user!.id,
            accountIds,
        );
        if (accountError) throw { statusCode: 400, message: accountError };

        const inserted: any[] = [];
        for (const values of parsedAll) {
            const result = await client.query(
                `INSERT INTO bets
           (user_id, type, status, stake, odd, is_freebet, potential_return,
            final_return, net_profit, bookmaker, date_time, notes, origin,
            selections, comment, tags, metadata, freebet_type, is_risk_free, account_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         RETURNING ${BET_COLUMNS}`,
                [req.user!.id, ...values],
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
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
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

        const accountError = await validateAccountOwnership(
            pool,
            req.user!.id,
            [parsed.accountId ?? null],
        );
        if (accountError) {
            res.status(400).json({ error: accountError });
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
           freebet_type = $17, is_risk_free = $18, account_id = $19,
           updated_at = timezone('utc', now())
       WHERE id = $20 AND user_id = $21
       RETURNING ${BET_COLUMNS}`,
            [...parsed.values!, id, req.user!.id],
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        res.json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        const payloadError = dbErrorMessage(error);
        if (payloadError) {
            res.status(400).json({ error: payloadError });
            return;
        }
        console.error("Erro ao atualizar bet:", error);
        res.status(500).json({ error: "Erro ao atualizar a bet." });
    }
});

// ============================================================
// PATCH /api/bets/:id/ignore  -> marca/desmarca a aposta como ignorada
// (excluída das estatísticas), com um motivo opcional em `comment`.
// Endpoint dedicado e leve: não revalida nem substitui a aposta toda como o
// PUT — só alterna a flag e (opcionalmente) o comentário.
// ============================================================
router.patch("/:id/ignore", async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;
        const ignored =
            req.body?.ignored === true || req.body?.ignored === "true";
        // Só mexemos no comentário quando o campo vem no corpo — assim desmarcar
        // não apaga o motivo por acidente, mas o utilizador pode limpá-lo com "".
        const hasComment = Object.prototype.hasOwnProperty.call(
            req.body ?? {},
            "comment",
        );
        const comment = hasComment ? trimOrNull(req.body.comment) : null;

        const result = await pool.query(
            `UPDATE bets
       SET is_ignored = $1,
           comment = CASE WHEN $2::boolean THEN $3 ELSE comment END,
           updated_at = timezone('utc', now())
       WHERE id = $4 AND user_id = $5
       RETURNING ${BET_COLUMNS}`,
            [ignored, hasComment, comment, id, req.user!.id],
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        res.json({ success: true, bet: result.rows[0] });
    } catch (error: any) {
        if (error?.code === "22P02") {
            res.status(404).json({ error: "Bet não encontrada." });
            return;
        }
        console.error("Erro ao ignorar bet:", error);
        res.status(500).json({ error: "Erro ao ignorar a aposta." });
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
            [id, req.user!.id],
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
        const result = await pool.query("DELETE FROM bets WHERE user_id = $1", [
            req.user!.id,
        ]);
        res.json({ success: true, deleted: result.rowCount });
    } catch (error) {
        console.error("Erro ao apagar todas as bets:", error);
        res.status(500).json({ error: "Erro ao apagar as bets." });
    }
});

export default router;

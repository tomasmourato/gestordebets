// routes/insightsRoutes.ts
// AI Insights diários: dicas de picks para os jogos DO DIA, geradas pelo
// Gemini com grounding no Google Search (o modelo pesquisa os jogos e odds
// reais antes de escrever — sem grounding alucinaria jogos inexistentes).
//
// Custo controlado: gera-se UMA vez por dia e guarda-se em daily_insights;
// todos os utilizadores leem a mesma linha. Pedidos concorrentes no primeiro
// acesso do dia são resolvidos pelo UNIQUE(insight_date) + ON CONFLICT.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getGeminiClient, extractJson } from "../lib/gemini.js";

const router = Router();
router.use(authenticateToken);

const MODEL = "gemini-2.5-flash";
const MAX_PICKS = 12;

/** Data de "hoje" em Lisboa (o dia desportivo do utilizador, não UTC). */
function todayInLisbon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
}

interface Pick {
  sport: string;
  competition: string;
  match: string;
  kickoffLisbon: string;
  market: string;
  selection: string;
  approxOdd: number | null;
  confidence: number;
  rationale: string;
}

// Normaliza/valida o JSON devolvido pelo modelo. Campos em falta não rebentam
// a resposta — o pick é descartado se lhe faltar o essencial.
function sanitizeContent(raw: any): { summary: string; picks: Pick[] } {
  const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const picks: Pick[] = (Array.isArray(raw?.picks) ? raw.picks : [])
    .map((p: any): Pick => ({
      sport: clip(p?.sport, 40),
      competition: clip(p?.competition, 80),
      match: clip(p?.match, 120),
      kickoffLisbon: clip(p?.kickoffLisbon, 20),
      market: clip(p?.market, 80),
      selection: clip(p?.selection, 120),
      approxOdd: Number.isFinite(Number(p?.approxOdd)) && Number(p?.approxOdd) > 1
        ? Number(Number(p.approxOdd).toFixed(2))
        : null,
      confidence: Math.min(5, Math.max(1, Math.round(Number(p?.confidence) || 3))),
      rationale: clip(p?.rationale, 400),
    }))
    .filter((p: Pick) => p.match && p.selection && p.sport)
    .slice(0, MAX_PICKS);

  if (picks.length === 0) throw new Error("O modelo não devolveu picks válidos.");
  return { summary: clip(raw?.summary, 600), picks };
}

async function generateInsights(dateLisbon: string) {
  const prompt = `
Hoje é ${dateLisbon}. És um analista de apostas desportivas experiente e prudente, a escrever em português de Portugal.

USA A PESQUISA GOOGLE para descobrires jogos REAIS que se realizam HOJE (${dateLisbon}) e as odds aproximadas atuais nas casas europeias. NÃO inventes jogos, equipas nem odds — inclui apenas eventos que confirmaste na pesquisa.

Escolhe 6 a 10 picks para hoje que cumpram tudo isto:
- Pelo menos 3 desportos diferentes (ex.: futebol, basquetebol, ténis; outros são bem-vindos).
- Odds variadas: alguns favoritos seguros (odd ~1.30–1.60), alguns equilibrados (~1.80–2.50) e no máximo 1 aposta de valor com odd 3.00+.
- Mercados concretos (resultado final, over/under golos ou pontos, ambas marcam, handicap, vencedor do encontro...).
- Justificação curta (1–2 frases) baseada em forma recente, confrontos, lesões ou contexto — factual, sem promessas.

Responde APENAS com JSON válido, sem texto fora do JSON, neste formato:
{
  "summary": "2-3 frases sobre o dia desportivo de hoje e o racional geral das escolhas",
  "picks": [
    {
      "sport": "Futebol",
      "competition": "nome da competição",
      "match": "Equipa A vs Equipa B",
      "kickoffLisbon": "HH:MM",
      "market": "mercado",
      "selection": "a escolha concreta",
      "approxOdd": 1.85,
      "confidence": 3,
      "rationale": "justificação curta"
    }
  ]
}
"confidence" é um inteiro de 1 (arriscado) a 5 (forte). "kickoffLisbon" é a hora em Lisboa.`;

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.4,
      // Sem "thinking": corta a latência para caber no timeout da função
      // serverless (a qualidade chega perfeitamente para picks diários).
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = (response as any).text ?? "";
  return sanitizeContent(extractJson(String(text)));
}

// ============================================================
// GET /api/insights -> dicas de hoje (cache diária; gera na 1.ª chamada)
// ============================================================
router.get("/", async (_req: AuthenticatedRequest, res) => {
  const date = todayInLisbon();
  try {
    const cached = await pool.query(
      "SELECT content, created_at FROM daily_insights WHERE insight_date = $1",
      [date]
    );
    if (cached.rows.length > 0) {
      res.json({ date, generatedAt: cached.rows[0].created_at, ...cached.rows[0].content });
      return;
    }

    const content = await generateInsights(date);

    // Corrida entre instâncias serverless: o UNIQUE decide; quem perde relê.
    await pool.query(
      `INSERT INTO daily_insights (insight_date, content, model)
       VALUES ($1, $2, $3)
       ON CONFLICT (insight_date) DO NOTHING`,
      [date, JSON.stringify(content), MODEL]
    );
    const final = await pool.query(
      "SELECT content, created_at FROM daily_insights WHERE insight_date = $1",
      [date]
    );
    const row = final.rows[0];
    res.json({ date, generatedAt: row?.created_at ?? new Date().toISOString(), ...(row?.content ?? content) });
  } catch (error: any) {
    console.error("Erro ao gerar insights:", error);
    res.status(503).json({
      error: "Não foi possível gerar as dicas de hoje. Tenta novamente dentro de momentos.",
    });
  }
});

export default router;

// routes/insightsRoutes.ts
// AI Insights diários: dicas de picks para os jogos DO DIA, geradas pelo
// Gemini com grounding no Google Search (o modelo pesquisa os jogos e odds
// reais antes de escrever — sem grounding alucinaria jogos inexistentes).
//
// Custo controlado: gera-se UMA vez por dia e guarda-se em daily_insights;
// todos os utilizadores leem a mesma linha. Pedidos concorrentes no primeiro
// acesso do dia são resolvidos pelo UNIQUE(insight_date) + ON CONFLICT.
//
// A geração é pré-aquecida por um cron diário (ver vercel.json + /cron aqui),
// para nenhum utilizador apanhar a espera da geração.

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getGeminiClient, extractJson } from "../lib/gemini.js";

const router = Router();

// O modelo é imposto pelo plano, não por preferência: no free tier o grounding
// do Google Search só tem quota no gemini-2.5-flash — os modelos mais recentes
// (3.x) devolvem 429 assim que a pesquisa é ativada, e sem pesquisa o modelo
// inventaria jogos. Reavaliar se/quando houver faturação ativa.
const MODEL = "gemini-2.5-flash";
const MAX_PICKS = 12;

// Uma chamada estabiliza em ~13s; com maxDuration=60 na Vercel, três
// tentativas cabem com folga. O orçamento trava tentativas que arrisquem
// passar do limite da função.
const MAX_ATTEMPTS = 3;
const TIME_BUDGET_MS = 40_000;

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

function buildPrompt(dateLisbon: string, insistOnJson: boolean) {
  // Nas repetições reforçamos a instrução de formato: a falha mais comum é o
  // modelo devolver só a prosa da pesquisa, sem o JSON.
  const insist = insistOnJson
    ? `\n\nATENÇÃO: a tua resposta anterior não continha JSON válido. Responde SÓ com o objeto JSON, a começar em { e a terminar em }. Sem texto antes ou depois, sem blocos de código.`
    : "";

  return `
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
"confidence" é um inteiro de 1 (arriscado) a 5 (forte). "kickoffLisbon" é a hora em Lisboa.${insist}`;
}

/** Uma chamada ao modelo. Devolve o texto bruto. */
async function callModel(prompt: string): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.4,
      // Sem "thinking" de propósito: medido no free tier, o raciocínio ligado
      // devolve 503 ("high demand") de forma consistente com o grounding
      // ativo, enquanto sem ele a chamada estabiliza em ~13s. A folga dos 60s
      // é gasta em REPETIÇÕES, que valem mais aqui do que thinking.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return String((response as any).text ?? "");
}

/**
 * Gera as dicas com repetições. Cobre as duas falhas reais e observadas:
 * o 503 "high demand" da API, e a resposta sem JSON (o grounding impede
 * responseSchema, por isso o formato nunca é garantido no pedido).
 */
async function generateInsights(dateLisbon: string) {
  const started = Date.now();
  let lastError: unknown = new Error("Falha desconhecida ao gerar insights.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Nunca começar uma tentativa que arrisque estourar o limite da função.
    if (attempt > 1 && Date.now() - started > TIME_BUDGET_MS) break;

    try {
      const text = await callModel(buildPrompt(dateLisbon, attempt > 1));
      return sanitizeContent(extractJson(text));
    } catch (err) {
      lastError = err;
      console.warn(
        `[insights] tentativa ${attempt}/${MAX_ATTEMPTS} falhou:`,
        (err as Error)?.message
      );
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Devolve a linha de hoje, gerando-a se ainda não existir. Partilhada pelo
 * pedido do utilizador e pelo cron — o cron aquece a cache de madrugada e o
 * utilizador normal só lê; se o cron falhar, o primeiro pedido ainda gera.
 */
async function ensureInsightsForDate(date: string) {
  const cached = await pool.query(
    "SELECT content, created_at FROM daily_insights WHERE insight_date = $1",
    [date]
  );
  if (cached.rows.length > 0) {
    return { row: cached.rows[0], generated: false };
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
  return {
    row: final.rows[0] ?? { content, created_at: new Date().toISOString() },
    generated: true,
  };
}

// ============================================================
// GET /api/insights/cron -> pré-gera as dicas do dia (Vercel Cron)
// Fica ANTES do authenticateToken: não há utilizador, a autenticação é o
// segredo partilhado que a Vercel envia em Authorization: Bearer.
// ============================================================
router.get("/cron", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  // Fail closed: sem segredo configurado, ninguém dispara a geração.
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Não autorizado." });
    return;
  }

  const date = todayInLisbon();
  try {
    const { generated } = await ensureInsightsForDate(date);
    res.json({ date, generated, model: MODEL });
  } catch (error: any) {
    console.error("[insights] cron falhou:", error);
    res.status(503).json({ date, error: error?.message || "Falha ao gerar." });
  }
});

router.use(authenticateToken);

// ============================================================
// GET /api/insights -> dicas de hoje (lê a cache; gera se o cron não correu)
// ============================================================
router.get("/", async (_req: AuthenticatedRequest, res) => {
  const date = todayInLisbon();
  try {
    const { row } = await ensureInsightsForDate(date);
    res.json({
      date,
      generatedAt: row?.created_at ?? new Date().toISOString(),
      ...row?.content,
    });
  } catch (error: any) {
    console.error("Erro ao gerar insights:", error);
    res.status(503).json({
      error: "Não foi possível gerar as dicas de hoje. Tenta novamente dentro de momentos.",
    });
  }
});

export default router;

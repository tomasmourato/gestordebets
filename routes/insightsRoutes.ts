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

// ============================================================
// Avaliação de apostas (print e/ou texto) -> Valor Esperado
// O modelo pesquisa e estima a PROBABILIDADE justa; os números (EV, prob.
// implícita, edge, odd justa, Kelly) são calculados AQUI, deterministicamente,
// porque os modelos erram aritmética. Sem cache — cada aposta é única.
// ============================================================
const EVAL_MAX_ATTEMPTS = 2;
const EVAL_TIME_BUDGET_MS = 45_000;
const EVAL_MAX_BETS = 8;

interface EvaluatedLeg {
  event: string;
  selection: string;
  estimatedProbability: number;
}

function buildEvalPrompt(dateLisbon: string, userText: string, hasImage: boolean, insistOnJson: boolean): string {
  const insist = insistOnJson
    ? `\n\nATENÇÃO: a resposta anterior não continha JSON válido. Responde SÓ com o objeto JSON, a começar em { e a terminar em }. Sem texto antes ou depois, sem blocos de código.`
    : "";

  const sources =
    hasImage && userText
      ? "no print do boletim (imagem) e na descrição escrita abaixo"
      : hasImage
        ? "no print do boletim fornecido (imagem)"
        : "na descrição escrita abaixo";

  const textBlock = userText ? `\n\nDescrição do utilizador:\n"""\n${userText}\n"""` : "";

  return `Hoje é ${dateLisbon} (fuso Europe/Lisbon). És um analista quantitativo de apostas desportivas — rigoroso, calibrado e prudente — a escrever em português de Portugal.

TAREFA: avaliar a(s) aposta(s) descrita(s) ${sources} e determinar se têm VALOR ESPERADO positivo (se a odd oferecida é generosa face à probabilidade real).${textBlock}

PASSO 1 — IDENTIFICAR. Para cada aposta extrai: desporto, competição, evento (equipas/atletas), mercado, a seleção escolhida, a casa de apostas e a ODD DECIMAL oferecida.${hasImage ? " Lê estes dados diretamente do boletim na imagem." : ""} Se a odd não estiver indicada, estima a odd de mercado atual a partir da pesquisa. Se a aposta juntar várias seleções (acumulador/múltipla), classifica-a como "MULTIPLA" e lista cada perna em "legs".

PASSO 2 — PESQUISAR (USA A PESQUISA GOOGLE, obrigatório). Para cada evento, reúne informação ATUAL e factual: se o jogo ainda não começou (data/hora); forma recente; confrontos diretos (H2H); lesões, castigos e ausências; onze/rotação provável; casa vs fora; motivação (classificação, objetivos, calendário/fadiga); condições relevantes (piso, clima); e as ODDS DE MERCADO atuais em várias casas europeias para aferires o consenso. Usa apenas o que confirmares na pesquisa — NÃO inventes jogos, equipas, lesões nem odds. Se o evento já terminou ou não existe, di-lo na justificação e baixa a confiança.

PASSO 3 — ESTIMAR A PROBABILIDADE justa da seleção ("estimatedProbability", decimal entre 0.02 e 0.98), com honestidade e calibração:
- Ancora na probabilidade implícita do consenso de mercado (a odd de mercado, já descontada a margem da casa) e ajusta com a tua análise. Afasta-te do mercado apenas quando a pesquisa o justificar claramente.
- Quando a informação é escassa, aproxima-te da probabilidade implícita e baixa a confiança.
- Evita excesso de confiança. Para múltiplas, estima a probabilidade combinada tendo em conta a correlação entre pernas.

NÃO calcules o Valor Esperado, a probabilidade implícita nem a odd justa — só preciso da "offeredOdd" e da tua "estimatedProbability"; os cálculos são feitos à parte.

Para cada aposta escreve ainda: uma "justification" clara e honesta (2 a 4 frases), 2 a 5 "keyFactors" (os fatores que mais pesam) e 1 a 4 "risks" (incertezas ou cenários adversos).

Responde SÓ com JSON válido, a começar em { e a terminar em }, sem texto à volta nem blocos de código, neste formato:
{
  "summary": "avaliação geral em 1 a 2 frases",
  "bets": [
    {
      "type": "SIMPLES",
      "sport": "Futebol",
      "competition": "Liga Portugal",
      "event": "Equipa A vs Equipa B",
      "market": "Resultado Final",
      "selection": "Equipa A",
      "bookmaker": "Betano",
      "offeredOdd": 2.10,
      "estimatedProbability": 0.50,
      "confidence": 3,
      "justification": "...",
      "keyFactors": ["...", "..."],
      "risks": ["..."],
      "legs": [{ "event": "Equipa A vs Equipa B", "selection": "Equipa A", "estimatedProbability": 0.50 }]
    }
  ]
}
"confidence" é um inteiro de 1 (muito incerto) a 5 (muito seguro). Inclui "legs" apenas em múltiplas.${insist}`;
}

async function callEvalModel(prompt: string, imageBase64?: string): Promise<string> {
  const ai = getGeminiClient();
  const parts: any[] = [];
  if (imageBase64) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    parts.push({
      inlineData: {
        mimeType: match ? match[1] : "image/png",
        data: match ? match[2] : imageBase64,
      },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return String((response as any).text ?? "");
}

const clampProb = (p: number) => Math.min(0.98, Math.max(0.02, p));

/**
 * Normaliza o JSON do modelo e calcula os números no servidor a partir de
 * (offeredOdd, estimatedProbability): EV por unidade, prob. implícita, edge,
 * odd justa, Kelly e um veredito. Nada de aritmética confiada ao modelo.
 */
function sanitizeEvaluation(raw: any): { summary: string; bets: any[] } {
  const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const clipArr = (v: unknown, maxItems: number, maxLen: number) =>
    (Array.isArray(v) ? v : [])
      .map((x) => clip(x, maxLen))
      .filter(Boolean)
      .slice(0, maxItems);

  const bets = (Array.isArray(raw?.bets) ? raw.bets : [])
    .map((b: any) => {
      const offeredOdd = Number(b?.offeredOdd);
      const prob = clampProb(Number(b?.estimatedProbability));
      if (!Number.isFinite(offeredOdd) || offeredOdd <= 1 || !Number.isFinite(prob)) return null;

      const impliedProbability = 1 / offeredOdd;
      const fairOdd = 1 / prob;
      const expectedValue = prob * offeredOdd - 1; // lucro médio por 1 unidade apostada
      const edge = prob - impliedProbability; // vantagem sobre o mercado
      // Kelly completo: fração do banco que maximiza o crescimento (só se +EV).
      const kelly = offeredOdd > 1 ? (prob * offeredOdd - 1) / (offeredOdd - 1) : 0;

      let verdict: "VALOR" | "JUSTA" | "SEM_VALOR";
      let verdictLabel: string;
      if (expectedValue >= 0.05) {
        verdict = "VALOR";
        verdictLabel = "Valor esperado positivo";
      } else if (expectedValue >= -0.02) {
        verdict = "JUSTA";
        verdictLabel = "Perto do valor justo";
      } else {
        verdict = "SEM_VALOR";
        verdictLabel = "Valor esperado negativo";
      }

      const legs: EvaluatedLeg[] = (Array.isArray(b?.legs) ? b.legs : [])
        .map((l: any) => ({
          event: clip(l?.event, 120),
          selection: clip(l?.selection, 120),
          estimatedProbability: clampProb(Number(l?.estimatedProbability)),
        }))
        .filter((l: EvaluatedLeg) => l.event || l.selection)
        .slice(0, 12);

      return {
        type: b?.type === "MULTIPLA" ? "MULTIPLA" : "SIMPLES",
        sport: clip(b?.sport, 40),
        competition: clip(b?.competition, 90),
        event: clip(b?.event, 140),
        market: clip(b?.market, 90),
        selection: clip(b?.selection, 140),
        bookmaker: clip(b?.bookmaker, 40),
        offeredOdd: Number(offeredOdd.toFixed(2)),
        estimatedProbability: Number(prob.toFixed(4)),
        impliedProbability: Number(impliedProbability.toFixed(4)),
        fairOdd: Number(fairOdd.toFixed(2)),
        expectedValue: Number(expectedValue.toFixed(4)),
        expectedValuePct: Number((expectedValue * 100).toFixed(1)),
        edgePct: Number((edge * 100).toFixed(1)),
        kellyFraction: Number(Math.max(0, kelly).toFixed(3)),
        verdict,
        verdictLabel,
        confidence: Math.min(5, Math.max(1, Math.round(Number(b?.confidence) || 3))),
        justification: clip(b?.justification, 700),
        keyFactors: clipArr(b?.keyFactors, 5, 200),
        risks: clipArr(b?.risks, 4, 200),
        legs: legs.length > 0 ? legs : undefined,
      };
    })
    .filter((b: any) => b && b.selection && b.event)
    .slice(0, EVAL_MAX_BETS);

  if (bets.length === 0) throw new Error("O modelo não conseguiu avaliar nenhuma aposta.");
  return { summary: clip(raw?.summary, 600), bets };
}

async function evaluateBet(input: { imageBase64?: string; text: string }) {
  const started = Date.now();
  let lastError: unknown = new Error("Falha desconhecida ao avaliar a aposta.");

  for (let attempt = 1; attempt <= EVAL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1 && Date.now() - started > EVAL_TIME_BUDGET_MS) break;
    try {
      const prompt = buildEvalPrompt(todayInLisbon(), input.text, Boolean(input.imageBase64), attempt > 1);
      const text = await callEvalModel(prompt, input.imageBase64);
      return sanitizeEvaluation(extractJson(text));
    } catch (err) {
      lastError = err;
      console.warn(`[insights] avaliação tentativa ${attempt}/${EVAL_MAX_ATTEMPTS} falhou:`, (err as Error)?.message);
      if (attempt < EVAL_MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 1500 * attempt));
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

// ============================================================
// POST /api/insights/evaluate -> avalia uma aposta (print e/ou texto)
// Sem cache: cada aposta é única. Rate limit herdado de /api/insights.
// ============================================================
router.post("/evaluate", async (req: AuthenticatedRequest, res) => {
  const { imageBase64, text } = req.body ?? {};
  const hasImage = typeof imageBase64 === "string" && imageBase64.trim().length > 0;
  const cleanText = typeof text === "string" ? text.trim().slice(0, 2000) : "";

  if (!hasImage && !cleanText) {
    res.status(400).json({ error: "Fornece um print do boletim ou uma descrição da aposta." });
    return;
  }

  try {
    const result = await evaluateBet({ imageBase64: hasImage ? imageBase64 : undefined, text: cleanText });
    res.json({ evaluatedAt: new Date().toISOString(), ...result });
  } catch (error: any) {
    console.error("[insights] avaliação falhou:", error?.message);
    res.status(503).json({
      error: "Não foi possível avaliar a aposta agora. Tenta novamente dentro de momentos.",
    });
  }
});

export default router;

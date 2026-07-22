// lib/gemini.ts
// Cliente Gemini partilhado (lazy). Usado pelas rotas que chamam a API do
// Google (parse de screenshots em server.ts, AI Insights em insightsRoutes).

import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is missing.");
    client = new GoogleGenAI({ apiKey: key });
  }
  return client;
}

/**
 * Extrai o primeiro objeto JSON de uma resposta de texto do modelo.
 *
 * Tem de ser tolerante: com o grounding do Google Search ativo, a API NÃO
 * aceita `responseMimeType: "application/json"` nem `responseSchema`
 * ("Tool use with a response mime type is unsupported"), por isso não há
 * forma de garantir JSON no pedido — o modelo às vezes envolve o JSON em
 * fences, precede-o de prosa, ou deixa vírgulas finais.
 */
export function extractJson(text: string): any {
  const raw = String(text ?? "").trim();
  if (!raw) throw new Error("A resposta do modelo veio vazia.");

  // 1) Resposta já é JSON puro.
  const direct = tryParse(raw);
  if (direct !== undefined) return direct;

  // 2) Bloco em fences (```json ... ``` ou ``` ... ```).
  const fenced = raw.replace(/```json/gi, "```").match(/```([\s\S]*?)```/);
  if (fenced) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== undefined) return parsed;
  }

  // 3) Maior fatia entre a primeira { e a última } (prosa à volta do JSON).
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const parsed = tryParse(raw.slice(start, end + 1));
    if (parsed !== undefined) return parsed;
  }

  throw new Error("A resposta do modelo não contém JSON.");
}

/** Faz parse tolerando vírgulas finais; devolve undefined se não for JSON. */
function tryParse(candidate: string): any {
  try {
    return JSON.parse(candidate);
  } catch {
    try {
      // Vírgula antes de } ou ] é o erro de sintaxe mais comum dos modelos.
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return undefined;
    }
  }
}

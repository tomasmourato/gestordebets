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

/** Extrai o primeiro objeto JSON de uma resposta de texto do modelo
 *  (remove fences ```json e texto à volta). */
export function extractJson(text: string): any {
  const cleaned = text.replace(/```json/gi, "```").trim();
  const fenced = cleaned.match(/```([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : cleaned;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("A resposta do modelo não contém JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

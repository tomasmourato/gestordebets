// src/lib/screenshotMatch.ts
// Normalização das respostas da IA do importador de screenshots — partilhada
// entre o ScreenshotImporter desktop e o ecrã de importação mobile.

import { BetStatus } from "../types";
import { AVAILABLE_BOOKMAKERS } from "../utils";
import { normalizeBetStatus } from "./betStatus";

/**
 * A IA devolve o nome da casa de apostas em texto livre ("Placard.pt",
 * "BETANO", …). Tentamos casá-lo com a lista conhecida para pré-selecionar
 * a opção certa; se falhar, cai em "Outra".
 */
export function matchBookmaker(raw?: string): string {
  if (!raw || !raw.trim()) return "Outra";
  const normalized = raw.trim().toLowerCase();

  const exact = AVAILABLE_BOOKMAKERS.find((b) => b.toLowerCase() === normalized);
  if (exact) return exact;

  // Casamento parcial (ex.: "Placard.pt" -> "Placard"), evitando falsos
  // positivos com nomes demasiado curtos.
  if (normalized.length >= 3) {
    const partial = AVAILABLE_BOOKMAKERS.find(
      (b) => b !== "Outra" && (normalized.includes(b.toLowerCase()) || b.toLowerCase().includes(normalized)),
    );
    if (partial) return partial;
  }

  return "Outra";
}

/** Valida o estado devolvido pela IA; na dúvida, a aposta fica por liquidar. */
export function matchStatus(raw?: string): BetStatus {
  return normalizeBetStatus(raw);
}

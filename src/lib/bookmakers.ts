// src/lib/bookmakers.ts
// Registo de casas de apostas com os seus defaults de freebet.
//
// IMPORTANTE (ver PLAN.md §F3): os tipos de freebet por casa são DEFAULTS,
// não verdades absolutas — vieram de fontes de afiliados pouco fiáveis e
// misturadas PT/BR. SNR (Stake Not Returned) é o padrão da indústria e o
// fallback seguro; o Betclic é SR por decisão/dados reais. O utilizador pode
// sempre corrigir o tipo em cada aposta.

import { FreebetType } from "../types";

export interface Bookmaker {
  id: string;
  name: string;
  /** Tipo de freebet por omissão desta casa. */
  defaultFreebetType: FreebetType;
  /** Se as freebets desta casa permitem cashout (Placard, por ex., não). */
  allowsFreebetCashout: boolean;
}

export const BOOKMAKERS: Bookmaker[] = [
  { id: "betano", name: "Betano", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "betclic", name: "Betclic", defaultFreebetType: "SR", allowsFreebetCashout: true },
  { id: "placard", name: "Placard", defaultFreebetType: "SNR", allowsFreebetCashout: false },
  { id: "bwin", name: "Bwin", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "solverde", name: "Solverde", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "nossa-aposta", name: "Nossa Aposta", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "casino-portugal", name: "Casino Portugal", defaultFreebetType: "SNR", allowsFreebetCashout: true },
  { id: "placard-pt", name: "Placard.pt", defaultFreebetType: "SNR", allowsFreebetCashout: false },
  { id: "outra", name: "Outra", defaultFreebetType: "SNR", allowsFreebetCashout: true },
];

/** Nomes para dropdowns (mantém compatibilidade com AVAILABLE_BOOKMAKERS). */
export const AVAILABLE_BOOKMAKERS = BOOKMAKERS.map((b) => b.name);

export function bookmakerByName(name: string | undefined): Bookmaker | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return BOOKMAKERS.find((b) => b.name.toLowerCase() === n);
}

/** Tipo de freebet por omissão para uma casa (SNR se desconhecida). */
export function defaultFreebetTypeFor(name: string | undefined): FreebetType {
  return bookmakerByName(name)?.defaultFreebetType ?? "SNR";
}

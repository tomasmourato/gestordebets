// src/hooks/useLoadingSteps.ts
// Passos de progresso para as esperas longas da IA (avaliação de apostas e
// dicas do dia). O servidor não faz streaming — a chamada ao Gemini é um
// pedido único — por isso o progresso é TEMPORAL (estimado a partir dos tempos
// típicos), não real. Serve para o utilizador perceber o que está a acontecer
// e que a app não bloqueou. Partilhado entre o AIInsights (desktop) e o
// MobileInsights para os dois mostrarem exatamente o mesmo texto.

import { useEffect, useState } from "react";

export interface LoadingStep {
  /** Segundos decorridos a partir dos quais este passo passa a ser o atual. */
  after: number;
  label: string;
}

/** Passos da avaliação de uma aposta (varia com a existência de print). */
export const evalStepsFor = (hasImage: boolean): LoadingStep[] => [
  { after: 0, label: hasImage ? "A ler o print do boletim…" : "A interpretar a descrição da aposta…" },
  { after: 4, label: "A identificar evento, mercado e odd…" },
  { after: 9, label: "A pesquisar forma recente e confrontos diretos…" },
  { after: 15, label: "A verificar lesões, castigos e onze provável…" },
  { after: 22, label: "A comparar as odds de mercado entre casas…" },
  { after: 30, label: "A estimar a probabilidade justa…" },
  { after: 38, label: "A calcular o Valor Esperado e o edge…" },
  { after: 46, label: "Quase lá — a finalizar a análise…" },
];

/** Passos da geração das dicas diárias. */
export const PICKS_STEPS: LoadingStep[] = [
  { after: 0, label: "A preparar a análise do dia…" },
  { after: 4, label: "A pesquisar os jogos de hoje…" },
  { after: 10, label: "A recolher as odds aproximadas…" },
  { after: 18, label: "A avaliar forma, lesões e confrontos…" },
  { after: 27, label: "A selecionar os melhores picks…" },
  { after: 36, label: "A escrever as justificações…" },
  { after: 45, label: "Quase lá — a finalizar…" },
];

/**
 * Devolve o passo atual e os segundos decorridos enquanto `active` for true.
 * Reinicia sempre que a espera recomeça.
 */
export function useLoadingSteps(active: boolean, steps: LoadingStep[]) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  let index = 0;
  for (let i = 0; i < steps.length; i++) {
    if (elapsed >= steps[i].after) index = i;
  }

  return { index, elapsed, label: steps[index]?.label ?? "" };
}

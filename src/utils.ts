import { Bet, BetStatus, DashboardStats, FreebetType, Selection } from "./types";

// Safe number converter to prevent crashes from undefined/null/non-numeric properties
export function safeNum(value: any, defaultValue = 0): number {
  if (value === undefined || value === null) return defaultValue;
  const num = typeof value === "number" ? value : parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

// Calculation formulas for individual bets.
// cashoutReturn: só usado quando status === "CASHOUT" — é o valor pelo qual a
// aposta foi encerrada antecipadamente (arbitrário, não deriva de stake*odd).
export function calculateBetReturnAndProfit(
  stake: number,
  odd: number,
  status: BetStatus,
  isFreebet: boolean,
  cashoutReturn?: number,
  freebetType?: FreebetType
): { potentialReturn: number; finalReturn: number; netProfit: number } {

  // 1. Calculate Potential Return (For freebets, profit is stake * odd, so potential is stake * odd)
  let potentialReturn = stake * odd;

  // 2. Calculate Final Return and Net Profit based on actual Status
  let finalReturn = 0;
  let netProfit = 0;

  if (status === "POR_LIQUIDAR") {
    return {
      potentialReturn: Number(potentialReturn.toFixed(2)),
      finalReturn: 0,
      netProfit: 0,
    };
  }

  // Cashout: retorno definido pelo utilizador/casa, não calculado a partir da
  // odd. Numa freebet a stake não era dinheiro real, por isso não se subtrai.
  if (status === "CASHOUT") {
    const co = Number(cashoutReturn) || 0;
    return {
      potentialReturn: Number(potentialReturn.toFixed(2)),
      finalReturn: Number(co.toFixed(2)),
      netProfit: Number((co - (isFreebet ? 0 : stake)).toFixed(2)),
    };
  }

  if (!isFreebet) {
    switch (status) {
      case "GANHA":
        finalReturn = stake * odd;
        netProfit = finalReturn - stake;
        break;
      case "PERDIDA":
        finalReturn = 0;
        netProfit = -stake;
        break;
      case "ANULADA":
        finalReturn = stake;
        netProfit = 0;
        break;
      case "MEIO_GANHA":
        // Half of the bet is won, half is refunded
        finalReturn = (stake / 2) * odd + (stake / 2);
        netProfit = finalReturn - stake;
        break;
      case "MEIO_PERDIDA":
        // Half of the bet is lost, half is refunded
        finalReturn = stake / 2;
        netProfit = finalReturn - stake;
        break;
    }
  } else {
    // Freebet: nenhum dinheiro real é arriscado como stake.
    //  SR  (Stake Returned)     -> ganho = odd * stake     (variante Betclic)
    //  SNR (Stake Not Returned) -> ganho = (odd - 1) * stake  (padrão da indústria)
    // Por omissão SR, para preservar o comportamento histórico da app.
    const isSR = (freebetType ?? "SR") === "SR";
    switch (status) {
      case "GANHA":
        finalReturn = isSR ? stake * odd : (odd - 1) * stake;
        netProfit = finalReturn; // sem cash arriscado, o lucro é o retorno
        break;
      case "PERDIDA":
        finalReturn = 0;
        netProfit = 0; // Free money lost, no cash impact
        break;
      case "ANULADA":
        finalReturn = stake; // Returned freebet
        netProfit = 0; // 0 cash profit/loss
        break;
      case "MEIO_GANHA":
        finalReturn = (stake / 2) * odd + (stake / 2);
        netProfit = finalReturn;
        break;
      case "MEIO_PERDIDA":
        finalReturn = stake / 2;
        netProfit = finalReturn;
        break;
    }
  }

  return {
    potentialReturn: Number(potentialReturn.toFixed(2)),
    finalReturn: Number(finalReturn.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
  };
}

// Compute Aggregate Statistics
export function calculateDashboardStats(bets: Bet[]): DashboardStats {
  let totalBets = bets.length;
  let pendingBets = 0;
  let wonBets = 0;
  let lostBets = 0;
  let refundedBets = 0;
  let halfWonBets = 0;
  let halfLostBets = 0;

  let totalStake = 0;
  let totalReturn = 0;
  let netProfit = 0;

  for (const bet of bets) {
    if (bet.status === "POR_LIQUIDAR") {
      pendingBets++;
      continue; // Pending bets do not affect current settled profit/stake stats
    }

    // Settled bets stats
    if (!bet.isFreebet) {
      totalStake += safeNum(bet.stake);
    }
    
    totalReturn += safeNum(bet.finalReturn);
    netProfit += safeNum(bet.netProfit);

    switch (bet.status) {
      case "GANHA":
        wonBets++;
        break;
      case "PERDIDA":
        lostBets++;
        break;
      case "ANULADA":
        refundedBets++;
        break;
      case "MEIO_GANHA":
        halfWonBets++;
        break;
      case "MEIO_PERDIDA":
        halfLostBets++;
        break;
    }
  }

  const settledBetsCount = wonBets + lostBets + refundedBets + halfWonBets + halfLostBets;
  
  // Win Rate = (Ganha + Meio Ganha * 0.5) / (Settled bets excluding refunded bets) * 100
  // Or simple version: (Won + Half Won * 0.5) / Settled bets
  const rateDivisor = settledBetsCount - refundedBets;
  const winRate = rateDivisor > 0 
    ? ((wonBets + halfWonBets * 0.5) / rateDivisor) * 100 
    : settledBetsCount > 0 
      ? (wonBets / settledBetsCount) * 100 
      : 0;

  // ROI = (netProfit / totalStake) * 100
  const roi = totalStake > 0 ? (netProfit / totalStake) * 100 : 0;
  
  // Yield is netProfit over totalStake
  const yieldVal = totalStake > 0 ? (netProfit / totalStake) * 100 : 0;

  return {
    totalBets,
    pendingBets,
    wonBets,
    lostBets,
    refundedBets,
    halfWonBets,
    halfLostBets,
    totalStake: Number(totalStake.toFixed(2)),
    totalReturn: Number(totalReturn.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    yield: Number(yieldVal.toFixed(2)),
    winRate: Number(winRate.toFixed(2)),
  };
}

// Mock Data generators
export const INITIAL_BETS: Bet[] = [
  {
    id: "bet-1",
    type: "SIMPLES",
    status: "GANHA",
    selections: [
      {
        id: "sel-1",
        event: "Portugal vs Espanha",
        market: "Resultado Final",
        choice: "Portugal",
        odd: 2.15
      }
    ],
    stake: 10.00,
    odd: 2.15,
    isFreebet: false,
    potentialReturn: 21.50,
    finalReturn: 21.50,
    netProfit: 11.50,
    bookmaker: "Betano",
    dateTime: "2026-06-20 19:45",
    notes: "Aposta de confiança baseada nas últimas exibições de Portugal.",
    origin: "MANUAL"
  },
  {
    id: "bet-2",
    type: "MULTIPLA",
    status: "PERDIDA",
    selections: [
      {
        id: "sel-2a",
        event: "Benfica vs Porto",
        market: "Total de Golos",
        choice: "Mais de 2.5",
        odd: 1.80
      },
      {
        id: "sel-2b",
        event: "Sporting vs Braga",
        market: "Ambas Equipas Marcam",
        choice: "Sim",
        odd: 1.70
      }
    ],
    stake: 5.00,
    odd: 3.06,
    isFreebet: false,
    potentialReturn: 15.30,
    finalReturn: 0.00,
    netProfit: -5.00,
    bookmaker: "Betclic",
    dateTime: "2026-06-21 17:00",
    notes: "Múltipla clássica do campeonato português. Braga não marcou e estragou o boletim.",
    origin: "MANUAL"
  },
  {
    id: "bet-3",
    type: "SIMPLES",
    status: "GANHA",
    selections: [
      {
        id: "sel-3",
        event: "Alcaraz vs Djokovic",
        market: "Vencedor do Encontro",
        choice: "Alcaraz",
        odd: 1.95
      }
    ],
    stake: 10.00,
    odd: 1.95,
    isFreebet: true,
    potentialReturn: 19.50, // stake * odd = 19.50
    finalReturn: 19.50,
    netProfit: 19.50,
    bookmaker: "Betano",
    dateTime: "2026-06-25 15:30",
    notes: "Usada uma freebet de boas-vindas. Excelente vitória do espanhol.",
    origin: "SCREENSHOT",
    metadata: {
      screenshotConfidence: 0.95,
      detectedFields: ["bookmaker", "odd", "stake", "potentialReturn", "event"],
      correctedFields: []
    }
  },
  {
    id: "bet-4",
    type: "SIMPLES",
    status: "ANULADA",
    selections: [
      {
        id: "sel-4",
        event: "Lakers vs Celtics",
        market: "Vencedor (Incl. Prolongamento)",
        choice: "Lakers",
        odd: 1.85
      }
    ],
    stake: 15.00,
    odd: 1.85,
    isFreebet: false,
    potentialReturn: 27.75,
    finalReturn: 15.00,
    netProfit: 0.00,
    bookmaker: "Placard",
    dateTime: "2026-06-29 02:00",
    notes: "Jogo cancelado/adiado devido a tempestade.",
    origin: "MANUAL"
  },
  {
    id: "bet-5",
    type: "MULTIPLA",
    status: "GANHA",
    selections: [
      {
        id: "sel-5a",
        event: "Real Madrid vs Man City",
        market: "Ambas Equipas Marcam",
        choice: "Sim",
        odd: 1.55
      },
      {
        id: "sel-5b",
        event: "Arsenal vs Bayern",
        market: "Total de Golos",
        choice: "Mais de 1.5",
        odd: 1.30
      },
      {
        id: "sel-5c",
        event: "PSG vs Dortmund",
        market: "Resultado Final",
        choice: "PSG",
        odd: 1.65
      }
    ],
    stake: 20.00,
    odd: 3.32,
    isFreebet: true,
    potentialReturn: 66.40, // stake * odd = 66.40
    finalReturn: 66.40,
    netProfit: 66.40,
    bookmaker: "Betano",
    dateTime: "2026-07-02 20:00",
    notes: "Múltipla da Champions League usando uma aposta grátis.",
    origin: "SCREENSHOT",
    metadata: {
      screenshotConfidence: 0.92,
      detectedFields: ["bookmaker", "odd", "stake", "potentialReturn", "selections"],
      correctedFields: ["potentialReturn"]
    }
  },
  {
    id: "bet-6",
    type: "SIMPLES",
    status: "POR_LIQUIDAR",
    selections: [
      {
        id: "sel-6",
        event: "Portugal vs França",
        market: "Resultado Final",
        choice: "Empate",
        odd: 3.20
      }
    ],
    stake: 10.00,
    odd: 3.20,
    isFreebet: false,
    potentialReturn: 32.00,
    finalReturn: 0.00,
    netProfit: 0.00,
    bookmaker: "Betclic",
    dateTime: "2026-07-08 20:00", // Future bet (Tomorrow)
    notes: "Jogo grande nos quartos de final. Prevejo um jogo muito equilibrado a acabar empatado nos 90 minutos.",
    origin: "MANUAL"
  },
  {
    id: "bet-7",
    type: "SIMPLES",
    status: "MEIO_GANHA",
    selections: [
      {
        id: "sel-7",
        event: "Leixões vs Penafiel",
        market: "Handicap Asiático",
        choice: "Leixões -0.25",
        odd: 2.00
      }
    ],
    stake: 10.00,
    odd: 2.00,
    isFreebet: false,
    potentialReturn: 20.00,
    finalReturn: 15.00, // stake/2 * odd + stake/2 = 5 * 2 + 5 = 15.00
    netProfit: 5.00,
    bookmaker: "Solverde",
    dateTime: "2026-07-04 11:00",
    notes: "Aposta no Leixões em casa. Venceram por 1 golo de diferença no final, o que deu meia ganha.",
    origin: "MANUAL"
  }
];

// A lista de casas vive agora no registo (src/lib/bookmakers.ts), que também
// guarda o tipo de freebet por omissão de cada uma. Reexportamos aqui para
// não partir os imports existentes.
export { AVAILABLE_BOOKMAKERS } from "./lib/bookmakers";

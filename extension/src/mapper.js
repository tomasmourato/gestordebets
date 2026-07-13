// mapper.js — traduz uma aposta da API do Betclic (begmedia) para o modelo
// Bet do BetTrackr. É um módulo ES puro (sem DOM), reutilizado pelo service
// worker.
//
// A função calc() é um espelho fiel de calculateBetReturnAndProfit em
// src/utils.ts — mantém a matemática de retorno/lucro idêntica à das apostas
// introduzidas à mão. Se a do app mudar, atualiza aqui também.

function calc(stake, odd, status, isFreebet) {
  const potentialReturn = stake * odd;
  let finalReturn = 0;
  let netProfit = 0;

  if (status === "POR_LIQUIDAR") {
    return { potentialReturn: round2(potentialReturn), finalReturn: 0, netProfit: 0 };
  }

  if (!isFreebet) {
    switch (status) {
      case "GANHA": finalReturn = stake * odd; netProfit = finalReturn - stake; break;
      case "PERDIDA": finalReturn = 0; netProfit = -stake; break;
      case "ANULADA": finalReturn = stake; netProfit = 0; break;
      case "MEIO_GANHA": finalReturn = (stake / 2) * odd + (stake / 2); netProfit = finalReturn - stake; break;
      case "MEIO_PERDIDA": finalReturn = stake / 2; netProfit = finalReturn - stake; break;
    }
  } else {
    switch (status) {
      case "GANHA": finalReturn = stake * odd; netProfit = finalReturn; break;
      case "PERDIDA": finalReturn = 0; netProfit = 0; break;
      case "ANULADA": finalReturn = stake; netProfit = 0; break;
      case "MEIO_GANHA": finalReturn = (stake / 2) * odd + (stake / 2); netProfit = finalReturn; break;
      case "MEIO_PERDIDA": finalReturn = stake / 2; netProfit = finalReturn; break;
    }
  }

  return {
    potentialReturn: round2(potentialReturn),
    finalReturn: round2(finalReturn),
    netProfit: round2(netProfit),
  };
}

function round2(n) {
  return Number(Number(n).toFixed(2));
}

// Betclic `result` -> BetTrackr BetStatus.
// NotSet/Win/Lose foram confirmados em dados reais. Os restantes são a melhor
// correspondência possível (ainda sem amostra real) e ficam registados em
// metadata para poderem ser corrigidos depois.
const STATUS_MAP = {
  NotSet: "POR_LIQUIDAR",
  Win: "GANHA",
  Lose: "PERDIDA",
  Void: "ANULADA",
  Refunded: "ANULADA",
  Canceled: "ANULADA",
  Cancelled: "ANULADA",
  Push: "ANULADA",
  Cashout: "MEIO_PERDIDA",
  CashedOut: "MEIO_PERDIDA",
  FullCashout: "MEIO_PERDIDA",
  PartialCashout: "MEIO_PERDIDA",
  HalfWin: "MEIO_GANHA",
  HalfWon: "MEIO_GANHA",
  HalfLose: "MEIO_PERDIDA",
  HalfLost: "MEIO_PERDIDA",
};

function mapStatus(result) {
  if (isCashoutResult(result)) return "MEIO_PERDIDA";
  return STATUS_MAP[result] ?? "POR_LIQUIDAR";
}

function isCashoutResult(result) {
  return typeof result === "string" && result.replace(/[\s_-]/g, "").toLowerCase().includes("cashout");
}

function amountOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "string"
    ? Number(value.trim().replace(",", "."))
    : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// O valor recebido num cashout não segue a fórmula stake × odd. A Betclic
// envia-o em `winnings`; `winning_details` é o fallback para respostas onde
// esse campo não vem preenchido.
function cashoutReturn(bet) {
  const winnings = amountOrNull(bet && bet.winnings);
  if (winnings !== null) return round2(winnings);

  const details = Array.isArray(bet && bet.winning_details) ? bet.winning_details : [];
  for (const type of ["TOTAL", "NET_STAKE_WIN", "NET_WIN"]) {
    const detail = details.find((item) => item && String(item.type).toUpperCase() === type);
    const amount = amountOrNull(detail && detail.amount);
    if (amount !== null) return round2(amount);
  }
  return 0;
}

// ISO UTC -> "YYYY-MM-DD HH:mm" na hora local do browser (o utilizador está
// em Portugal, por isso fica a hora a que a aposta foi realmente feita).
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Chave estável e única de cada aposta do Betclic. `id` vem sempre a -1, por
 * isso usamos `bet_reference`. É guardada em metadata.ref para a deduplicação.
 */
export function betclicRef(bet) {
  return bet && bet.bet_reference ? String(bet.bet_reference) : null;
}

/** Uma aposta do Betclic -> objeto Bet pronto para POST /api/bets/bulk. */
export function mapBet(bet) {
  const isCashout = isCashoutResult(bet.result);
  const isFreebet = bet.is_freebet === true;
  const stake = Number(bet.stake) || 0;
  const odd = Number(bet.odds) || 0;
  const ref = betclicRef(bet);
  const settledCashoutReturn = isCashout ? cashoutReturn(bet) : null;
  const status = isCashout
    ? settledCashoutReturn > stake ? "MEIO_GANHA" : "MEIO_PERDIDA"
    : mapStatus(bet.result);

  const calculated = calc(stake, odd, status, isFreebet);
  const potentialReturn = calculated.potentialReturn;
  const finalReturn = settledCashoutReturn ?? calculated.finalReturn;
  const netProfit = settledCashoutReturn === null
    ? calculated.netProfit
    : round2(isFreebet ? settledCashoutReturn : settledCashoutReturn - stake);

  const selections = (bet.bet_selections || []).map((s, i) => ({
    id: `betclic-${ref || "x"}-${i}`,
    event: s.match_label ?? "",
    market: s.market_label ?? "",
    choice: s.selection_label ?? "",
    odd: Number(s.odds) || 0,
    sport: s.sport_label || undefined,
    betType: s.market_label || undefined,
  }));

  return {
    type: bet.bet_type === "multiple" ? "MULTIPLA" : "SIMPLES",
    status,
    stake,
    odd,
    isFreebet,
    potentialReturn,
    finalReturn,
    netProfit,
    bookmaker: "Betclic",
    dateTime: formatDateTime(bet.placed_date_utc),
    // "CSV" é o balde de importação existente que o frontend reconhece; a
    // proveniência real fica em metadata.source. (Um origin "BETCLIC" próprio
    // seria uma alteração de 1 linha no app, se quiseres o badge.)
    origin: "CSV",
    selections,
    // metadata é guardada opaca pela API — serve de chave de deduplicação e
    // preserva os números originais do Betclic para refinamento futuro.
    metadata: {
      source: "betclic",
      ref,
      importKey: ref ? `betclic:${ref}` : null,
      originalStatus: bet.result ?? null,
      originalReturn: amountOrNull(bet.winnings),
      betclicResult: bet.result ?? null,
      betclicWinnings: amountOrNull(bet.winnings),
      isCashout,
      cashoutReturn: settledCashoutReturn,
      winningDetails: Array.isArray(bet.winning_details) ? bet.winning_details : [],
    },
  };
}

/** Lista de apostas do Betclic -> Bet[]. Ignora entradas sem bet_reference. */
export function mapBets(betclicBets) {
  return (betclicBets || []).filter(betclicRef).map(mapBet);
}

export const mapBetclicBet = mapBet;
export const mapBetclicBets = mapBets;

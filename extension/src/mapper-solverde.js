// mapper-solverde.js — traduz uma aposta da API interna da Solverde
// (sportswidget.solverde.pt/bets) para o modelo Bet do BetTrackr.
//
// A Solverde já devolve `funds.payoutNet` (retorno líquido de imposto de
// jogo) e `funds.payoutTax`, por isso não recalculamos o imposto — usamos
// os valores da própria casa e derivamos apenas o lucro líquido.
//
// Estados confirmados em dados reais: WON, LOST. Os restantes (cashout,
// anulada, meio-ganha/perdida, em aberto) são a melhor correspondência
// possível a partir do nome dos campos, sem amostra real — apostas com um
// estado "settled" desconhecido são ignoradas (unsupported) em vez de
// arriscar um resultado errado.

function round2(n) {
  return Number(Number(n || 0).toFixed(2));
}

function num(value) {
  const parsed = typeof value === "string" ? Number(value.trim().replace(",", ".")) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const STATUS_MAP = {
  WON: "GANHA",
  WIN: "GANHA",
  LOST: "PERDIDA",
  LOSE: "PERDIDA",
  VOID: "ANULADA",
  VOIDED: "ANULADA",
  CANCELLED: "ANULADA",
  CANCELED: "ANULADA",
  PUSH: "ANULADA",
  REFUNDED: "ANULADA",
  HALFWON: "MEIO_GANHA",
  HALFWIN: "MEIO_GANHA",
  PARTIALWIN: "MEIO_GANHA",
  HALFLOST: "MEIO_PERDIDA",
  HALFLOSE: "MEIO_PERDIDA",
  PARTIALLOSS: "MEIO_PERDIDA",
};

function normalize(status) {
  return typeof status === "string" ? status.toUpperCase().replace(/[^A-Z]/g, "") : "";
}

function isCashoutStatus(status) {
  return normalize(status).includes("CASHOUT") || normalize(status).includes("CASHEDOUT");
}

// `settled` só vem preenchido depois de a aposta estar decidida (à
// semelhança do `Settled` booleano do Betano) — sem ele, tratamos sempre
// como em aberto, independentemente do que `status` diga.
function mapStatus(bet) {
  if (!bet.settled) return "POR_LIQUIDAR";
  if (isCashoutStatus(bet.status)) return "CASHOUT";
  const mapped = STATUS_MAP[normalize(bet.status)];
  return mapped || null; // null = estado desconhecido, ignorada como unsupported
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function solverdeRef(bet) {
  return bet && bet.id !== undefined && bet.id !== null ? String(bet.id) : null;
}

function flattenSelections(bet, ref) {
  const selections = [];
  for (const leg of Array.isArray(bet.legs) ? bet.legs : []) {
    const odd = num(leg.odds);
    for (const part of Array.isArray(leg.parts) ? leg.parts : []) {
      selections.push({
        id: `solverde-${ref || "x"}-${selections.length}`,
        event: (leg.legInfo && leg.legInfo.eventName) || "",
        market: part.marketName || "",
        choice: part.selectionName || "",
        odd,
        sport: (leg.legInfo && leg.legInfo.sportId) || undefined,
        betType: part.marketName || undefined,
      });
    }
  }
  return selections;
}

/** Uma aposta da Solverde -> objeto Bet pronto para POST /api/bets/bulk. Devolve null para estados desconhecidos/não suportados. */
export function mapSolverdeBet(bet) {
  const ref = solverdeRef(bet);
  if (!ref) return null;
  const status = mapStatus(bet);
  if (!status) return null;

  const funds = bet.funds || {};
  const stake = round2(num(funds.stake));
  const cashStake = round2(num(funds.cashStake !== undefined ? funds.cashStake : stake));
  const freebetStake = round2(num(funds.freebetStake));
  const isFreebet = freebetStake > 0;
  const odd = round2(num(bet.odds));
  const potentialReturn = round2(stake * odd);

  // payoutNet é o valor Solverde já calcula líquido de imposto de jogo; cai
  // para payout (bruto) se payoutNet não vier preenchido.
  const grossPayout = num(funds.payout);
  const netPayout = funds.payoutNet !== undefined && funds.payoutNet !== null ? num(funds.payoutNet) : grossPayout;

  const isCashout = status === "CASHOUT";
  const finalReturn = status === "POR_LIQUIDAR" ? 0 : round2(netPayout);
  // Lucro = retorno líquido menos apenas a parte da stake que foi dinheiro
  // real (freebets não descontam do bolso do utilizador).
  const netProfit = status === "POR_LIQUIDAR" ? 0 : round2(finalReturn - cashStake);

  return {
    type: bet.betType === "SGL" ? "SIMPLES" : "MULTIPLA",
    status,
    stake,
    odd,
    isFreebet,
    freebetType: isFreebet ? "SR" : undefined,
    potentialReturn,
    finalReturn,
    netProfit,
    bookmaker: "Solverde",
    dateTime: formatDateTime(bet.placementTime),
    origin: "CSV",
    selections: flattenSelections(bet, ref),
    metadata: {
      source: "solverde",
      ref,
      importKey: `solverde:${ref}`,
      originalStatus: bet.status ?? null,
      betType: bet.betType ?? null,
      isCashout,
      cashoutAvailable: bet.cashoutAvailable === true,
      payoutGross: round2(grossPayout),
      payoutTax: round2(num(funds.payoutTax)),
      channel: (bet.channel && bet.channel.name) || null,
    },
  };
}

/** Lista de apostas da Solverde -> { bets, unsupported }. */
export function mapSolverdeBets(bets) {
  const mapped = [];
  let unsupported = 0;
  for (const bet of Array.isArray(bets) ? bets : []) {
    const result = mapSolverdeBet(bet);
    if (result) mapped.push(result);
    else unsupported++;
  }
  return { bets: mapped, unsupported };
}

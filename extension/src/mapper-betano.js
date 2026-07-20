// Betano bet-history-v3 -> BetTrackr model.

const STATUS_WIN = 2;
const STATUS_LOSS = 3;
const MIN_HISTORY_YEAR = 2012;
const CASHOUT_STATUS_TOKENS = new Set(["CASHOUT", "CASHEDOUT", "FULLCASHOUT", "PARTIALCASHOUT"]);

const SELECTION_STATUS_MAP = new Map([
  ["1", "POR_LIQUIDAR"],
  ["2", "GANHA"],
  ["3", "PERDIDA"],
  ["OPEN", "POR_LIQUIDAR"],
  ["PENDING", "POR_LIQUIDAR"],
  ["NOTSET", "POR_LIQUIDAR"],
  ["WIN", "GANHA"],
  ["WON", "GANHA"],
  ["GANHA", "GANHA"],
  ["LOSE", "PERDIDA"],
  ["LOSS", "PERDIDA"],
  ["LOST", "PERDIDA"],
  ["PERDIDA", "PERDIDA"],
  ["VOID", "ANULADA"],
  ["REFUNDED", "ANULADA"],
  ["CANCELED", "ANULADA"],
  ["CANCELLED", "ANULADA"],
  ["ANULADA", "ANULADA"],
  ["HALFWIN", "MEIO_GANHA"],
  ["HALFWON", "MEIO_GANHA"],
  ["HALFLOSE", "MEIO_PERDIDA"],
  ["HALFLOST", "MEIO_PERDIDA"],
]);

export function mapBetanoSelectionResult(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const token = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return SELECTION_STATUS_MAP.get(token);
}

function resultValue(value) {
  if (!value || typeof value !== "object") return undefined;
  return value.Result ?? value.Status ?? value.State ?? value.Outcome ?? value.SettlementStatus;
}

export function parseBetanoMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === undefined || value === null) return 0;
  let text = String(value).trim().replace(/[^\d,.-]/g, "");
  if (!text) return 0;
  const comma = text.lastIndexOf(",");
  const dot = text.lastIndexOf(".");
  if (comma >= 0 && (dot < 0 || comma > dot)) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    text = text.replace(/,/g, "");
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function dateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function promotionInfo(bet) {
  const tokens = Array.isArray(bet.BonusTokens) ? bet.BonusTokens : [];
  const first = tokens[0] || {};
  const type = first.Type ? String(first.Type) : null;
  return {
    type,
    amount: first.Amount === undefined ? null : round2(parseBetanoMoney(first.Amount)),
    tokens: tokens.map((token) => ({
      type: token && token.Type ? String(token.Type) : null,
      amount: token && token.Amount !== undefined ? round2(parseBetanoMoney(token.Amount)) : null,
    })),
    // FullBet is a bonus stake. RiskFree is retained as a cash stake because
    // any loss compensation is handled separately by the bookmaker.
    isFreebet: type === "FullBet",
  };
}

export function betanoRef(bet) {
  return bet && bet.BetId !== undefined && bet.BetId !== null ? String(bet.BetId) : null;
}

function isBetanoCashout(bet) {
  if (!bet) return false;
  if (bet.IsCashout === true || bet.IsCashedOut === true) return true;
  return [bet.Status, bet.State, bet.Result, bet.BetStatus, bet.SettlementStatus]
    .some((value) => typeof value === "string" && CASHOUT_STATUS_TOKENS.has(
      value.toUpperCase().replace(/[^A-Z]/g, "")
    ));
}

export function mapBetanoStatus(bet) {
  if (!bet || bet.Settled !== true) return "POR_LIQUIDAR";
  if (isBetanoCashout(bet)) return "CASHOUT";
  if (Number(bet.Status) === STATUS_WIN) return "GANHA";
  if (Number(bet.Status) === STATUS_LOSS) return "PERDIDA";

  // Betano's annulled status is not represented in the supplied samples. A
  // returned stake is the only safe signal we can use without inventing a
  // result, and other unknown settled states are skipped by mapBetanoBets.
  const stake = parseBetanoMoney(bet.Stake);
  const returned = parseBetanoMoney(bet.Return);
  if (stake > 0 && Math.abs(stake - returned) < 0.005) return "ANULADA";
  return null;
}

function flattenSelections(bet, ref) {
  const selections = [];
  for (const leg of Array.isArray(bet.Legs) ? bet.Legs : []) {
    const legItems = Array.isArray(leg && leg.LegItems) ? leg.LegItems : [];
    const legSelectionCount = legItems.reduce(
      (count, item) => count + (Array.isArray(item && item.Selections) ? item.Selections.length : 0),
      0
    );
    for (const item of legItems) {
      const itemSelections = Array.isArray(item && item.Selections) ? item.Selections : [];
      for (const selection of itemSelections) {
        const result = mapBetanoSelectionResult(
          resultValue(selection) ??
          (itemSelections.length === 1 ? resultValue(item) : undefined) ??
          (legSelectionCount === 1 ? resultValue(leg) : undefined)
        );
        selections.push({
          id: `betano-${ref || "x"}-${selections.length}`,
          event: selection.Game || "",
          market: selection.Market || "",
          choice: selection.Title || "",
          odd: parseBetanoMoney(selection.Odd),
          sport: selection.Sport || undefined,
          betType: selection.Market || undefined,
          ...(result ? { result } : {}),
        });
      }
    }
  }
  return selections;
}

export function mapBetanoBet(bet) {
  const ref = betanoRef(bet);
  if (!ref) return null;
  const status = mapBetanoStatus(bet);
  if (!status) return null;

  const stake = round2(parseBetanoMoney(bet.Stake));
  const odd = round2(Number(bet.DecimalOdds) || parseBetanoMoney(bet.Odds));
  const promotion = promotionInfo(bet);
  const isCashout = status === "CASHOUT";
  const settledReturn = round2(parseBetanoMoney(bet.Return));
  const possibleReturn = round2(parseBetanoMoney(bet.PossibleWinnings) || stake * odd);
  const finalReturn = status === "POR_LIQUIDAR" ? 0 : settledReturn;
  const netProfit = status === "POR_LIQUIDAR"
    ? 0
    : promotion.isFreebet ? finalReturn : finalReturn - stake;

  return {
    type: String(bet.Type || "").toLowerCase() === "single" ? "SIMPLES" : "MULTIPLA",
    status,
    stake,
    odd,
    isFreebet: promotion.isFreebet,
    potentialReturn: status === "POR_LIQUIDAR" ? possibleReturn : round2(Math.max(possibleReturn, finalReturn)),
    finalReturn,
    netProfit: round2(netProfit),
    bookmaker: "Betano",
    dateTime: dateTime(bet.PlacedAt),
    origin: "CSV",
    selections: flattenSelections(bet, ref),
    metadata: {
      source: "betano",
      ref,
      importKey: `betano:${ref}`,
      originalStatus: bet.Status ?? null,
      originalReturn: bet.Return ?? null,
      isCashout,
      cashoutReturn: isCashout ? settledReturn : null,
      promotionType: promotion.type,
      promotionAmount: promotion.amount,
      bonusTokens: promotion.tokens,
      bonusType: bet.BonusType ?? null,
    },
  };
}

export function mapBetanoBets(bets) {
  const mapped = [];
  let unsupported = 0;
  for (const bet of Array.isArray(bets) ? bets : []) {
    const result = mapBetanoBet(bet);
    if (result) mapped.push(result);
    else unsupported++;
  }
  return { bets: mapped, unsupported };
}

export function betanoHistoryStart() {
  return new Date(Date.UTC(MIN_HISTORY_YEAR, 0, 1, 0, 0, 0, 0));
}

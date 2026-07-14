import { BetMetadata, BetStatus } from "../types";

export const VALID_BET_STATUSES: readonly BetStatus[] = [
  "POR_LIQUIDAR",
  "GANHA",
  "PERDIDA",
  "ANULADA",
  "MEIO_GANHA",
  "MEIO_PERDIDA",
  "CASHOUT",
];

const CASHOUT_TOKENS = new Set([
  "CASHOUT",
  "CASHEDOUT",
  "FULLCASHOUT",
  "PARTIALCASHOUT",
]);

const STATUS_ALIASES: Record<string, BetStatus> = {
  PENDING: "POR_LIQUIDAR",
  PENDENTE: "POR_LIQUIDAR",
  OPEN: "POR_LIQUIDAR",
  WIN: "GANHA",
  WON: "GANHA",
  LOSS: "PERDIDA",
  LOSE: "PERDIDA",
  LOST: "PERDIDA",
  VOID: "ANULADA",
  REFUNDED: "ANULADA",
  CANCELLED: "ANULADA",
  CANCELED: "ANULADA",
  HALFWON: "MEIO_GANHA",
  HALF_WON: "MEIO_GANHA",
  HALFLOST: "MEIO_PERDIDA",
  HALF_LOST: "MEIO_PERDIDA",
};

function statusToken(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[\s-]+/g, "_")
    : "";
}

function compactStatusToken(value: unknown): string {
  return statusToken(value).replace(/[^A-Z]/g, "");
}

export function parseBetMetadata(raw: unknown): BetMetadata | undefined {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as BetMetadata)
    : undefined;
}

export function isCashoutStatusValue(value: unknown): boolean {
  return CASHOUT_TOKENS.has(compactStatusToken(value));
}

export function hasCashoutSignal(rawStatus: unknown, rawMetadata?: unknown): boolean {
  if (isCashoutStatusValue(rawStatus)) return true;

  const metadata = parseBetMetadata(rawMetadata);
  if (!metadata) return false;
  if (metadata.isCashout === true || String(metadata.isCashout).toLowerCase() === "true") {
    return true;
  }

  return [
    metadata.originalStatus,
    metadata.betclicResult,
    metadata.settlementStatus,
  ].some(isCashoutStatusValue);
}

/**
 * Produces the one status value that may cross the API/database boundary.
 * Explicit cashout evidence always wins over historical half-result values.
 */
export function normalizeBetStatus(rawStatus: unknown, rawMetadata?: unknown): BetStatus {
  if (hasCashoutSignal(rawStatus, rawMetadata)) return "CASHOUT";

  const token = statusToken(rawStatus);
  if (VALID_BET_STATUSES.includes(token as BetStatus)) return token as BetStatus;
  return STATUS_ALIASES[token] ?? STATUS_ALIASES[token.replace(/_/g, "")] ?? "POR_LIQUIDAR";
}

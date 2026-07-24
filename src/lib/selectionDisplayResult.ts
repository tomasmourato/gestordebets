import type { BetStatus, BetType, SelectionResult } from "../types";

export type SelectionDisplayResult = SelectionResult | "DESCONHECIDO";

export function resolveSelectionDisplayResult(
  betStatus: BetStatus,
  selectionResult?: SelectionResult,
  betType?: BetType,
): SelectionDisplayResult | undefined {
  if (betType === "SIMPLES" && betStatus !== "POR_LIQUIDAR" && betStatus !== "CASHOUT") {
    return betStatus;
  }

  if (selectionResult === "POR_LIQUIDAR" && betStatus !== "POR_LIQUIDAR") {
    return "DESCONHECIDO";
  }
  return selectionResult;
}

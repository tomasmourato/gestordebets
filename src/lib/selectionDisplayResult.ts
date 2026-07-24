import type { BetStatus, SelectionResult } from "../types";

export type SelectionDisplayResult = SelectionResult | "DESCONHECIDO";

export function resolveSelectionDisplayResult(
  betStatus: BetStatus,
  selectionResult?: SelectionResult,
): SelectionDisplayResult | undefined {
  if (selectionResult === "POR_LIQUIDAR" && betStatus !== "POR_LIQUIDAR") {
    return "DESCONHECIDO";
  }
  return selectionResult;
}

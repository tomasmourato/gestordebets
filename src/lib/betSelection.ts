export interface BetSelectionState {
  isSelecting: boolean;
  selectedIds: Set<string>;
}

export type BetSelectionAction =
  | { type: "toggle-mode" }
  | { type: "toggle-one"; betId: string }
  | { type: "toggle-filtered"; filteredIds: readonly string[] }
  | { type: "clear" };

export const INITIAL_BET_SELECTION_STATE: BetSelectionState = {
  isSelecting: false,
  selectedIds: new Set<string>(),
};

export function betSelectionReducer(
  state: BetSelectionState,
  action: BetSelectionAction,
): BetSelectionState {
  if (action.type === "clear") {
    return {
      isSelecting: false,
      selectedIds: new Set<string>(),
    };
  }

  if (action.type === "toggle-mode") {
    return state.isSelecting
      ? {
          isSelecting: false,
          selectedIds: new Set<string>(),
        }
      : {
          isSelecting: true,
          selectedIds: new Set<string>(),
        };
  }

  const next = new Set(state.selectedIds);

  if (action.type === "toggle-one") {
    if (next.has(action.betId)) next.delete(action.betId);
    else next.add(action.betId);

    return {
      isSelecting: next.size > 0,
      selectedIds: next,
    };
  }

  if (action.filteredIds.length === 0) return state;

  const allFilteredSelected = action.filteredIds.every((id) => next.has(id));
  if (allFilteredSelected) action.filteredIds.forEach((id) => next.delete(id));
  else action.filteredIds.forEach((id) => next.add(id));

  return {
    isSelecting: next.size > 0,
    selectedIds: next,
  };
}

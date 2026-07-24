### Task 1: Add the Shared Selection-State Reducer

**Files:**
- Create: `src/lib/betSelection.ts`
- Create: `extension/test/bet-selection.test.ts`

**Interfaces:**
- Consumes: immutable `ReadonlySet<string>` semantics through reducer state.
- Produces: `BetSelectionState`, `BetSelectionAction`, `INITIAL_BET_SELECTION_STATE`, and `betSelectionReducer(state, action): BetSelectionState`.
- Invariant: `toggle-one` and `toggle-filtered` derive `isSelecting` from the resulting set; `toggle-mode` may deliberately create `{ isSelecting: true, selectedIds: empty }`.

- [ ] **Step 1: Write the failing reducer tests**

Create `extension/test/bet-selection.test.ts` with:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INITIAL_BET_SELECTION_STATE,
  betSelectionReducer,
  type BetSelectionState,
} from "../../src/lib/betSelection";

const selected = (...ids: string[]): BetSelectionState => ({
  isSelecting: true,
  selectedIds: new Set(ids),
});

describe("betSelectionReducer", () => {
  it("allows manual selection mode to start with no selected bets", () => {
    const started = betSelectionReducer(INITIAL_BET_SELECTION_STATE, { type: "toggle-mode" });

    assert.equal(started.isSelecting, true);
    assert.deepEqual([...started.selectedIds], []);

    const stopped = betSelectionReducer(started, { type: "toggle-mode" });
    assert.equal(stopped.isSelecting, false);
    assert.deepEqual([...stopped.selectedIds], []);
  });

  it("starts selection when an individual bet is added", () => {
    const result = betSelectionReducer(INITIAL_BET_SELECTION_STATE, {
      type: "toggle-one",
      betId: "a",
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["a"]);
  });

  it("exits selection mode when the final selected bet is removed", () => {
    const result = betSelectionReducer(selected("a"), {
      type: "toggle-one",
      betId: "a",
    });

    assert.equal(result.isSelecting, false);
    assert.deepEqual([...result.selectedIds], []);
  });

  it("keeps selection mode active when one of several selected bets is removed", () => {
    const result = betSelectionReducer(selected("a", "b"), {
      type: "toggle-one",
      betId: "a",
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["b"]);
  });

  it("exits when deselecting all filtered bets empties the selection", () => {
    const result = betSelectionReducer(selected("a", "b"), {
      type: "toggle-filtered",
      filteredIds: ["a", "b"],
    });

    assert.equal(result.isSelecting, false);
    assert.deepEqual([...result.selectedIds], []);
  });

  it("keeps selection active when deselecting filtered bets leaves a hidden selection", () => {
    const result = betSelectionReducer(selected("a", "b", "hidden"), {
      type: "toggle-filtered",
      filteredIds: ["a", "b"],
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["hidden"]);
  });

  it("selects every filtered bet when the filtered set is not fully selected", () => {
    const result = betSelectionReducer(selected("a"), {
      type: "toggle-filtered",
      filteredIds: ["a", "b"],
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["a", "b"]);
  });

  it("clears selection and mode explicitly after a completed bulk action", () => {
    const result = betSelectionReducer(selected("a", "b"), { type: "clear" });

    assert.equal(result.isSelecting, false);
    assert.deepEqual([...result.selectedIds], []);
  });
});
```

- [ ] **Step 2: Run the reducer test and verify the missing module**

Run:

```bash
bun test extension/test/bet-selection.test.ts
```

Expected: FAIL because `../../src/lib/betSelection` does not exist.

- [ ] **Step 3: Implement the pure reducer**

Create `src/lib/betSelection.ts` with:

```ts
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
```

- [ ] **Step 4: Run the reducer tests**

Run:

```bash
bun test extension/test/bet-selection.test.ts
```

Expected: 8 tests PASS.

- [ ] **Step 5: Commit the reducer**

```bash
git add src/lib/betSelection.ts extension/test/bet-selection.test.ts
git commit -m "feat: centralize bet selection state"
```

---


### Task 2: Route Desktop and Mobile Selection Through the Reducer

**Files:**
- Modify: `src/components/BetsManager.tsx:1-41,148-149,340-446`
- Modify: `src/mobile/screens/MobileBets.tsx:8-32,210-212,400-491`
- Modify: `src/lib/longPress.ts:1-59`
- Modify: `extension/test/long-press.test.ts:1-70`
- Test: `extension/test/bet-selection.test.ts`
- Test: `extension/test/long-press.test.ts`

**Interfaces:**
- Consumes: `betSelectionReducer`, `INITIAL_BET_SELECTION_STATE`, and `BetSelectionAction` from Task 1.
- Produces: desktop `isSelecting`/`selectedBetIds` and mobile `isSelecting`/`selectedIds` derived from one reducer state.
- Interaction contract: click, keyboard activation, checkbox, tap, long press, and filtered-set toggle call the local `applySelectionAction`; the reducer decides whether mode remains active.

- [ ] **Step 1: Add an integration contract test before migrating the components**

Append this block to `extension/test/bet-selection.test.ts`:

```ts
import { readFileSync } from "node:fs";

describe("desktop and mobile selection integration", () => {
  const desktopSource = readFileSync(
    new URL("../../src/components/BetsManager.tsx", import.meta.url),
    "utf8",
  );
  const mobileSource = readFileSync(
    new URL("../../src/mobile/screens/MobileBets.tsx", import.meta.url),
    "utf8",
  );

  it("routes desktop selection paths through the shared reducer action", () => {
    assert.match(desktopSource, /useReducer\(\s*betSelectionReducer/);
    assert.match(desktopSource, /const toggleBetSelection = \(id: string\).*type: "toggle-one"/s);
    assert.match(desktopSource, /toggleBetSelectionFromLongPress.*toggleBetSelection\(id\)/s);
    assert.match(desktopSource, /onChange=\{\(\) => toggleBetSelection\(bet\.id\)\}/);
    assert.match(desktopSource, /type: "toggle-filtered"/);
  });

  it("routes mobile selection paths through the shared reducer action", () => {
    assert.match(mobileSource, /useReducer\(\s*betSelectionReducer/);
    assert.match(mobileSource, /const toggleSelected = \(id: string\).*type: "toggle-one"/s);
    assert.match(mobileSource, /toggleSelectedFromLongPress.*toggleSelected\(id\)/s);
    assert.match(mobileSource, /if \(isSelecting\) toggleSelected\(bet\.id\)/);
    assert.match(mobileSource, /type: "toggle-filtered"/);
  });
});
```

Place `import { readFileSync } from "node:fs";` beside the existing Node imports at the top of the file, not after executable declarations.

- [ ] **Step 2: Run the integration contract and verify it fails**

Run:

```bash
bun test extension/test/bet-selection.test.ts
```

Expected: the 9 reducer tests PASS and both integration tests FAIL because the components still use independent `useState` values.

- [ ] **Step 3: Replace desktop’s split selection state with the reducer**

In `src/components/BetsManager.tsx`, add `useReducer` to the React import:

```ts
import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
```

Replace the `longPress` selection-helper import and add the reducer import:

```ts
import { createLongPressController } from "../lib/longPress";
import {
  INITIAL_BET_SELECTION_STATE,
  betSelectionReducer,
  type BetSelectionAction,
} from "../lib/betSelection";
```

Replace:

```ts
const [isSelecting, setIsSelecting] = useState(false);
const [selectedBetIds, setSelectedBetIds] = useState<Set<string>>(new Set());
```

with:

```ts
const [selectionState, dispatchSelection] = useReducer(
  betSelectionReducer,
  INITIAL_BET_SELECTION_STATE,
);
const { isSelecting } = selectionState;
const selectedBetIds = selectionState.selectedIds;
```

Replace `toggleSelectionMode`, `toggleBetSelection`, and `toggleBetSelectionFromLongPress` with:

```ts
const applySelectionAction = (action: BetSelectionAction) => {
  const next = betSelectionReducer(selectionState, action);
  dispatchSelection(action);
  setIsConfirmingBulkDelete(false);
  if (!next.isSelecting) resetBulkEdit();
};

const toggleSelectionMode = () => {
  applySelectionAction({ type: "toggle-mode" });
};

const toggleBetSelection = (id: string) => {
  applySelectionAction({ type: "toggle-one", betId: id });
};

const toggleBetSelectionFromLongPress = (id: string) => {
  toggleBetSelection(id);
};
```

Replace `toggleAllFilteredBets` with:

```ts
const toggleAllFilteredBets = () => {
  applySelectionAction({
    type: "toggle-filtered",
    filteredIds: filteredBets.map((bet) => bet.id),
  });
};
```

Replace `finishBulkAction` with:

```ts
const finishBulkAction = () => {
  applySelectionAction({ type: "clear" });
  setIsBulkActionRunning(false);
};
```

Keep the existing card click, keyboard, and checkbox JSX calling `toggleBetSelection(bet.id)`. They now share the same reducer transition, so removing the last ID through any of those desktop inputs sets `isSelecting` to `false` in the same state update.

- [ ] **Step 4: Replace mobile’s split selection state with the same reducer**

In `src/mobile/screens/MobileBets.tsx`, add `useReducer` to the React import:

```ts
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
```

Replace the `longPress` selection-helper import and add the reducer import:

```ts
import { createLongPressController } from "../../lib/longPress";
import {
  INITIAL_BET_SELECTION_STATE,
  betSelectionReducer,
  type BetSelectionAction,
} from "../../lib/betSelection";
```

Replace:

```ts
const [isSelecting, setIsSelecting] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

with:

```ts
const [selectionState, dispatchSelection] = useReducer(
  betSelectionReducer,
  INITIAL_BET_SELECTION_STATE,
);
const { isSelecting } = selectionState;
const selectedIds = selectionState.selectedIds;
```

Replace `toggleSelecting`, `toggleSelected`, and `toggleSelectedFromLongPress` with:

```ts
const applySelectionAction = (action: BetSelectionAction) => {
  const next = betSelectionReducer(selectionState, action);
  dispatchSelection(action);
  setConfirmBulkDelete(false);
  if (!next.isSelecting) resetBulkEdit();
};

const toggleSelecting = () => {
  applySelectionAction({ type: "toggle-mode" });
};

const toggleSelected = (id: string) => {
  applySelectionAction({ type: "toggle-one", betId: id });
};

const toggleSelectedFromLongPress = (id: string) => {
  toggleSelected(id);
  void selectionHaptic();
};
```

Replace `toggleAllFiltered` with:

```ts
const toggleAllFiltered = () => {
  applySelectionAction({
    type: "toggle-filtered",
    filteredIds: filteredBets.map((bet) => bet.id),
  });
};
```

Replace `finishBulk` with:

```ts
const finishBulk = () => {
  applySelectionAction({ type: "clear" });
  setBulkRunning(false);
};
```

Keep the existing mobile card tap calling `toggleSelected(bet.id)`. The long-press callback calls the same function, so both paths exit mode after removing the final ID. When mode exits, the existing `{isSelecting && ...}` action bar disappears and the existing `{!isSelecting && ...}` FAB returns.

- [ ] **Step 5: Remove the generic selection helper from the long-press module**

Delete `toggleLongPressSelection` from `src/lib/longPress.ts`, leaving `createLongPressController` unchanged.

In `extension/test/long-press.test.ts`, change the import to:

```ts
import { createLongPressController } from "../../src/lib/longPress";
```

Delete the entire `describe("long-press selection", ...)` block. Its three selection cases are superseded by `extension/test/bet-selection.test.ts`; the controller suite continues to verify the 500 ms activation, one-shot callback, release-click suppression, cancellation, and pointer-cancel behavior.

- [ ] **Step 6: Run selection and long-press tests**

Run:

```bash
bun test extension/test/bet-selection.test.ts extension/test/long-press.test.ts
```

Expected: 11 selection tests and 3 long-press controller tests PASS.

- [ ] **Step 7: Run the TypeScript check**

Run:

```bash
npm run lint
```

Expected: `tsc --noEmit` exits with code 0 and reports no missing setter/helper references.

- [ ] **Step 8: Commit the selection lifecycle integration**

```bash
git add src/lib/longPress.ts src/components/BetsManager.tsx src/mobile/screens/MobileBets.tsx extension/test/long-press.test.ts extension/test/bet-selection.test.ts
git commit -m "fix: exit empty bet selection mode"
```

---


# Stable Summary Selection Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the desktop financial-summary container the same height before and during selection, animate its metric text into a compact state while actions are visible, and make desktop/mobile selection mode exit whenever a deselection leaves no selected bets.

**Architecture:** Add a small pure selection reducer so desktop and mobile share one atomic state transition for manual mode entry, single-card toggles, filtered-set toggles, and clearing. Extend `FilteredBetsSummary` with an opt-in desktop footer reservation; it owns the fixed desktop row heights and reduced-motion-aware metric-size animation, while the mobile caller keeps the existing 2×2 layout without a reserved footer slot.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS 4, `motion/react` 12, Bun/Node test runner, Vite 6.

## Global Constraints

- The desktop summary must have the same outer height before selection, after selection starts, and after the final selection is removed.
- The desktop metric row is slightly taller at baseline and reserves a fixed `3.5rem` action slot at `md` widths.
- Desktop metric values animate from `0.875rem/1.25rem` to `0.75rem/1rem` while the selected-bet footer is present.
- Metric-size and footer transitions use the existing `motion/react` dependency and use zero-duration transitions when `useReducedMotion()` is true.
- Mobile keeps the current responsive 2×2 metric grid and does not render an empty desktop action-row slot.
- Existing number-change animation, financial calculations, currency formatting, pending-stake copy, and freebet content remain unchanged.
- Desktop and mobile leave selection mode immediately whenever a deselection operation produces an empty selected-ID set.
- Card click/tap, checkbox, long press, and “deselect filtered” must all use the same selection-state transition.
- If deselecting the currently filtered bets leaves selected hidden bets, selection mode remains active.
- Manually entering selection mode may temporarily have zero selected IDs; only reducing an existing selection to zero exits automatically.
- Existing completed bulk actions continue to clear selection, close selection mode, and reset their transient UI.
- Do not change extension messaging as part of this work; the reported missing-receiver console warning is outside this layout/selection scope.

## File Structure

- Create `src/lib/betSelection.ts`: pure, platform-neutral reducer for selection mode and selected IDs.
- Create `extension/test/bet-selection.test.ts`: reducer contract for manual zero-selection entry, individual deselection, and filtered deselection.
- Modify `src/lib/longPress.ts`: retain only pointer-duration/click-suppression behavior after generic selection logic moves to `betSelection.ts`.
- Modify `extension/test/long-press.test.ts`: keep controller timing/cancellation coverage and remove the selection-state tests moved to the new reducer suite.
- Modify `src/components/BetsManager.tsx`: consume the reducer for desktop click, keyboard, checkbox, long-press, filtered-toggle, and bulk-clear paths; request the reserved desktop footer slot.
- Modify `src/mobile/screens/MobileBets.tsx`: consume the same reducer for tap, long-press, filtered-toggle, manual mode, and bulk-clear paths.
- Modify `src/components/FilteredBetsSummary.tsx`: add the opt-in reserved footer slot and reduced-motion-aware compact metric animation.
- Modify `extension/test/filtered-bets-summary.test.ts`: verify stable desktop slot markup, compact/normal states, and the absence of a mobile slot.

---

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

Expected: the 8 reducer tests PASS and both integration tests FAIL because the components still use independent `useState` values.

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

Expected: 10 selection tests and 3 long-press controller tests PASS.

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

### Task 3: Reserve the Desktop Summary Footer and Animate Compact Metrics

**Files:**
- Modify: `src/components/FilteredBetsSummary.tsx:1-139`
- Modify: `src/components/BetsManager.tsx:1060-1140`
- Modify: `extension/test/filtered-bets-summary.test.ts:65-98`

**Interfaces:**
- Consumes: existing `footer?: ReactNode`.
- Produces: new `reserveFooterSpace?: boolean`; when true, desktop renders an `md:h-20` metrics row and an always-present `md:h-14` footer slot.
- State markers: `data-summary-compact="true|false"`, `data-summary-metric-size="compact|normal"`, and `data-summary-footer-slot`.
- Mobile contract: omitting `reserveFooterSpace` renders no slot and retains the current 2×2 metrics grid.

- [ ] **Step 1: Replace the current footer test with the stable-layout contract**

In `extension/test/filtered-bets-summary.test.ts`, replace the test named `renders animated metric values and an optional action footer inside the summary surface` with:

```ts
it("reserves a stable desktop footer slot and compacts metrics only when actions are present", () => {
  const withFooter = renderToStaticMarkup(
    React.createElement(FilteredBetsSummary, {
      bets: [bet()],
      currency: "€",
      freebetOnly: false,
      reserveFooterSpace: true,
      footer: React.createElement("div", null, "2 apostas selecionadas"),
    }),
  );
  const withoutFooter = renderToStaticMarkup(
    React.createElement(FilteredBetsSummary, {
      bets: [bet()],
      currency: "€",
      freebetOnly: false,
      reserveFooterSpace: true,
    }),
  );
  const mobileLayout = renderToStaticMarkup(
    React.createElement(FilteredBetsSummary, {
      bets: [bet()],
      currency: "€",
      freebetOnly: false,
    }),
  );

  assert.match(withFooter, /data-summary-footer-slot/);
  assert.match(withoutFooter, /data-summary-footer-slot/);
  assert.match(withFooter, /md:h-20/);
  assert.match(withoutFooter, /md:h-20/);
  assert.match(withFooter, /md:h-14/);
  assert.match(withoutFooter, /md:h-14/);
  assert.match(withFooter, /data-summary-compact="true"/);
  assert.match(withFooter, /data-summary-metric-size="compact"/);
  assert.match(withFooter, /2 apostas selecionadas/);
  assert.match(withFooter, /data-motion-value=/);
  assert.match(withoutFooter, /data-summary-compact="false"/);
  assert.match(withoutFooter, /data-summary-metric-size="normal"/);
  assert.doesNotMatch(withoutFooter, /2 apostas selecionadas/);
  assert.doesNotMatch(mobileLayout, /data-summary-footer-slot/);
  assert.doesNotMatch(mobileLayout, /md:h-20/);
});
```

- [ ] **Step 2: Run the summary test and verify the new contract fails**

Run:

```bash
bun test extension/test/filtered-bets-summary.test.ts
```

Expected: existing financial/freebet tests PASS; the stable-layout test FAILS because `reserveFooterSpace` and the data markers do not exist.

- [ ] **Step 3: Add the reserved slot and metric-size motion**

In `src/components/FilteredBetsSummary.tsx`, extend the props:

```ts
interface FilteredBetsSummaryProps {
  bets: Bet[];
  currency: string;
  freebetOnly: boolean;
  footer?: ReactNode;
  reserveFooterSpace?: boolean;
}
```

Change the component signature and add its layout state immediately after the summary calculation:

```ts
export default function FilteredBetsSummary({
  bets,
  currency,
  freebetOnly,
  footer,
  reserveFooterSpace = false,
}: FilteredBetsSummaryProps) {
  const summary = calculateFilteredBetsSummary(bets);
  const reduceMotion = useReducedMotion();
  const compactMetrics = Boolean(footer);
```

Replace the component’s current return block with:

```tsx
return (
  <section
    aria-label="Resumo financeiro das apostas filtradas"
    data-summary-compact={compactMetrics ? "true" : "false"}
    className="overflow-visible rounded-sm border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
  >
    <div
      className={`grid grid-cols-2 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 md:grid-cols-4 md:divide-y-0 ${
        reserveFooterSpace ? "md:h-20" : ""
      }`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 px-3 py-3 md:flex md:flex-col md:justify-center md:px-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {item.label}
          </p>
          <motion.p
            data-summary-metric-size={compactMetrics ? "compact" : "normal"}
            initial={false}
            animate={{
              fontSize: compactMetrics ? "0.75rem" : "0.875rem",
              lineHeight: compactMetrics ? "1rem" : "1.25rem",
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`mt-1 font-mono font-bold tabular-nums ${item.className}`}
          >
            <AnimatedMetricValue valueKey={item.valueKey}>{item.value}</AnimatedMetricValue>
          </motion.p>
        </div>
      ))}
    </div>

    {reserveFooterSpace ? (
      <div
        data-summary-footer-slot
        className="hidden h-14 items-center overflow-visible border-t border-zinc-200 px-4 dark:border-zinc-800 md:flex"
      >
        <AnimatePresence initial={false} mode="wait">
          {footer ? (
            <motion.div
              key="summary-footer"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{
                duration: reduceMotion ? 0 : 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full"
            >
              {footer}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    ) : footer ? (
      <div
        data-summary-footer
        className="border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800 md:px-4"
      >
        {footer}
      </div>
    ) : null}
  </section>
);
```

Do not change `AnimatedMetricValue`, `stakeValue`, the `items` array, or any money calculations. The outer desktop height is stable because both the `5rem` metric row and `3.5rem` footer slot exist before selection; only the footer contents and metric typography change.

- [ ] **Step 4: Opt the desktop caller into the reserved slot**

In the desktop `FilteredBetsSummary` call in `src/components/BetsManager.tsx`, add the prop:

```tsx
<FilteredBetsSummary
  bets={summaryBets}
  currency={currency}
  freebetOnly={freebetFilter === "FREEBET"}
  reserveFooterSpace
  footer={
    isSelecting && selectedBetIds.size > 0 ? (
```

Keep the existing desktop footer content and its bulk-action handlers unchanged.

Do not add `reserveFooterSpace` to `src/mobile/screens/MobileBets.tsx`; omission is what preserves the mobile 2×2 layout without a blank footer gap.

- [ ] **Step 5: Run the focused summary test**

Run:

```bash
bun test extension/test/filtered-bets-summary.test.ts
```

Expected: all summary calculation, freebet, selected-summary, stable-slot, and desktop focus tests PASS.

- [ ] **Step 6: Run selection and summary regression tests together**

Run:

```bash
bun test extension/test/filtered-bets-summary.test.ts extension/test/bet-selection.test.ts extension/test/long-press.test.ts
```

Expected: all focused tests PASS with no React server-render warnings.

- [ ] **Step 7: Commit the stable summary layout**

```bash
git add src/components/FilteredBetsSummary.tsx src/components/BetsManager.tsx extension/test/filtered-bets-summary.test.ts
git commit -m "feat: stabilize selected bets summary layout"
```

---

### Task 4: Full Verification and Responsive Visual Check

**Files:**
- Verify: `src/lib/betSelection.ts`
- Verify: `src/lib/longPress.ts`
- Verify: `src/components/FilteredBetsSummary.tsx`
- Verify: `src/components/BetsManager.tsx`
- Verify: `src/mobile/screens/MobileBets.tsx`
- Verify: `extension/test/bet-selection.test.ts`
- Verify: `extension/test/long-press.test.ts`
- Verify: `extension/test/filtered-bets-summary.test.ts`

**Interfaces:**
- Consumes: all implementation from Tasks 1–3.
- Produces: verified production bundle and a checked interaction matrix for desktop/mobile, light/dark, and reduced-motion behavior.

- [ ] **Step 1: Run the complete unit test suite**

Run:

```bash
npm run test:unit
```

Expected: every test under `extension/test` PASS.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
npm run lint
```

Expected: `tsc --noEmit` exits with code 0.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: Vite client build, bundled server build, extension archive, and app bundle all complete with exit code 0.

- [ ] **Step 4: Start the app for responsive verification**

Run:

```bash
npm run dev
```

Expected: the local server starts and prints its listening URL without a compilation error.

- [ ] **Step 5: Verify the desktop layout and every deselection path**

At a desktop viewport of at least `1024px`, in both light and dark themes:

1. Record the summary section’s outer height before entering selection.
2. Manually enter selection mode with zero selected bets; verify that the normal-size metrics remain and the summary height does not change.
3. Select one bet by card click; verify the footer appears inside the reserved slot, metrics animate smaller, and the outer height remains identical.
4. Deselect that bet by card click; verify selection mode exits, the footer disappears, and metrics return to normal size.
5. Repeat the final deselection with the card checkbox.
6. Repeat the final deselection with a 500 ms card hold; verify the release click remains suppressed.
7. Select two bets and remove one; verify selection mode and the footer remain active with one selected bet.
8. Select every filtered bet, press “Desmarcar filtradas,” and verify selection mode exits when no IDs remain.
9. Select one filtered and one subsequently hidden bet, then deselect the visible filtered set; verify selection mode remains active because the hidden selected ID still exists.
10. Enable the operating system/browser reduced-motion preference and repeat a selection; verify metric/footer changes are immediate rather than animated.

- [ ] **Step 6: Verify the mobile lifecycle and unchanged summary layout**

At a mobile viewport around `390×844`, in both light and dark themes:

1. Verify the financial summary remains the existing 2×2 grid with no blank action-row gap.
2. Manually enter selection mode with zero selected bets; verify the temporary zero-selection state is allowed.
3. Select and then tap the same card; verify the final deselection exits mode, removes the fixed action bar, and restores the add-bet FAB.
4. Repeat using a 500 ms long press on the selected card.
5. Select two cards and remove one; verify selection mode remains active.
6. Use “Desmarcar filtradas” with all selected IDs visible; verify selection mode exits.
7. Leave one selected ID hidden by filters and deselect the visible filtered IDs; verify selection mode stays active.
8. Verify no new `click handler took ... ms` work is attributable to summary layout growth; the extension receiver warning remains outside this task.

- [ ] **Step 7: Review the final diff for scope and accidental files**

Run:

```bash
git status --short
git diff -- src/lib/betSelection.ts src/lib/longPress.ts src/components/FilteredBetsSummary.tsx src/components/BetsManager.tsx src/mobile/screens/MobileBets.tsx extension/test/bet-selection.test.ts extension/test/long-press.test.ts extension/test/filtered-bets-summary.test.ts
```

Expected: only the planned selection and summary changes are present in the reviewed diff; unrelated existing worktree changes remain untouched.

- [ ] **Step 8: Commit any verification-only corrections**

If visual verification required a correction within the planned files, rerun Steps 1–3 and commit only those corrections:

```bash
git add src/lib/betSelection.ts src/lib/longPress.ts src/components/FilteredBetsSummary.tsx src/components/BetsManager.tsx src/mobile/screens/MobileBets.tsx extension/test/bet-selection.test.ts extension/test/long-press.test.ts extension/test/filtered-bets-summary.test.ts
git commit -m "fix: polish stable selection summary"
```

If no correction was required, do not create an empty commit.

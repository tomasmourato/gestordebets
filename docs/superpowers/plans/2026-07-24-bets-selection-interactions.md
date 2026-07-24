# Bets Selection Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the desktop financial and bulk-action bars, animate summary value changes, remove pointer-only card outlines, and add reliable mobile long-press selection.

**Architecture:** Add a framework-independent long-press controller and selection transition helper in `src/lib/longPress.ts`, then wire one controller into `MobileBets`. Extend the shared financial summary with animated metric values and an optional footer so desktop bulk actions can occupy the same bordered surface.

**Tech Stack:** React 19, TypeScript, Motion for React, Tailwind CSS, Bun/Node test runner.

## Global Constraints

- Desktop alone merges the financial summary and bulk-action row.
- Mobile retains its fixed bottom bulk-action bar.
- A long-press activates after approximately 500 milliseconds and fires once per press.
- A recognized long-press suppresses the release tap, even when the pointer remains down longer.
- Removing the final selected bet by long-press exits selection mode.
- Metric motion must respect reduced-motion preferences.
- Pointer interaction must not leave a persistent card outline; keyboard focus remains visible.

---

### Task 1: Mobile long-press selection

**Files:**
- Create: `src/lib/longPress.ts`
- Modify: `src/mobile/screens/MobileBets.tsx`
- Create: `extension/test/long-press.test.ts`

**Interfaces:**
- Produces: `createLongPressController(options): LongPressController`
- Produces: `toggleLongPressSelection(selectedIds, betId): { selectedIds: Set<string>; isSelecting: boolean }`
- Consumes: `selectionHaptic()` from `src/lib/haptics.ts`

- [ ] **Step 1: Write failing controller and selection tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLongPressController, toggleLongPressSelection } from "../../src/lib/longPress";

describe("long-press controller", () => {
  it("fires once and consumes only the release click", () => {
    let scheduled: (() => void) | undefined;
    let fired = 0;
    const controller = createLongPressController({
      delay: 500,
      schedule: (callback) => { scheduled = callback; return 1; },
      cancelScheduled: () => {},
    });

    controller.start(() => fired++);
    scheduled?.();
    scheduled?.();

    assert.equal(fired, 1);
    assert.equal(controller.consumeClick(), true);
    assert.equal(controller.consumeClick(), false);
  });

  it("does nothing after a cancelled press", () => {
    let scheduled: (() => void) | undefined;
    let fired = 0;
    const controller = createLongPressController({
      schedule: (callback) => { scheduled = callback; return 1; },
      cancelScheduled: () => {},
    });

    controller.start(() => fired++);
    controller.cancel();
    scheduled?.();

    assert.equal(fired, 0);
    assert.equal(controller.consumeClick(), false);
  });
});

describe("long-press selection", () => {
  it("adds an unselected bet and keeps selection mode active", () => {
    const result = toggleLongPressSelection(new Set(["a"]), "b");
    assert.deepEqual([...result.selectedIds], ["a", "b"]);
    assert.equal(result.isSelecting, true);
  });

  it("removes a selected bet and exits after the final selection", () => {
    const result = toggleLongPressSelection(new Set(["a"]), "a");
    assert.deepEqual([...result.selectedIds], []);
    assert.equal(result.isSelecting, false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `bun test extension/test/long-press.test.ts`

Expected: FAIL because `src/lib/longPress.ts` does not exist.

- [ ] **Step 3: Implement the controller and pure selection transition**

```ts
export interface LongPressController {
  start(callback: () => void): void;
  cancel(): void;
  finish(): void;
  consumeClick(): boolean;
  dispose(): void;
}

interface LongPressOptions {
  delay?: number;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout> | number;
  cancelScheduled?: (handle: ReturnType<typeof setTimeout> | number) => void;
}

export function createLongPressController(options: LongPressOptions = {}): LongPressController {
  const delay = options.delay ?? 500;
  const schedule = options.schedule ?? ((callback, ms) => window.setTimeout(callback, ms));
  const cancelScheduled = options.cancelScheduled ?? ((handle) => window.clearTimeout(handle as number));
  let timer: ReturnType<typeof setTimeout> | number | null = null;
  let suppressClick = false;

  const cancelTimer = () => {
    if (timer !== null) cancelScheduled(timer);
    timer = null;
  };

  return {
    start(callback) {
      cancelTimer();
      suppressClick = false;
      timer = schedule(() => {
        if (timer === null) return;
        timer = null;
        suppressClick = true;
        callback();
      }, delay);
    },
    cancel() {
      cancelTimer();
      suppressClick = false;
    },
    finish() {
      cancelTimer();
    },
    consumeClick() {
      const consumed = suppressClick;
      suppressClick = false;
      return consumed;
    },
    dispose() {
      cancelTimer();
      suppressClick = false;
    },
  };
}

export function toggleLongPressSelection(selectedIds: ReadonlySet<string>, betId: string) {
  const next = new Set(selectedIds);
  if (next.has(betId)) next.delete(betId);
  else next.add(betId);
  return { selectedIds: next, isSelecting: next.size > 0 };
}
```

- [ ] **Step 4: Wire pointer handling into the mobile bet cards**

Create one controller ref and pointer-origin ref in `MobileBets`. On primary `pointerdown`, start the controller with a callback that applies `toggleLongPressSelection`, updates both selection states, and calls `selectionHaptic()`. Cancel before activation when pointer movement exceeds 10 pixels, on pointer cancellation, or on pointer leave. On pointer up, call `finish()`. In the existing click handler, return early when `consumeClick()` is true; otherwise preserve the current tap behavior. Prevent the touch context menu and dispose the controller on unmount.

- [ ] **Step 5: Run focused tests and TypeScript**

Run: `bun test extension/test/long-press.test.ts`

Expected: PASS.

Run: `bun run lint`

Expected: PASS with no TypeScript errors.

---

### Task 2: Animated merged desktop summary bar

**Files:**
- Modify: `src/components/FilteredBetsSummary.tsx`
- Modify: `src/components/BetsManager.tsx`
- Modify: `extension/test/filtered-bets-summary.test.ts`

**Interfaces:**
- Extends: `FilteredBetsSummaryProps` with `footer?: ReactNode`
- Produces: `AnimatedMetricValue({ valueKey, children })`
- Consumes: the unchanged selected-bet summary input and existing bulk-action callbacks.

- [ ] **Step 1: Add failing rendering tests**

Extend `extension/test/filtered-bets-summary.test.ts` with a footer element and assert that:

```ts
assert.match(markup, /data-summary-footer/);
assert.match(markup, /2 apostas selecionadas/);
assert.match(markup, /data-motion-value=/);
```

Also render without a footer and assert that `data-summary-footer` is absent.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `bun test extension/test/filtered-bets-summary.test.ts`

Expected: FAIL because the summary ignores `footer` and metric values have no Motion wrapper.

- [ ] **Step 3: Add animated metric values and the optional footer**

Import `AnimatePresence`, `motion`, and `useReducedMotion` from `motion/react`. Render each metric value through a keyed wrapper:

```tsx
function AnimatedMetricValue({ valueKey, children }: { valueKey: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <span className="relative block overflow-hidden" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={valueKey}
          data-motion-value={valueKey}
          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="block"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
```

Change the summary shell to one bordered section containing the current metric grid and, when supplied:

```tsx
{footer && (
  <div data-summary-footer className="border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800 md:px-4">
    {footer}
  </div>
)}
```

Use formatted values as `valueKey` values so only changed metrics transition.

- [ ] **Step 4: Move desktop bulk actions into the summary footer**

Pass the current selection count, confirmation UI, and four bulk-action buttons through the new `footer` prop when `isSelecting && selectedBetIds.size > 0`. Remove the separate bordered bulk-action wrapper while preserving its callbacks, disabled states, copy, and responsive wrapping.

- [ ] **Step 5: Run focused tests and TypeScript**

Run: `bun test extension/test/filtered-bets-summary.test.ts`

Expected: PASS.

Run: `bun run lint`

Expected: PASS.

---

### Task 3: Pointer-safe desktop focus and full verification

**Files:**
- Modify: `src/components/BetsManager.tsx`

**Interfaces:**
- No public interface changes.

- [ ] **Step 1: Add a source-level regression assertion**

Add an assertion to the focused summary/selection test that reads `src/components/BetsManager.tsx` and verifies the bet-card class contains `focus-visible:ring-2` and no longer contains the old card fragment `focus:ring-2 focus:ring-emerald-500/40`.

- [ ] **Step 2: Run the test and verify RED**

Run: `bun test extension/test/filtered-bets-summary.test.ts`

Expected: FAIL while the card still uses the generic focus ring.

- [ ] **Step 3: Restrict card focus styling to keyboard focus**

Replace the card’s generic `focus:ring-2 focus:ring-emerald-500/40` utilities with:

```text
focus-visible:ring-2 focus-visible:ring-emerald-500/40
```

Keep `focus:outline-none`, the selected emerald border/ring, and all keyboard handlers unchanged.

- [ ] **Step 4: Run all verification**

Run: `bun test extension/test`

Expected: all tests pass.

Run: `bun run lint`

Expected: TypeScript exits successfully.

Run: `bun run build`

Expected: Vite, server bundle, extension archive, and app bundle complete successfully.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Review desktop and mobile acceptance criteria**

Confirm from the rendered code and browser behavior that desktop uses one shared summary/action surface, metric changes animate without layout jumps, pointer deselection leaves no outline, keyboard focus stays visible, mobile long-press toggles once, the release tap is suppressed, and the fixed mobile action bar remains present.

# Filtered Bets Financial Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a Portuguese financial summary beneath `/bets` filters that reflects the currently visible non-ignored bets.

**Architecture:** Add a pure calculator in `src/utils.ts`, then a single responsive React component that both desktop and mobile `/bets` screens render from their existing `filteredBets` collections. Keep filtering, navigation, and persistence unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Bun test.

## Global Constraints

- UI copy must be Portuguese.
- Exclude ignored bets from all summary values.
- Include real-money pending stake only as `(+… por liquidar)`; received and net result include resolved bets only.
- Freebet stakes are not money staked; their resolved return and net profit remain included.
- No dashboard redirect, API, database, or URL-contract changes.

---

### Task 1: Create the reusable summary calculation

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils.ts`
- Test: `extension/test/filtered-bets-summary.test.ts`

**Interfaces:**
- Produces `FilteredBetsSummary` with `settledStake`, `pendingStake`, `totalReturn`, `netProfit`, and `betCount`.
- Produces `calculateFilteredBetsSummary(bets: Bet[]): FilteredBetsSummary`.

- [ ] **Step 1: Write failing tests** for resolved real-money and risk-free stake, pending stake, freebet handling, and ignored bets.
- [ ] **Step 2: Run** `bun test extension/test/filtered-bets-summary.test.ts` and confirm it fails because the calculator is missing.
- [ ] **Step 3: Add the smallest typed calculator** that partitions non-ignored bets by `POR_LIQUIDAR` and rounds values to two decimals.
- [ ] **Step 4: Re-run** `bun test extension/test/filtered-bets-summary.test.ts` and confirm it passes.

### Task 2: Render the shared Portuguese summary in both `/bets` layouts

**Files:**
- Create: `src/components/FilteredBetsSummary.tsx`
- Modify: `src/components/BetsManager.tsx`
- Modify: `src/mobile/screens/MobileBets.tsx`
- Test: `extension/test/filtered-bets-summary.test.ts`

**Interfaces:**
- Consumes `FilteredBetsSummary` through `FilteredBetsSummary({ bets, currency })`.
- Desktop and mobile pass their already-filtered bet lists, so text search and every existing filter are included automatically.

- [ ] **Step 1: Extend the failing tests** with empty and pending-only summary cases.
- [ ] **Step 2: Run** `bun test extension/test/filtered-bets-summary.test.ts` and confirm the new assertions fail.
- [ ] **Step 3: Create the responsive component** with `Total apostado`, `Total recebido`, `Resultado líquido`, and `Apostas consideradas`; use neutral zero, emerald positive, and rose negative styling.
- [ ] **Step 4: Place it below the desktop filters and below the mobile count controls, before each bet list.**
- [ ] **Step 5: Re-run** `bun test extension/test/filtered-bets-summary.test.ts` and `npm run lint`.

### Task 3: Verify the feature end to end

**Files:**
- Test: `extension/test/filtered-bets-summary.test.ts`

- [ ] **Step 1: Run** `bun test extension/test`.
- [ ] **Step 2: Run** `npm run lint`.
- [ ] **Step 3: Run** `npm run build`.
- [ ] **Step 4: Manually confirm** desktop row and mobile 2×2 grid update after filters and text search, handle ignored bets, and display pending stake in parentheses.

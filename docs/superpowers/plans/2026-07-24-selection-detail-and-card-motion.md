# Selection Detail and Card Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove misleading known-result badges from selection details and smoothly reveal desktop card checkboxes.

**Architecture:** Keep result resolution and tinting unchanged, but render the badge only for `DESCONHECIDO`. Place the desktop checkbox outside an animated inner-content wrapper so Motion changes only the wrapper’s left padding.

**Tech Stack:** React 19, TypeScript, Motion, Tailwind CSS, Bun tests.

## Global Constraints

- Keep `DESCONHECIDO` explicit and accessible.
- Use `44px`, `180ms`, and `useReducedMotion`.
- Preserve mobile behavior and existing selection handlers.

---

### Task 1: Selection details and desktop card motion

**Files:**
- Modify: `src/components/BetsManager.tsx`
- Test: `extension/test/selection-display-result.test.ts`
- Test: `extension/test/bet-selection.test.ts`

- [ ] Add failing source/render assertions that known outcomes do not render badges, unknown does, and the desktop card uses an absolute checkbox plus a Motion padding wrapper.
- [ ] Run `bun test extension/test/selection-display-result.test.ts extension/test/bet-selection.test.ts` and confirm failure.
- [ ] Restrict `getSelectionResultBadge` to `DESCONHECIDO`; keep `selectionDetailClass` unchanged.
- [ ] Add an always-positioned checkbox layer and animate the inner card content between `paddingLeft: 0` and `44` over `0.18s`, using zero duration for reduced motion.
- [ ] Run the focused tests, `npm run lint`, and `npm run build`.

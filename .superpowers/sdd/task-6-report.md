# Task 6 report — selection detail and card motion

## Files changed

- `src/components/BetsManager.tsx`
- `extension/test/selection-display-result.test.ts`
- `extension/test/bet-selection.test.ts`

## Test-first record

- RED: `bun test extension/test/selection-display-result.test.ts extension/test/bet-selection.test.ts` — 15 pass, 2 fail. The badge helper still handled known results and the desktop card lacked the required relative outer target, absolute checkbox layer, and padding Motion wrapper.
- GREEN: `bun test extension/test/selection-display-result.test.ts extension/test/bet-selection.test.ts` — 17 pass, 0 fail.
- Final verification: `npm run lint && npm run build && git diff --check` — TypeScript check, Vite/esbuild build, and whitespace check passed.

## Self-review

- `getSelectionResultBadge` renders only the explicit amber `DESCONHECIDO` badge; known/pending/void/half results retain their existing `selectionDetailClass` tinting without badge markup.
- The desktop card remains the event and selection target. Its checkbox is conditionally rendered in an absolute left-side desktop layer, while one Motion wrapper contains both pre-existing content columns and interpolates `paddingLeft` between `0px` and `44px` over 180 ms (zero with reduced motion).
- No Motion layout, AnimatePresence, or positional translation was introduced. Existing handlers, outer card dimensions, and unrelated dirty changes were preserved.

## Concerns

None. No interactive browser visual pass was run.

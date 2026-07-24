# Task 3 Report — Stable Summary Layout

## Status

Implemented the stable desktop summary footer reservation and compact metric animation.

Commit: `2fd7d9a feat: stabilize selected bets summary layout`

## Changes

- Added the `reserveFooterSpace` opt-in to `FilteredBetsSummary`.
- Reserved the desktop `md:h-20` metrics row and `md:h-14` footer slot, including when no actions are rendered.
- Added summary compactness and metric-size data markers, with Motion typography transitions that respect reduced-motion preferences.
- Opted in only the desktop `BetsManager` caller; mobile retains its existing 2×2 layout and has no reserved footer slot.
- Replaced the footer test with the stable-layout contract.

## TDD Evidence

- RED: `bun test extension/test/filtered-bets-summary.test.ts` failed as expected because `data-summary-footer-slot` did not exist.
- GREEN: the same focused suite passed after the implementation.

## Verification

- `bun test extension/test/filtered-bets-summary.test.ts` — 8 pass, 0 fail.
- `bun test extension/test/filtered-bets-summary.test.ts extension/test/bet-selection.test.ts extension/test/long-press.test.ts` — 22 pass, 0 fail.
- `bun run lint` — passed (`tsc --noEmit`).
- `git diff --check` — passed.

## Notes

The brief's executable test and stated interface require `md:h-14`; the implementation uses that responsive utility so the slot reserves space only at desktop widths.

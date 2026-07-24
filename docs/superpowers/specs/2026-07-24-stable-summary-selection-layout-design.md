# Stable Summary Selection Layout Design

## Goal

Keep the filtered financial summary visually stable while selected-bet actions are shown, on both desktop and mobile.

## Approved behavior

- The shared `FilteredBetsSummary` remains a fixed, slightly taller height at desktop widths so its optional desktop action row has reserved space before selection begins.
- Desktop selection actions continue to render in the summary surface, but the metrics animate from their normal `text-sm` treatment to a compact `text-xs` treatment while actions are visible.
- The metric text transition uses the existing `motion/react` dependency and respects reduced-motion preferences.
- The responsive mobile 2×2 metrics layout remains intact. Its summary uses the same stable metric sizing contract without introducing a blank desktop action-row gap or layout jump.
- Existing number-change animation and freebet content stay unchanged.
- Desktop and mobile leave selection mode immediately whenever a deselection operation produces an empty selected-ID set.
- The empty-selection rule applies consistently to card clicks/taps, checkboxes, long presses, and “deselect filtered” actions. Existing completed bulk actions continue to clear selection and leave selection mode.
- Entering selection mode manually may still show zero selected bets until the user selects a card; the automatic exit is triggered when an existing selection is reduced to zero.

## Console findings

- `Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.` is produced by the Chrome extension bridge, not by the React mobile screen. It occurs when extension messaging targets a tab/content-script receiver that is no longer available, commonly after an extension reload.
- Chrome's `click handler took ... ms` entries are performance warnings rather than exceptions. The current mobile selection interaction changes selection state, which re-renders the list and recalculates the visible summary; this change avoids adding layout work to that interaction.
- This focused layout change does not alter extension messaging. Extension lifecycle handling should be a separate, reproducible debugging task if the runtime error persists outside extension reloads.

## Testing

- Extend the existing filtered-summary unit test to assert the stable-height and compact-selection-state classes/attributes.
- Extend selection-state tests to verify that removing the final selected ID exits selection mode and that removing only one of several IDs keeps selection mode active.
- Keep current summary, long-press, lint, and production-build verification.

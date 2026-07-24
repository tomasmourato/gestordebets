# Stable Summary Selection Layout Design

## Goal

Keep the filtered financial summary visually stable while selected-bet actions are shown, on both desktop and mobile.

## Approved behavior

- The shared `FilteredBetsSummary` keeps one fixed, slightly taller desktop height without permanently reserving an empty action row.
- With no selection, the four metrics expand vertically to occupy the entire summary surface.
- While selection mode is active, the metric area contracts, its values animate from `text-sm` to `text-xs`, and the action row appears inside the same unchanged outer height.
- The metric text transition uses the existing `motion/react` dependency and respects reduced-motion preferences.
- The responsive mobile 2×2 metrics layout remains intact. Its summary uses the same stable metric sizing contract without introducing a blank desktop action-row gap or layout jump.
- Existing number-change animation and freebet content stay unchanged.
- Only “Cancelar seleção” moves from the filter toolbar into the summary action row. “Selecionar filtradas” stays in the filter toolbar.
- Desktop and mobile leave selection mode immediately whenever a deselection operation produces an empty selected-ID set.
- The empty-selection rule applies consistently to card clicks/taps, checkboxes, long presses, and “deselect filtered” actions. Existing completed bulk actions continue to clear selection and leave selection mode.
- Manually entering selection mode is the only allowed empty-selection state; the summary row still exposes “Cancelar seleção” in that state. Automatic exit is triggered when an existing selection is reduced to zero.

## Console findings

- `Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.` is produced by the Chrome extension bridge, not by the React mobile screen. It occurs when extension messaging targets a tab/content-script receiver that is no longer available, commonly after an extension reload.
- Chrome's `click handler took ... ms` entries are performance warnings rather than exceptions. The current mobile selection interaction changes selection state, which re-renders the list and recalculates the visible summary; this change avoids adding layout work to that interaction.
- This focused layout change does not alter extension messaging. Extension lifecycle handling should be a separate, reproducible debugging task if the runtime error persists outside extension reloads.

## Testing

- Extend the existing filtered-summary unit test to assert full-height normal metrics, compact selection metrics, the conditional footer, and the unchanged outer height.
- Verify that only “Cancelar seleção” moves into the summary while “Selecionar filtradas” remains in the toolbar.
- Extend selection-state tests to verify that removing the final selected ID exits selection mode and that removing only one of several IDs keeps selection mode active.
- Keep current summary, long-press, lint, and production-build verification.

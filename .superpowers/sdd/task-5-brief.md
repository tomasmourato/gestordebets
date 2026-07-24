# Task 5 — Approved integrated selection rail

Implement the approved desktop financial-summary design in the existing React/Tailwind UI.

## Requirements

- Preserve the current fixed desktop outer height in both states (`md:h-36`). The card must never grow or shrink when selection mode changes.
- Without a selection rail, the four financial metrics must fill and vertically center within the entire card. There must be no reserved blank rail, divider, or empty slab.
- With selection mode active, render the contextual selection/action rail at the **top** of the same card, followed by a subtle divider and the four metrics below it.
- Keep the rail compact so the metrics remain comfortably readable. The metrics should animate from their normal size to the existing compact size over 180 ms when the rail appears.
- Animate the rail with a subtle fade/vertical entrance and exit over roughly 180 ms. Respect `prefers-reduced-motion`.
- Preserve all existing Lucide icons on Cancel, Edit, Ignore/Restore, Duplicate, Delete, and delete-confirmation controls.
- Rail layout on desktop:
  - selection count at the left;
  - Cancel selection and the remaining actions grouped toward the right;
  - Delete remains the only rose/destructive action.
- Preserve the existing bulk-action behavior, confirmation behavior, loading/disabled states, accessibility labels, financial calculations, and selected-bet summary behavior.
- Preserve the existing mobile 2×2 summary layout and mobile selection controls. This task changes the desktop integrated summary only.
- Keep light and dark theme support and current violet freebet styling.

## Test-first requirement

Update the focused summary/component-source tests first and run them to observe the expected failure before changing production code. Tests must cover:

- identical fixed outer height in both states;
- no rail markup without selection mode;
- rail precedes the metric grid when present;
- metrics fill the card without a rail and compact with one;
- compact top rail and 180 ms/reduced-motion behavior;
- Lucide icons remain present on bulk action buttons.

Then implement the minimum production change and run the focused test file.

## Scope

Expected files:

- `src/components/FilteredBetsSummary.tsx`
- `src/components/BetsManager.tsx`
- `extension/test/filtered-bets-summary.test.ts`

Do not edit unrelated files. The worktree contains user-owned changes: preserve them. Do not commit.

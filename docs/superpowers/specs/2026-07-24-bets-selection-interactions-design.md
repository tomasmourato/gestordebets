# Bets Selection Interactions Design

## Goal

Make bet selection feel immediate and coherent across desktop and mobile: remove the stale-looking desktop outline after mouse deselection, combine the desktop financial summary and bulk actions, animate changing summary values, and support mobile long-press selection.

## Desktop

The financial summary and bulk-selection actions share one bordered surface. The four summary metrics remain in their current responsive grid. When at least one bet is selected, the selection count and bulk actions appear in a footer separated by an internal top border. Existing bulk edit, ignore, duplicate, delete, and confirmation behavior remains unchanged.

Metric values use short Motion crossfade-and-slide transitions when their displayed values change. Animation respects the user's reduced-motion preference and does not delay interaction or calculation updates.

Bet cards keep the emerald border and ring only while selected. Keyboard navigation retains an accessible `focus-visible` ring, while pointer clicks and deselection do not leave a persistent focus outline.

## Mobile Long-Press

A press held for approximately 500 milliseconds toggles the held bet exactly once:

- Outside selection mode, it enters selection mode and selects that bet.
- With existing selections, it adds an unselected bet.
- On a selected bet, it removes that bet.
- Removing the final selected bet exits selection mode automatically.

The long-press provides haptic feedback. Releasing after a recognized long-press must not trigger the normal tap action, open bet details, or toggle the bet a second time. Continuing to hold beyond the activation threshold does nothing further. Pointer cancellation, movement away, and component unmount clear pending timers.

The existing fixed mobile bulk-action bar remains unchanged because it must stay reachable above bottom navigation.

## Component Boundaries

`FilteredBetsSummary` owns metric animation and accepts an optional desktop footer so the summary and bulk actions can share one surface without duplicating financial rendering. `BetsManager` supplies the existing bulk-action content through that footer.

Mobile long-press timing and click suppression live in a small reusable hook or utility with explicit callbacks. `MobileBets` supplies selection-mode behavior and keeps ordinary tap behavior unchanged.

## Accessibility and Testing

The merged surface keeps the existing financial-summary label and semantic action buttons. Motion is decorative and disabled or reduced for users requesting reduced motion. Keyboard focus remains visible on desktop cards.

Tests cover long-press activation, single firing, release-click suppression, cancellation, final-selection exit, the optional merged footer, and animated value wrappers. Existing calculator, selection-summary, filter URL, TypeScript, and production-build checks must continue to pass.

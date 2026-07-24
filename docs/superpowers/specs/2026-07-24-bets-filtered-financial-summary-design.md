# Filtered Bets Financial Summary Design

## Goal

Add an always-visible financial summary to `/bets` so users can immediately see how much they have staked, received, gained, or lost for the bets matched by the current filters and text search.

## Chosen Experience

The summary appears directly below the `/bets` filter controls. It does not redirect to the dashboard. This keeps the user in context and preserves `/bets`-only criteria such as status and text search.

The UI copy is Portuguese:

- `Total apostado`
- `Total recebido`
- `Resultado líquido`
- `Apostas consideradas`
- Pending exposure is appended to the settled stake as `(+25,00 € por liquidar)`.

Desktop uses one compact horizontal row. Mobile uses a responsive 2×2 grid in the same position between the controls and the bet list. The summary remains visible when no filters are active and when no bets match.

## Calculation Rules

The calculation input is the same collection used to render the current `/bets` list after applying all structured filters and text search. Sorting and bulk-selection checkboxes do not change the calculation.

Ignored bets remain visible in the history but are excluded from every summary value, matching the dashboard’s financial-statistics rule.

- `Total apostado`: sum of stakes from resolved, non-freebet bets.
- Parenthetical `por liquidar`: sum of stakes from pending, non-freebet bets.
- `Total recebido`: sum of `finalReturn` from resolved bets, including freebet returns.
- `Resultado líquido`: sum of `netProfit` from resolved bets, including freebets and risk-free bets according to their existing stored values.
- `Apostas consideradas`: number of non-ignored matched bets, including resolved and pending bets.

When no filter or search is active, the input is every non-ignored bet. When filters or search are active, only matching non-ignored bets count. An empty result displays `0,00 €` for money values and `0` for the count. The pending suffix is shown only when the pending stake is greater than zero.

All amounts use the existing `pt-PT` number formatting and the user’s configured currency. Positive net results use the existing emerald treatment, negative results use rose, and zero remains neutral.

## Architecture

Create a small pure summary calculator over a `Bet[]` so desktop and mobile share identical financial semantics. Keep it separate from dashboard-specific statistics because pending stake is deliberately exposed here while the dashboard omits pending bets from settled performance.

Render the result through one reusable responsive summary component. `BetsManager` and `MobileBets` each pass their already-filtered bets and current currency to it, avoiding a second implementation of filtering logic.

No route, query-string, database, or API changes are required. Dashboard navigation is out of scope for this version.

## Validation

Automated tests cover:

- no filters, active structured filters, and text search all use the visible matched set;
- ignored bets are excluded;
- resolved real-money and risk-free stakes count in `Total apostado`;
- freebet stakes do not count as money staked, while their resolved return and net profit do count;
- pending real-money stakes appear only in the parenthetical value;
- pending bets do not affect received or net-result totals;
- zero, positive, and negative results format and style correctly;
- desktop and mobile render the same values for the same input.

Manual verification checks Portuguese wording, light and dark themes, desktop row layout, mobile 2×2 layout, empty results, and immediate updates when filters or search change.

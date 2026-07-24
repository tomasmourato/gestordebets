### Task 3: Reserve the Desktop Summary Footer and Animate Compact Metrics

**Files:**
- Modify: `src/components/FilteredBetsSummary.tsx:1-139`
- Modify: `src/components/BetsManager.tsx:1060-1140`
- Modify: `extension/test/filtered-bets-summary.test.ts:65-98`

**Interfaces:**
- Consumes: existing `footer?: ReactNode`.
- Produces: new `reserveFooterSpace?: boolean`; when true, desktop renders an `md:h-20` metrics row and an always-present `md:h-14` footer slot.
- State markers: `data-summary-compact="true|false"`, `data-summary-metric-size="compact|normal"`, and `data-summary-footer-slot`.
- Mobile contract: omitting `reserveFooterSpace` renders no slot and retains the current 2×2 metrics grid.

- [ ] **Step 1: Replace the current footer test with the stable-layout contract**

In `extension/test/filtered-bets-summary.test.ts`, replace the test named `renders animated metric values and an optional action footer inside the summary surface` with:

```ts
it("reserves a stable desktop footer slot and compacts metrics only when actions are present", () => {
  const withFooter = renderToStaticMarkup(
    React.createElement(FilteredBetsSummary, {
      bets: [bet()],
      currency: "€",
      freebetOnly: false,
      reserveFooterSpace: true,
      footer: React.createElement("div", null, "2 apostas selecionadas"),
    }),
  );
  const withoutFooter = renderToStaticMarkup(
    React.createElement(FilteredBetsSummary, {
      bets: [bet()],
      currency: "€",
      freebetOnly: false,
      reserveFooterSpace: true,
    }),
  );
  const mobileLayout = renderToStaticMarkup(
    React.createElement(FilteredBetsSummary, {
      bets: [bet()],
      currency: "€",
      freebetOnly: false,
    }),
  );

  assert.match(withFooter, /data-summary-footer-slot/);
  assert.match(withoutFooter, /data-summary-footer-slot/);
  assert.match(withFooter, /md:h-20/);
  assert.match(withoutFooter, /md:h-20/);
  assert.match(withFooter, /md:h-14/);
  assert.match(withoutFooter, /md:h-14/);
  assert.match(withFooter, /data-summary-compact="true"/);
  assert.match(withFooter, /data-summary-metric-size="compact"/);
  assert.match(withFooter, /2 apostas selecionadas/);
  assert.match(withFooter, /data-motion-value=/);
  assert.match(withoutFooter, /data-summary-compact="false"/);
  assert.match(withoutFooter, /data-summary-metric-size="normal"/);
  assert.doesNotMatch(withoutFooter, /2 apostas selecionadas/);
  assert.doesNotMatch(mobileLayout, /data-summary-footer-slot/);
  assert.doesNotMatch(mobileLayout, /md:h-20/);
});
```

- [ ] **Step 2: Run the summary test and verify the new contract fails**

Run:

```bash
bun test extension/test/filtered-bets-summary.test.ts
```

Expected: existing financial/freebet tests PASS; the stable-layout test FAILS because `reserveFooterSpace` and the data markers do not exist.

- [ ] **Step 3: Add the reserved slot and metric-size motion**

In `src/components/FilteredBetsSummary.tsx`, extend the props:

```ts
interface FilteredBetsSummaryProps {
  bets: Bet[];
  currency: string;
  freebetOnly: boolean;
  footer?: ReactNode;
  reserveFooterSpace?: boolean;
}
```

Change the component signature and add its layout state immediately after the summary calculation:

```ts
export default function FilteredBetsSummary({
  bets,
  currency,
  freebetOnly,
  footer,
  reserveFooterSpace = false,
}: FilteredBetsSummaryProps) {
  const summary = calculateFilteredBetsSummary(bets);
  const reduceMotion = useReducedMotion();
  const compactMetrics = Boolean(footer);
```

Replace the component’s current return block with:

```tsx
return (
  <section
    aria-label="Resumo financeiro das apostas filtradas"
    data-summary-compact={compactMetrics ? "true" : "false"}
    className="overflow-visible rounded-sm border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
  >
    <div
      className={`grid grid-cols-2 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 md:grid-cols-4 md:divide-y-0 ${
        reserveFooterSpace ? "md:h-20" : ""
      }`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 px-3 py-3 md:flex md:flex-col md:justify-center md:px-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {item.label}
          </p>
          <motion.p
            data-summary-metric-size={compactMetrics ? "compact" : "normal"}
            initial={false}
            animate={{
              fontSize: compactMetrics ? "0.75rem" : "0.875rem",
              lineHeight: compactMetrics ? "1rem" : "1.25rem",
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`mt-1 font-mono font-bold tabular-nums ${item.className}`}
          >
            <AnimatedMetricValue valueKey={item.valueKey}>{item.value}</AnimatedMetricValue>
          </motion.p>
        </div>
      ))}
    </div>

    {reserveFooterSpace ? (
      <div
        data-summary-footer-slot
        className="hidden h-14 items-center overflow-visible border-t border-zinc-200 px-4 dark:border-zinc-800 md:flex"
      >
        <AnimatePresence initial={false} mode="wait">
          {footer ? (
            <motion.div
              key="summary-footer"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{
                duration: reduceMotion ? 0 : 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="w-full"
            >
              {footer}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    ) : footer ? (
      <div
        data-summary-footer
        className="border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800 md:px-4"
      >
        {footer}
      </div>
    ) : null}
  </section>
);
```

Do not change `AnimatedMetricValue`, `stakeValue`, the `items` array, or any money calculations. The outer desktop height is stable because both the `5rem` metric row and `3.5rem` footer slot exist before selection; only the footer contents and metric typography change.

- [ ] **Step 4: Opt the desktop caller into the reserved slot**

In the desktop `FilteredBetsSummary` call in `src/components/BetsManager.tsx`, add the prop:

```tsx
<FilteredBetsSummary
  bets={summaryBets}
  currency={currency}
  freebetOnly={freebetFilter === "FREEBET"}
  reserveFooterSpace
  footer={
    isSelecting && selectedBetIds.size > 0 ? (
```

Keep the existing desktop footer content and its bulk-action handlers unchanged.

Do not add `reserveFooterSpace` to `src/mobile/screens/MobileBets.tsx`; omission is what preserves the mobile 2×2 layout without a blank footer gap.

- [ ] **Step 5: Run the focused summary test**

Run:

```bash
bun test extension/test/filtered-bets-summary.test.ts
```

Expected: all summary calculation, freebet, selected-summary, stable-slot, and desktop focus tests PASS.

- [ ] **Step 6: Run selection and summary regression tests together**

Run:

```bash
bun test extension/test/filtered-bets-summary.test.ts extension/test/bet-selection.test.ts extension/test/long-press.test.ts
```

Expected: all focused tests PASS with no React server-render warnings.

- [ ] **Step 7: Commit the stable summary layout**

```bash
git add src/components/FilteredBetsSummary.tsx src/components/BetsManager.tsx extension/test/filtered-bets-summary.test.ts
git commit -m "feat: stabilize selected bets summary layout"
```

---


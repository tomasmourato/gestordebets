### Task 4: Full Verification and Responsive Visual Check

**Files:**
- Verify: `src/lib/betSelection.ts`
- Verify: `src/lib/longPress.ts`
- Verify: `src/components/FilteredBetsSummary.tsx`
- Verify: `src/components/BetsManager.tsx`
- Verify: `src/mobile/screens/MobileBets.tsx`
- Verify: `extension/test/bet-selection.test.ts`
- Verify: `extension/test/long-press.test.ts`
- Verify: `extension/test/filtered-bets-summary.test.ts`

**Interfaces:**
- Consumes: all implementation from Tasks 1–3.
- Produces: verified production bundle and a checked interaction matrix for desktop/mobile, light/dark, and reduced-motion behavior.

- [ ] **Step 1: Run the complete unit test suite**

Run:

```bash
npm run test:unit
```

Expected: every test under `extension/test` PASS.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
npm run lint
```

Expected: `tsc --noEmit` exits with code 0.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: Vite client build, bundled server build, extension archive, and app bundle all complete with exit code 0.

- [ ] **Step 4: Start the app for responsive verification**

Run:

```bash
npm run dev
```

Expected: the local server starts and prints its listening URL without a compilation error.

- [ ] **Step 5: Verify the desktop layout and every deselection path**

At a desktop viewport of at least `1024px`, in both light and dark themes:

1. Record the summary section’s outer height before entering selection.
2. Manually enter selection mode with zero selected bets; verify that the normal-size metrics remain and the summary height does not change.
3. Select one bet by card click; verify the footer appears inside the reserved slot, metrics animate smaller, and the outer height remains identical.
4. Deselect that bet by card click; verify selection mode exits, the footer disappears, and metrics return to normal size.
5. Repeat the final deselection with the card checkbox.
6. Repeat the final deselection with a 500 ms card hold; verify the release click remains suppressed.
7. Select two bets and remove one; verify selection mode and the footer remain active with one selected bet.
8. Select every filtered bet, press “Desmarcar filtradas,” and verify selection mode exits when no IDs remain.
9. Select one filtered and one subsequently hidden bet, then deselect the visible filtered set; verify selection mode remains active because the hidden selected ID still exists.
10. Enable the operating system/browser reduced-motion preference and repeat a selection; verify metric/footer changes are immediate rather than animated.

- [ ] **Step 6: Verify the mobile lifecycle and unchanged summary layout**

At a mobile viewport around `390×844`, in both light and dark themes:

1. Verify the financial summary remains the existing 2×2 grid with no blank action-row gap.
2. Manually enter selection mode with zero selected bets; verify the temporary zero-selection state is allowed.
3. Select and then tap the same card; verify the final deselection exits mode, removes the fixed action bar, and restores the add-bet FAB.
4. Repeat using a 500 ms long press on the selected card.
5. Select two cards and remove one; verify selection mode remains active.
6. Use “Desmarcar filtradas” with all selected IDs visible; verify selection mode exits.
7. Leave one selected ID hidden by filters and deselect the visible filtered IDs; verify selection mode stays active.
8. Verify no new `click handler took ... ms` work is attributable to summary layout growth; the extension receiver warning remains outside this task.

- [ ] **Step 7: Review the final diff for scope and accidental files**

Run:

```bash
git status --short
git diff -- src/lib/betSelection.ts src/lib/longPress.ts src/components/FilteredBetsSummary.tsx src/components/BetsManager.tsx src/mobile/screens/MobileBets.tsx extension/test/bet-selection.test.ts extension/test/long-press.test.ts extension/test/filtered-bets-summary.test.ts
```

Expected: only the planned selection and summary changes are present in the reviewed diff; unrelated existing worktree changes remain untouched.

- [ ] **Step 8: Commit any verification-only corrections**

If visual verification required a correction within the planned files, rerun Steps 1–3 and commit only those corrections:

```bash
git add src/lib/betSelection.ts src/lib/longPress.ts src/components/FilteredBetsSummary.tsx src/components/BetsManager.tsx src/mobile/screens/MobileBets.tsx extension/test/bet-selection.test.ts extension/test/long-press.test.ts extension/test/filtered-bets-summary.test.ts
git commit -m "fix: polish stable selection summary"
```

If no correction was required, do not create an empty commit.

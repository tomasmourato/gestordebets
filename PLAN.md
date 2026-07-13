# Implementation Plan

Companion to [TODO.md](TODO.md). Nothing here is implemented yet — this is the "how".

**Effort legend:** S = under half a day · M = 1–2 days · L = 3+ days.
Each item: _Goal · Current state · Approach · Files · Data/migration · Risks · Effort · Depends on_.

The single most important insight from the TODO + the `FullCashout` screenshot: **three features (manual cashout, extension cashout import, and correct freebet math) all sit on top of two data-model changes.** Build those foundations first (F1, F2, F3) and the feature items become small. Doing the features ad-hoc first would mean reworking the data model twice.

---

## Foundations (do these first)

### F1 — Cashout as a first-class settled outcome
- **Goal:** represent a cashed-out bet, whose return is an arbitrary amount the user (or bookie) sets, not `stake × odd`.
- **Current:** `BetStatus` has 6 values; `calculateBetReturnAndProfit` always derives `finalReturn`/`netProfit` from `stake`, `odd`, `status`. There is no way to store "settled for €5.63 regardless of outcome". The `FullCashout` in the screenshot has no home → the extension currently maps it to `POR_LIQUIDAR` (wrong).
- **Approach:** add a `CASHOUT` status. For that status, `finalReturn` becomes a **user-supplied editable value** and `netProfit = finalReturn − stake` (for freebets, `netProfit = finalReturn`). `calculateBetReturnAndProfit` gains a `cashoutReturn?` parameter and, when `status === "CASHOUT"`, returns that instead of computing. The `final_return`/`net_profit` columns already exist and are stored explicitly, so no new column is strictly required — but add `cashout_return DECIMAL` (nullable) to keep intent explicit and survive edits.
- **Blast radius of any new status** (checklist — applies to `CASHOUT`):
  - `src/types.ts` — add to `BetStatus` union.
  - `src/utils.ts` — `calculateBetReturnAndProfit` (new branch) + `calculateDashboardStats` (count it as settled; decide win-rate treatment) .
  - `routes/betsRoutes.ts` — `VALID_STATUSES` array; `parseBetPayload` (accept `cashoutReturn`).
  - `db/migrations/003_add_cashout_status.sql` — extend the `bets_status_check` CHECK to include `'CASHOUT'`; `ADD COLUMN IF NOT EXISTS cashout_return`; update `db/schema.sql`.
  - `src/components/BetsManager.tsx` — status dropdown option + `getStatusBadge` case + a "Retorno do cashout" input shown when status = CASHOUT.
  - `src/components/ScreenshotImporter.tsx` — status option.
  - `src/components/Dashboard.tsx` — `statusData` slice + color + legend.
  - `extension/src/mapper.js` — `STATUS_MAP` (`FullCashout`/`PartialCashout` → `CASHOUT`) and use Betclic's real payout (`winning_details` TOTAL, or top-level `winnings`) as `cashoutReturn` instead of computing.
- **Dashboard stat decisions to make:** cashout counts as settled; it is neither a "win" nor "loss" for win-rate (treat like `ANULADA` — exclude from the win-rate divisor), but its `netProfit` **does** count toward profit/ROI/yield. Document this in `calculateDashboardStats`.
- **Risks:** win-rate/ROI definitions get subtle; a partial cashout (bet partially cashed, remainder runs) is a harder case — scope v1 to **full** cashout only, note partial as future.
- **Effort:** M · **Depends on:** nothing.

### F2 — Structured bookmaker registry
- **Goal:** replace the flat `AVAILABLE_BOOKMAKERS: string[]` with first-class bookie objects carrying rules (freebet behaviour, later: colors/logos), so freebet types, dashboard filters, and multi-bookie extension all share one source of truth.
- **Current:** `AVAILABLE_BOOKMAKERS` in `src/utils.ts` is a plain string array; bookmaker on a bet is a free-text string.
- **Approach:** new `src/lib/bookmakers.ts` exporting `interface Bookmaker { id: string; name: string; defaultFreebetType: "SNR" | "SR"; allowsFreebetCashout?: boolean }` and a `BOOKMAKERS` array (Betano, Betclic, Placard, Bwin, Solverde, Nossa Aposta, Casino Portugal, "Outra"), with defaults from the F3 research table (Betclic → SR, rest → SNR). Keep bet.bookmaker as the display string for backward-compat, but resolve it to a registry entry by name. No DB change (bets still store the bookmaker string).
- **Files:** new `src/lib/bookmakers.ts`; `src/utils.ts` re-exports for compat; consumers (`BetsManager`, `ScreenshotImporter`, `Settings`, `Dashboard` filters) read from it.
- **Risks:** name-matching drift (e.g. "Placard.pt" vs "Placard") — reuse the `matchBookmaker` fuzzy logic already in `ScreenshotImporter.tsx`; centralize it here.
- **Effort:** S–M · **Depends on:** nothing.

### F3 — Freebet types (typed, per-bookie default) — *researched*
- **Goal:** model that freebets pay differently across bookies, and fix the current math.

- **The two payout types that matter (researched):**
  - **`SNR` (Stake Not Returned)** — the near-universal industry standard. On win you receive **only the profit**, not the freebet stake. `finalReturn = (odd − 1) × stake`, `netProfit = (odd − 1) × stake`. Example: €10 freebet @ 3.0 → €20, not €30.
  - **`SR` (Stake Returned / "returnable stake")** — the freebet pays out like cash, stake included. `finalReturn = odd × stake`, `netProfit = odd × stake` (no cash was risked). Example: €10 freebet @ 3.0 → €30. **This is what the current code already does for all freebets**, and per the user's instruction it is the **Betclic** default.
  - *"Risk-free / Aposta Sem Risco" (e.g. Bwin's headline offer) is NOT a payout type* — it's a **cash** bet that, if it loses, is refunded **as** a freebet. In P&L terms the qualifying bet is a normal cash bet, and the refund is a separate freebet entry (typically SNR when used). So it lives upstream of this enum, not inside it. Keep the enum to `SNR | SR`.

- **Current bug (confirmed):** `src/utils.ts` computes every won freebet as `netProfit = stake × odd` (= SR). Since most bookies are SNR, the app **overstates SNR-freebet win profit by exactly one stake**. Betclic being SR means Betclic bets are already correct and must not change.

- **Key architectural insight from the research:** per-bookie freebet behaviour is **not reliably knowable from the open web** (see reliability note below), *but the app doesn't actually need to guess for imported bets* — the bookie's own data already states the real payout. Betclic's API returns `winning_details`/`winnings` (the actual cash credited); the Gemini screenshot reads the printed return. So:
  - **Imported settled bets → trust the bookie's actual payout** (derive `netProfit` from the real returned amount), *not* from a freebet-type formula. This sidesteps the whole "which type is this bookie" problem for the common case.
  - **The freebet type is really for (a) manual entry and (b) pending-freebet potential-return display**, where no actual payout exists yet.

- **Per-bookie default (defaults only — user-overridable per bet):**

  | Bookie | Default type | Confidence | Basis |
  | --- | --- | --- | --- |
  | **Betclic** | **SR** | n/a (decided) | user instruction; current code already SR; loosely corroborated by captured `winning_details` on a boosted freebet |
  | Betano | SNR | Medium | official-ish copy: "apenas o lucro líquido é creditado (retorno total menos a stake gratuita)" — **but sources were Brazilian (R$/CPF)**, not PT |
  | Bwin | SNR | Medium | headline offer is risk-free→freebet refund; the resulting freebet pays "lucros líquidos… saldo real" (net winnings only = SNR) |
  | Placard | SNR | Low | one affiliate page implied SR ("ganhará o valor + os ganhos"), but low-reliability; SNR is the safer default. Also: **Placard freebets cannot be cashed out** |
  | Solverde | SNR | Low | freebets exist (3×€10); no stake-return detail found |
  | Nossa Aposta | SNR | Very low | freebet on registration; no mechanic detail found |
  | Casino Portugal | SNR | Very low | freebet on registration; no mechanic detail found |
  | *Outra / unknown* | SNR | — | SNR is the industry standard = safest default |

  **Reliability caveat:** all per-bookie data came from affiliate/marketing sites (SEO-driven, region-mixed PT/BR, occasionally contradictory). Treat the table as **defaults, not truth**. The only authoritative sources are each bookie's official **Terms & Conditions** or the user's own **settled-payout data** (which the importer already has). Before hard-coding a non-SNR default for any bookie other than Betclic, confirm against its T&C or a real settled freebet.

- **Approach:** `type FreebetType = "SNR" | "SR"`. Add `freebetType?: FreebetType` to `Bet` (default resolved from the bookie's registry entry when `isFreebet` is set; `SNR` when unknown). `calculateBetReturnAndProfit` branches: SNR win → `(odd−1)×stake`; SR win → `odd×stake` (current behaviour). Loss/void unchanged (0 / stake returned). The manual form shows a freebet-type selector (defaulted from the bookie) when "Freebet" is checked; also **hide/disable cashout when `isFreebet`** (freebets generally can't be cashed out).
- **Files:** `src/types.ts` (Bet + FreebetType); `src/utils.ts` (calc); `db/migrations/004_add_freebet_type.sql` (`ADD COLUMN IF NOT EXISTS freebet_type TEXT`) + `db/schema.sql`; `routes/betsRoutes.ts` (`parseBetPayload`); `src/lib/bookmakers.ts` (per-bookie default from F2); `src/components/BetsManager.tsx` + `ScreenshotImporter.tsx` (type selector).
- **Risks / historical safety:** this changes how freebet P&L computes. Because `net_profit` is a **stored** column: (1) **Betclic** freebets are SR and unchanged; (2) migrate any existing **non-Betclic** freebets to `SR` too so their stored numbers don't retroactively shift, and apply the SNR default only to **new** bets — or, since the app is new with little freebet history, simply leave stored values intact and recompute lazily. Decide before shipping.
- **Effort:** M · **Depends on:** F2 (per-bookie defaults; the calc itself can land first).

---

## Manual Import (TODO §1)

### M1 — Multiple freebet types linked to bookie
- Realized by **F2 + F3**. Remaining UI work: in `BetsManager.tsx`, when "Freebet" is checked, show a "Tipo de freebet" dropdown populated from the selected bookie's `freebetRules`, defaulted to its `defaultFreebetRuleId`. Live-preview box already recomputes via `calculateBetReturnAndProfit`.
- **Effort:** S (on top of F2/F3) · **Depends on:** F2, F3.

### M2 — Cashout with editable return
- Realized by **F1**. Remaining UI work: status dropdown gains "Cashout"; when selected, reveal a "Retorno do cashout (€)" input; the preview box shows `netProfit = cashoutReturn − stake`. Reuse existing form validation patterns.
- **Effort:** S (on top of F1) · **Depends on:** F1.

---

## Gemini Import (TODO §2)

### G1 — Read multiple bets from one screenshot
- **Goal:** a screenshot with several betslips yields several bets.
- **Current:** `server.ts` `/api/parse-screenshot` `responseSchema` returns a **single** bet object; `ScreenshotImporter.tsx` shows a single-bet verification form.
- **Approach:** wrap the schema in `{ type: ARRAY, items: <existing bet object> }` (or `{ bets: [...] }`); update `systemInstruction` to "extract every distinct betslip". Rework the verification step into a **list** of editable bet cards with per-bet confirm and a "confirm all" (each still goes through the same map + `calculateBetReturnAndProfit`). Import via the existing `/api/bets/bulk`.
- **Files:** `server.ts` (schema + prompt); `src/components/ScreenshotImporter.tsx` (state becomes `parsedBets: [...]`, verification list UI). No DB change.
- **Risks:** larger responses risk Vercel function timeout (already retries 3×, models `gemini-2.5-flash`→`1.5-flash`); token/latency grows with bet count — cap at, say, 20 bets/screenshot. Verification UI is the bulk of the work.
- **Effort:** M · **Depends on:** ideally F1 (so multi-bet extraction can also carry cashout), but can ship independently.

---

## Extension (TODO §3)

### E1 — Import cashed-out bets (the screenshot)
- **Goal:** `FullCashout` bets import correctly instead of becoming "por liquidar".
- **Approach:** in `extension/src/mapper.js`, map `FullCashout`/`PartialCashout` → `CASHOUT` and set `cashoutReturn` from `winning_details` (`TOTAL`/`NET_WIN`, unit CASH) or top-level `winnings`. Requires F1 to exist app-side (status + field + backend acceptance).
- **Files:** `extension/src/mapper.js`. · **Effort:** S · **Depends on:** F1.

### E2 — Multiple bookies (adapter architecture)
- **Goal:** the extension supports Betano, Placard, etc., not just Betclic.
- **Current:** everything is Betclic-specific — `inject.js` matches `begmedia`+`/me/bets`, `mapper.js` is Betclic-shaped, `manifest.json` host_permissions/matches are Betclic/begmedia.
- **Approach:** introduce a **bookie-adapter interface** — `{ id, siteMatch, isBetsRequest(url), apiBaseFrom(url), endpoints, mapBet(raw) }`. `inject.js` becomes generic (capture token + base for whichever adapter's `isBetsRequest` matches); `background.js` selects the adapter and its `mapBet`. Each new bookie = one adapter file + a `host_permissions`/`content_scripts` match + its recon.
- **Hard dependency — recon per bookie:** each bookie's private API must be discovered the way Betclic was (DevTools → find the bets endpoint + response shape). **You** must capture that (I don't log into bookie accounts); then the adapter + mapper are mechanical.
- **Files:** new `extension/src/adapters/*.js`; refactor `inject.js`, `background.js`, `mapper.js`; `manifest.json` (+hosts). App-side `mapBetFromApi` already round-trips `metadata`, so dedup by `metadata.ref` generalizes for free.
- **Risks:** each bookie can change its API anytime (fragile); ToS (see Risks section).
- **Effort:** L (framework) + M per additional bookie · **Depends on:** F2 (shared bookie identity), and per-bookie recon.

### E3 — Auto-import on bookie login + extension login
- **Goal:** with the extension installed, logging into a bookie auto-imports; and the extension works **without the BetTrackr site open**.
- **Current:** the BetTrackr JWT is read from the app's `localStorage` by `content-bettrackr.js` — so the app must have been opened. Import is manual (popup button or in-app button).
- **Approach, two parts:**
  1. **Extension login:** add an email/password form to the popup that calls `POST /api/auth/login` and stores **only the returned JWT** (7-day expiry) in `chrome.storage`. Background uses that token, removing the "site must be open" requirement. (You, the user, typing your own BetTrackr password into your own installed extension is fine — but store the JWT, never the password, and only over HTTPS.)
  2. **Auto-import:** cleanest trigger is not URL-guessing but the token-capture we already have — when `inject.js` captures a fresh bets token **and** an "auto-importar" toggle (in `chrome.storage`) is on, `background.js` runs the import automatically (debounced, e.g. once per 10 min per bookie). Add a toggle in the popup. Optionally `chrome.webNavigation`/`tabs` to nudge, but token-capture-driven is simpler and needs no new broad permission beyond what exists.
- **Files:** `extension/popup.*` (login form + toggle), `extension/src/background.js` (login call, auto-run, debounce), `manifest.json` (maybe `tabs`/`webNavigation` if URL-triggered).
- **Risks:** **security** — storing a JWT in extension storage is a real credential; scope/label it, rely on 7-day expiry, add a "sair" that clears it. **ToS** — auto-fetching on every login is more clearly "automated access" than a manual click (see Risks). Make auto-import **opt-in, off by default.**
- **Effort:** L · **Depends on:** E2 ideally (so auto-import is per-adapter), F1 (cashout completeness).

---

## Dashboard (TODO §4)

### D1 — Fix "Distribuição de Resultados" count (confirmed bug)
- **Bug:** `Dashboard.tsx` `statusData` (line ~192) includes a **"Pendente"/`POR_LIQUIDAR`** slice, but the donut's center number (line ~422) is `bets.filter(b => b.status !== "POR_LIQUIDAR").length` labelled **"Resolvidas"**. The slices therefore total more than the center number → visible mismatch.
- **Fix (recommended):** remove the `POR_LIQUIDAR` entry from `statusData` — a "distribution of **results**" shouldn't include bets with no result. Center "Resolvidas" then equals the sum of slices, and the legend only lists settled statuses. (Alternative: keep pending and relabel center to "Total" counting all — weaker, since the card is about results.)
- **Also:** when F1 lands, add the `CASHOUT` slice here.
- **Files:** `src/components/Dashboard.tsx` only. · **Effort:** S · **Depends on:** nothing (do it now).

### D2 — Dashboard filters (bookie, sport, bet type, …)
- **Goal:** filter the whole dashboard to a subset (by bookie, sport, type, freebet, date range) and recompute all stats/charts from that subset.
- **Current:** `Dashboard` computes everything from the full `bets` prop via `useMemo`.
- **Approach:** a filter bar at the top of `Dashboard.tsx` holding filter state; derive `filteredBets` once and feed it to `calculateDashboardStats` and every chart `useMemo`. Sport comes from `selection.sport` (already captured, incl. by the Betclic importer); bookie from F2; type/freebet from the bet. `BetsManager.tsx` already has a similar filter toolbar — extract a shared `<FilterBar>` to avoid duplication.
- **Files:** `src/components/Dashboard.tsx`; optional shared `src/components/FilterBar.tsx` (refactor from `BetsManager`).
- **Risks:** multi-sport multiples (a bet with mixed sports) — decide "matches if any selection matches". Empty-filter states.
- **Effort:** M · **Depends on:** F2 (nice for the bookie filter); otherwise independent.

---

## Configurations (TODO §5)

### C1 — Language options (i18n)
- **Goal:** switch app language (e.g. PT/EN).
- **Current:** every component has hard-coded Portuguese — `App`, `Dashboard`, `BetsManager`, `Settings`, `ScreenshotImporter`, `AuthPage`, `BetclicImport`. Number/currency uses `toLocaleString("pt-PT")` in places.
- **Approach:** adopt **react-i18next** (handles interpolation + pluralization, which a hand-rolled dict won't). Add `language: 'pt' | 'en'` to `Preferences` (stored in `g_prefs` next to `theme`; a matching `usePreferences` change + a selector in `Settings`). Extract strings into `src/locales/pt.json` / `en.json`. Locale-aware number/currency formatting should follow the chosen language. Phase the extraction: nav/labels/buttons first, then forms, then charts/tooltips.
- **Files:** add `i18next` + `react-i18next` deps; `src/i18n.ts` init; `src/locales/*.json`; `main.tsx` (provider); `usePreferences.ts` + `types.ts` (language pref); `Settings.tsx` (selector); then every component (`t("…")`).
- **Risks:** large surface, easy to miss strings; translation quality; keeping keys tidy. Not hard, just broad and tedious.
- **Effort:** L · **Depends on:** nothing (isolated), but do it when the feature set is stable so you're not translating strings that are about to change.

---

## Recommended sequence

1. **D1** — Distribuição bug (S, isolated, immediate win).
2. **F1** — Cashout data model (M) → unlocks **M2** and **E1** (both S right after).
3. **F2** — Bookmaker registry (S–M) → unlocks freebet defaults + filters + multi-bookie.
4. **F3 + M1** — Freebet rules + manual UI (M) — fixes the SNR profit overstatement.
5. **D2** — Dashboard filters (M).
6. **G1** — Gemini multi-bet (M, independent — can slot anywhere).
7. **E2** — Extension adapter framework (L) + per-bookie recon (yours) → then each bookie is M.
8. **E3** — Extension login + opt-in auto-import (L).
9. **C1** — i18n (L, last, when strings are stable).

Fast, high-value first slice: **D1 + F1 + M2 + E1** (fix the visible bug and make cashout work end-to-end, manual and via the extension).

---

## Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix)

This is the first thing we build: **D1 + F1 + M2 + E1**. Investigating the real code shrank it a lot — the win is that `final_return` and `net_profit` are already **stored** columns, so a cashout's amount simply *is* `finalReturn`; no new column, and the backend barely changes.

**Order of edits (each independently compiles):**

**1. Database — migration 003 (run on Supabase before deploying code).**
`db/migrations/003_add_cashout_status.sql` — idempotent, re-adds `CASHOUT` to the status CHECK (migration 002 had removed it):
```sql
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_status_check;
ALTER TABLE bets ADD CONSTRAINT bets_status_check CHECK (
  status IN ('POR_LIQUIDAR','GANHA','PERDIDA','ANULADA','MEIO_GANHA','MEIO_PERDIDA','CASHOUT')
);
```
Also update `db/schema.sql`'s inline CHECK to include `'CASHOUT'`. **No new column** (cashout amount lives in the existing `final_return`).

**2. Backend — `routes/betsRoutes.ts`, one line.** Add `"CASHOUT"` to the `VALID_STATUSES` array. That's the whole backend change — `parseBetPayload` already accepts/stores `finalReturn`/`netProfit`, and `BET_COLUMNS`/INSERT/UPDATE already carry them. *(Without this line, `parseBetPayload` silently coerces `CASHOUT` → `POR_LIQUIDAR`.)*

**3. `src/types.ts`.** Add `'CASHOUT'` to `BetStatus`. **No new `Bet` field** — the cashout amount is `finalReturn`; the form's cashout input is transient state.

**4. `src/utils.ts` — `calculateBetReturnAndProfit`.** Add an optional 5th param `cashoutReturn?: number` (keeps the 4 non-cashout call sites unchanged; refactor to an options object later when F3 adds `freebetType`). New branch:
```
if (status === "CASHOUT") {
  potentialReturn = stake * odd;            // what it would've paid if left to run
  finalReturn = cashoutReturn ?? 0;         // the agreed cashout amount
  netProfit = finalReturn - (isFreebet ? 0 : stake);
}
```
**`calculateDashboardStats` needs NO change** (verified): cashout is non-`POR_LIQUIDAR`, so its `netProfit`/`finalReturn`/`stake` already feed profit/ROI; it isn't in any win/loss bucket, so it's correctly excluded from the win-rate divisor. (Optional polish: add a `cashoutBets` counter for display — not required for correctness.)

**5. `src/components/BetsManager.tsx`.**
- Add `formCashoutReturn` state (string, like `formStake`).
- Status dropdown: add `<option value="CASHOUT">Cashout</option>`.
- When `formStatus === "CASHOUT"`, reveal a "Retorno do cashout (€)" number input bound to `formCashoutReturn`; hide it otherwise. (Also: when `formIsFreebet`, cashout is unusual — allow but note.)
- The two `calculateBetReturnAndProfit(...)` calls (preview memo ~L84, submit ~L234) pass `parseFloat(formCashoutReturn) || 0` as the 5th arg.
- `getStatusBadge`: add a `CASHOUT` case (e.g. amber/violet "Cashout" pill).
- `openEditModal`: seed `formCashoutReturn` from `bet.finalReturn` when `bet.status === "CASHOUT"`.

**6. `src/components/Dashboard.tsx` — this folds in D1.**
- In `statusData`: **remove the `POR_LIQUIDAR`/"Pendente" entry** (the D1 fix — a *results* chart shouldn't include unsettled bets; center "Resolvidas" then equals the slice sum) and **add** `{ name: "Cashout", value: statusCounts.CASHOUT, color: "#8B5CF6" }` with a `CASHOUT: 0` counter.
- Nothing else — the center count `bets.filter(b => b.status !== "POR_LIQUIDAR").length` already includes cashouts.

**7. `extension/src/mapper.js` — E1.**
- `STATUS_MAP`: add `FullCashout: "CASHOUT"`, `PartialCashout: "CASHOUT"`.
- In `mapBet`, when status is `CASHOUT`, derive the real amount from Betclic's own data and pass it through: `cashoutReturn = winning_details.find(d => d.type === "TOTAL" && d.unit === "CASH")?.amount ?? winnings`, then `finalReturn = cashoutReturn`, `netProfit = cashoutReturn - (isFreebet ? 0 : stake)`. Mirror the same `CASHOUT` branch into the ported `calc()`.
- The screenshot's example checks out: stake 5.93, `TOTAL` 5.63 → netProfit −0.30 (a small loss cashed out), instead of today's wrong `POR_LIQUIDAR`.

**8. `src/components/ScreenshotImporter.tsx` (optional for slice 1).** Add the `CASHOUT` status option + a cashout-return input mirroring BetsManager, so screenshot imports can be marked cashout. Can defer to a follow-up if we want slice 1 tighter.

**Sync:** apply the same to `_testv/` per the established two-folder rule.

**Verification (before/after building):**
- `npx tsc --noEmit` + `npm run build` green in both folders.
- Run migration 003 on Supabase; confirm via `information_schema`/constraint check that `CASHOUT` is allowed.
- Live round-trip: `POST /api/bets` a `CASHOUT` bet (status CASHOUT, finalReturn 5.63, netProfit −0.30) with a throwaway account → `GET /api/bets` returns it intact → delete. (Reuse the curl+cleanup pattern from the earlier bulk-import verification.)
- Extension: run the shipped `mapper.js` against the `FullCashout` screenshot JSON → assert status `CASHOUT`, netProfit −0.30.
- Manual UI: create a cashout bet in the form, confirm the preview and the dashboard pie/center reconcile.

**Not in slice 1:** F2/F3 (bookmaker registry, freebet types), partial-cashout remainder handling, Gemini multi-bet, filters, i18n.

---

## Cross-cutting risks & notes

- **New-status discipline:** every new `BetStatus` (i.e. `CASHOUT`) must touch the full blast-radius checklist in F1, **including a migration to widen the `bets_status_check` CHECK constraint** — the last import bug was exactly a status the DB constraint rejected. Migrations are append-only in `db/migrations/` (001, 002 exist; next is 003) and must be idempotent; also update `db/schema.sql` for fresh installs.
- **Historical-data safety:** F3 changes how freebet P&L is computed. Because `net_profit`/`final_return` are stored columns, migrate existing freebets to a rule that preserves their current numbers; apply new defaults only to new bets.
- **Extension ToS (E2/E3):** automated, multi-bookie, auto-on-login fetching is more squarely against bookies' "no automated access" terms than a manual click. Keep auto-import **opt-in and off by default**, and keep it personal-use/own-data. This is your call to make with eyes open.
- **Extension security (E3):** store the BetTrackr **JWT only** (never the password), rely on its 7-day expiry, provide a logout that clears storage, HTTPS only.
- **Two folders:** `_testv` (scratch) and `gestão-de-apostas` (deployed). Keep them in sync per change, as done so far.
- **Per-bookie recon is a hard external dependency** for E2 — the adapter code is easy; discovering each bookie's private API requires you to capture it from your own logged-in session.

---

## Appendix — freebet research sources (F3)

Consulted July 2026. **All bookie-specific pages are affiliate/marketing content** — used only to infer defaults, not as authoritative rules. Authoritative = each bookie's official T&C or the user's own settled-payout data.

- SNR vs SR mechanics (industry standard): [gamblingcalc.com free-bet calculator](https://gamblingcalc.com/betting/free-bet-matched-calculator/), [tipstercompetition.com — "Stake Not Returned" explained](https://tipstercompetition.com/article/what-does-stake-not-returned-mean), [freebetoffers.co.uk — do you get stakes back](https://freebetoffers.co.uk/info/do-you-get-stakes-back-on-free-bets.htm)
- Betano (SNR; **Brazilian** sources): [olhardigital.com.br](https://olhardigital.com.br/apostas/aposta-gratis-betano/), [Betano BR help centre](https://support.betano.bet.br/hc/pt-br/articles/6413802642205)
- Placard (ambiguous; freebets not cashout-able): [vivaposta.pt/placard-apostas](https://vivaposta.pt/placard-apostas/), [Placard FAQ](https://www.placard.pt/faq)
- Bwin (risk-free→freebet refund; net winnings paid): [observador.pt — bwin apostas](https://observador.pt/prognosticos/bwin-apostas/), [apostalegal.pt/bwin-portugal](https://apostalegal.pt/bwin-portugal/)
- Solverde / Nossa Aposta / Casino Portugal (freebet existence only, no stake-return detail): [bookmaker-ratings.pt freebet guide](https://bookmaker-ratings.pt/bonusy-rubrika/freebet/)

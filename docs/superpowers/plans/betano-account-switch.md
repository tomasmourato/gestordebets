# Plan: Automatic account switching for Betano (mirror Betclic)

> **STATUS (handoff):** Implemented on this branch, **not yet verified live.**
> Load the unpacked extension from THIS worktree
> (`\\wsl.localhost\Ubuntu\home\ronk\projects\bettrackr-betano-account\extension`)
> — a previous test loaded the *main-repo* folder (old code), which is why nothing
> happened. Remove + Load unpacked to avoid a stale service worker.
>
> **Done:** `inject-betano.js` (MAIN world) reads `window["initial_state"]` +
> fetches `GET /api/user/sessiontimer/status` (returns `customerId`, cookies only)
> + taps `/api/user/*` → posts `IDENTITY`; `content-betano.js` stores
> `betanoUsername`; `background.js` `betanoReadStateFn` runs with `world:"MAIN"`,
> `probeBookmakerIdentity` generalized via `IDENTITY_PROBES`. Betano has NO handle
> → match by numeric `customerId` (set it in the account's Username field).
> **Verify via** console markers: `[BetTrackr] inject-betano loaded build=identity-2`,
> `betano identity → <id>`, popup `build=betano-detect-1`. Remove these markers
> once stable.
>
> **Live-debug blocker:** Chrome DevTools MCP can't reach Windows Chrome from WSL
> (NAT mode). Enable mirrored networking or run Claude Code on Windows.



**Branch:** `feat/betano-account-switch` (worktree `../bettrackr-betano-account`, off `main` @ 2190b62)
**Goal:** When the user has multiple Betano accounts in BetTrackr, the extension should detect *which* Betano account is currently logged in and auto-route imported bets to the matching BetTrackr `bookie_account` — updating when the user switches Betano accounts — exactly as it already does for Betclic.

---

## 1. How Betclic works today (the pattern to mirror)

All in `extension/src/`:

- **`background.js › probeBookmakerIdentity(source)`** — currently hard-returns `{username: null}` for anything that isn't `betclic`. For Betclic it:
  1. Queries open `betclic.pt` tabs (sorted active / most-recently-accessed first).
  2. `chrome.scripting.executeScript` runs **`betclicReadStateFn()`** in the page.
  3. Caches the result in `chrome.storage.local["betclicUsername"]`; falls back to that cache when no tab is open.
- **`betclicReadStateFn()`** (runs in-page): logged-out signal via the `/login` link, then reads the username from **runtime** `localStorage["CacheServiceLogin"]` (updates on account switch without navigation), with the frozen SSR `ng-state` script as fallback.
- **`content-betclic.js › extractBetclicUsername()`** — saves the username to `chrome.storage.local` on page load (the fallback source when no tab is queried live).
- **`background.js › resolveAccountId(source, …)`** — already **source-generic**: takes the detected username, matches a `bookie_account` for that bookmaker by `account.username` (case-insensitive), then by `label`. Order: detected identity → manual dropdown → single account → none.

**Takeaway:** the only Betclic-specific pieces are `betclicReadStateFn`, the `betclic` branch of `probeBookmakerIdentity`, and `extractBetclicUsername`. `resolveAccountId` / `accountsForBookmaker` / `SOURCE_BOOKMAKER` already handle Betano generically.

---

## 2. Betano research findings (from the two HARs + code)

Auth: Betano (Kaizen platform) uses cookie auth plus custom request headers `token1`/`token2`/`seontoken`, captured by monkey-patching `fetch`/XHR in `inject-betano.js` → `BETANO_SESSION` message → `background.js` `betanoSessionTokens`. There is **no `Authorization: Bearer`** and **no `/api/v2/me`-style handle endpoint**.

**Identity source — the key finding:** the logged-in identity lives in an **embedded page-state blob** in the HTML document (a `window.__…` script — Betano's analog to Betclic's `ng-state`). Extracted from the dashboard HAR:

```json
"user": { "isLoggedIn": true, "info": {
  "customerId": 422869431, "email": "cordonihenrique@gmail.com",
  "city": "Odivelas", "status": "Real", "type": "Normal", ...
}}
```

- **There is NO username/nickname/handle field.** The only stable identifiers are **`customerId`** (numeric) and **`email`**.
- `user.isLoggedIn` is the logged-in/out signal (mirrors Betclic's `/login` link check).
- The same `customerId` also appears at **runtime** in `GET /api/user/sessiontimer/status` (and it's in the `/` doc state).
- The embedded doc blob is **frozen at page load** (like `ng-state`), so on its own it only refreshes on navigation/reload.

**Consequence for matching (important, differs from Betclic):** because Betano exposes no handle, the BetTrackr account must be matched by **`customerId`** (recommended — stable, unique) or **`email`**. The user will set the Betano account's **Username field to their Betano customer ID** (or we also match email). This must be surfaced in the UI/help text, unlike Betclic where the username is a human handle.

---

## 3. Open question to resolve live (HAR can't answer)

Betclic needed `localStorage["CacheServiceLogin"]` because `ng-state` was frozen and account switch is in-SPA. **Does Betano write `customerId` to `localStorage`/`sessionStorage`** (a runtime cache that updates on switch without reload)? A HAR (network only) can't show this — inspect the live page:

```js
// Run in the Betano tab console, logged in, then after switching account:
Object.entries(localStorage).filter(([k,v]) => /custom|user|login|account|profile/i.test(k+v))
Object.entries(sessionStorage).filter(([k,v]) => /custom|user|login|account|profile/i.test(k+v))
```

- **If** a runtime storage key holds `customerId` → use it (best; updates without reload, true Betclic parity).
- **If not** → does switching accounts on Betano do a **full page reload**? If yes, the frozen embedded doc blob is sufficient (it re-freezes with the new identity on reload). Betano's login/switch flow is believed to reload; confirm.
- **Fallback runtime source regardless:** have `inject-betano.js` capture `customerId` from `/api/user/sessiontimer/status` (or any `/api/user/*`) responses it already intercepts, and push it via a message — a guaranteed runtime signal.

---

## 4. Implementation steps (mirror Betclic)

1. **`background.js › betanoReadStateFn()`** (new, runs in-page via `executeScript`):
   - Read `isLoggedIn` + `customerId`/`email` from the embedded `window.__…` doc state (regex the doc HTML for `"customerId":<n>` within the `"user":{…}` block, like `betclicReadStateFn` regexes `ng-state`).
   - If step 3's live check finds a `localStorage`/`sessionStorage` key, prefer it (runtime, updates on switch).
   - Return `{ username: String(customerId) /* or email */, loggedIn }`. (Keep the field name `username` so `resolveAccountId` stays generic.)
2. **`background.js › probeBookmakerIdentity`** — add a `betano` branch parallel to `betclic`: query `www.betano.pt` tabs (active/most-recent first), `executeScript(betanoReadStateFn)`, cache `chrome.storage.local["betanoUsername"]`, honor `loggedIn === false` (clear cache → no account), fall back to stored value. Consider refactoring the two branches into one table-driven helper `{ urls, readFn, cacheKey }` to avoid duplication.
3. **`content-betano.js › extractBetanoIdentity()`** (new) — on load, read the same embedded state (+ any runtime storage) and save `customerId` to `chrome.storage.local["betanoUsername"]`; guard `chrome.*` with the `extensionAlive()` pattern used in `content-betclic.js`. Optionally emit `AUTO_IMPORT_HINT`.
4. **(If needed) `inject-betano.js`** — also capture `customerId` from intercepted `/api/user/*` responses and forward it (runtime signal that survives no-reload switches).
5. **`resolveAccountId`** — no change needed; verify Betano flows through it.
6. **Matching semantics / UX:** confirm `resolveAccountId` matches `account.username == customerId`. Add help text on the account form (web app, `BookieAccountsCard`/account settings) telling Betano users to put their **customer ID** (or email) in the Username field. Decide whether to also match on `email`.

---

## 5. Testing

- Unit: extend `extension/test/importers.test.js` (or a new `identity` test) with a fixture of the embedded-state blob → `betanoReadStateFn` returns the right `customerId` and `loggedIn`.
- Manual (WSL gotcha from memory: Remove + Load unpacked to avoid a stale service worker; a `console.log("build=…")` marker confirms fresh code):
  1. Log in to Betano account A → import → bets route to the BetTrackr account whose Username = A's customerId.
  2. Switch to account B **without** a manual reload → detection updates to B (validates the runtime-source requirement from §3).
  3. Log out → detection reports "no account", cache cleared.
  4. No Betano tab open → falls back to `chrome.storage.local["betanoUsername"]`.

---

## 6. Risks / notes

- **No handle** is the headline difference from Betclic — matching by `customerId`/email and the required UX hint are the real work; the plumbing is a near-copy.
- Keep the returned field named `username` so `resolveAccountId` and the popup stay source-generic.
- Related memory: [[betclic-account-switch-detection]] (the CacheServiceLogin discovery and the stale-service-worker WSL gotcha).

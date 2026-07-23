# Graph Report - gestão-de-apostas  (2026-07-23)

## Corpus Check
- 220 files · ~206,735 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2982 nodes · 7596 edges · 188 communities (104 shown, 84 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 723 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2dd57e6f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Bet Lifecycle UI
- Extension Import Orchestration
- App Shell and State
- Runtime Dependencies
- Build Toolchain
- API Security and Database
- History and Reconciliation
- TypeScript Project Config
- Browser Extension Manifest
- Extension Popup UI
- Extension Security and Sessions
- App Architecture and Auth
- Cashout and Freebet Logic
- Bookmaker Freebet Research
- Product Feature Architecture
- Extension Import Settings
- Vercel Deployment
- Bookmaker Adapter Pipeline
- Betano Request Capture
- Gemini Import Planning
- PWA Icon 192
- PWA Icon 512
- Extension Packaging
- Betclic Request Capture
- Schema Migration Bootstrap
- Canonical Database Schema
- BetTrackr Token Bridge
- Status Constraint Migration
- Cashout Freebet Migration
- vite.config.ssr.ts
- Betclic Content Bridge
- bet
- Vite Configuration
- betStatus.ts
- importers.test.js
- BetTrackr — Extensão de importação de apostas
- Extension Usage Instructions
- Pre-Mount Theme Bootstrap
- Paginated Bookmaker Bet Reading
- Betano Import Integration
- Betclic Import Integration
- Bookmaker-Specific Bet Mappers
- Bet Deduplication and Settlement Updates
- No Embedded Session Credentials
- Automated Access Terms Limitation
- Betano Brazil Help Centre
- Per-Bookmaker Freebet Defaults
- Bookmaker Ratings Freebet Guide
- Cashout as a First-Class Settled Outcome
- Dashboard Filters
- Dashboard Result Distribution Fix
- Extension Login and Opt-In Auto-Import
- Bookmaker Adapter Architecture
- Extension Cashout Import
- Extension Credential Security Constraints
- Automated Bookmaker Access Terms Risk
- Foundation-First Delivery Sequence
- Typed Freebet Rules
- FreeBetOffers Stake Return Guide
- GamblingCalc Free Bet Calculator
- Gemini Multi-Bet Screenshot Import
- Internationalization
- Observador Bwin Guide
- Olhar Digital Betano Freebet Guide
- Placard FAQ
- Stake Not Returned Freebet
- Stake Returned Freebet
- Structured Bookmaker Registry
- TipsterCompetition Stake Not Returned Explainer
- Viva Aposta Placard Guide
- BetTrackr Application Stack
- Authenticated Bets API
- Gemini Screenshot Bet Extraction
- JWT Authentication
- PostgreSQL as the Single Source of Truth
- Dashboard Improvements
- Extension Import Improvements
- Gemini Multi-Bet Import Request
- Language Options
- Manual Import Improvements
- BetTrackr Product Backlog
- mapper-solverde.js
- import-utils.js
- rr
- index-GUdJqaP1.js
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- ExampleUnitTest.java
- concat
- MainActivity.java
- capacitor.config.ts
- CLAUDE.md
- build.gradle
- build.gradle
- settings.gradle
- variables.gradle
- v
- l
- o
- os
- Dashboard-CiJmES5V.js
- .forEach
- Settings-B3PiUVnh.js
- BetsManager-DThhK6Cx.js
- MobileApp.tsx
- rs
- Ct
- bo
- N
- lk
- I
- .constructor
- Ze
- .readValue
- iO
- Ht
- Implementation Plan
- DesktopApp.tsx
- MobileSocial-BXwyEbj8.js
- MobileImport-COK0PxdU.js
- en
- Do
- index-BzOvdiRd.js
- so
- Ko
- qr
- vn
- j
- pb
- u
- scripts
- Ba
- s
- fg
- M
- BetTrackr
- ug
- Nh
- BetTrackr — Extensão de importação de apostas
- iO
- MobileApp.tsx
- ml
- Settings.tsx
- pg
- package.json
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- index-DXvZjjot.js
- ua
- web-DiSom0bG.js
- ExampleUnitTest
- graphify
- @capacitor/cli
- @capacitor/core
- Gn
- @capacitor/splash-screen
- g1
- @google/genai
- bets
- wg
- express
- h1
- Test
- Test
- a2
- ErrorBoundary
- OA
- web-C5gcm5_3.js
- web-C_vhW8nL.js
- @capacitor/android
- l1

## God Nodes (most connected - your core abstractions)
1. `nd` - 85 edges
2. `t()` - 69 edges
3. `l()` - 64 edges
4. `vr()` - 55 edges
5. `e()` - 54 edges
6. `ae()` - 53 edges
7. `v` - 53 edges
8. `b` - 51 edges
9. `Gy()` - 49 edges
10. `as()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `SwipeableRow()` --indirect_call--> `to()`  [INFERRED]
  src/mobile/ui/SwipeableRow.tsx → android/app/src/main/assets/public/assets/vendor-motion-B4Dy8_CB.js
- `BetsManager()` --indirect_call--> `b`  [INFERRED]
  src/components/BetsManager.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `MobileBets()` --indirect_call--> `b`  [INFERRED]
  src/mobile/screens/MobileBets.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `MobileDashboard()` --indirect_call--> `b`  [INFERRED]
  src/mobile/screens/MobileDashboard.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (188 total, 84 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.14
Nodes (32): response(), ScreenshotImporter(), FormSelection, nowLocal(), useBetForm(), CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal() (+24 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.10
Nodes (35): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betclicReadStateFn(), BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab() (+27 more)

### Community 2 - "App Shell and State"
Cohesion: 0.12
Nodes (47): AIInsights(), Social(), SocialProps, statusMeta(), useAccounts(), useBets(), ApiAccountRow, createAccount() (+39 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (29): bcryptjs, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/keyboard, @capacitor/status-bar, @capgo/capacitor-updater (+21 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.06
Nodes (33): adm-zip, @capacitor/cli, esbuild, devDependencies, adm-zip, @capacitor/cli, esbuild, tailwindcss (+25 more)

### Community 5 - "API Security and Database"
Cohesion: 0.06
Nodes (37): connect(), getPool(), query(), extractJson(), getGeminiClient(), tryParse(), AuthenticatedRequest, authenticatedUserFromRequest() (+29 more)

### Community 6 - "History and Reconciliation"
Cohesion: 0.28
Nodes (14): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+6 more)

### Community 7 - "TypeScript Project Config"
Cohesion: 0.07
Nodes (27): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+19 more)

### Community 8 - "Browser Extension Manifest"
Cohesion: 0.05
Nodes (36): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+28 more)

### Community 9 - "Extension Popup UI"
Cohesion: 0.06
Nodes (37): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+29 more)

### Community 15 - "Extension Import Settings"
Cohesion: 0.12
Nodes (8): $a, au, Gl(), jn(), Vt, ws(), xa(), za()

### Community 16 - "Vercel Deployment"
Cohesion: 0.01
Nodes (132): $2(), ak(), at(), bb(), bj(), bv(), c2(), cA() (+124 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.03
Nodes (87): ai(), An(), as, Bi, bn(), ca, Ci, cl (+79 more)

### Community 20 - "PWA Icon 192"
Cohesion: 0.70
Nodes (5): Betting Slip, Performance Bar Chart, Soccer Ball, Sports Betting Analytics, Sports Betting Analytics App Icon

### Community 21 - "PWA Icon 512"
Cohesion: 0.50
Nodes (5): Betting Ticket, BetTrackr PWA Icon, Football, Performance Analytics, Upward Trend

### Community 22 - "Extension Packaging"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

### Community 23 - "Betclic Request Capture"
Cohesion: 0.32
Nodes (4): looksLikeBetsApi(), looksLikeIdentityApi(), report(), sniffIdentity()

### Community 24 - "Schema Migration Bootstrap"
Cohesion: 0.57
Nodes (5): cleanBaseUrl(), cleanUserId(), responseError(), runAfterBettrackrVerification(), verifyBettrackrIdentity()

### Community 25 - "Canonical Database Schema"
Cohesion: 0.07
Nodes (35): AccountPanel(), AccountPanelProps, AIInsightsProps, InsightsResponse, Pick, AuthPageProps, Mode, BrandMark() (+27 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "Cashout Freebet Migration"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 29 - "vite.config.ssr.ts"
Cohesion: 0.06
Nodes (70): F(), vr(), Ve(), we, me, wy(), K(), B() (+62 more)

### Community 32 - "Betclic Content Bridge"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "bet"
Cohesion: 0.16
Nodes (18): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets(), fetchSolverdeBets(), importKey(), persistMapped(), postBulk() (+10 more)

### Community 36 - "betStatus.ts"
Cohesion: 0.29
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "importers.test.js"
Cohesion: 0.20
Nodes (15): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets() (+7 more)

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.05
Nodes (78): Re, AS(), ay(), Be(), bm(), Bt(), ce(), clamp() (+70 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "import-utils.js"
Cohesion: 0.04
Nodes (75): app, haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), AccountSheet() (+67 more)

### Community 86 - "rr"
Cohesion: 0.14
Nodes (14): av(), Ek(), $f(), Fk(), hO(), Hr(), K_(), qO() (+6 more)

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.04
Nodes (92): _1(), ag, Ah, ao, bg(), bh(), bi(), co (+84 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 91 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.06
Nodes (13): C, d, f(), i, L, m, N(), o (+5 more)

### Community 92 - "ExampleUnitTest.java"
Cohesion: 0.04
Nodes (75): Gy(), l(), ad(), ah(), b1(), bS(), Bu(), c1() (+67 more)

### Community 93 - "concat"
Cohesion: 0.05
Nodes (64): pp, yo(), _0(), _A(), ab(), c0(), cancel(), ck() (+56 more)

### Community 96 - "CLAUDE.md"
Cohesion: 0.08
Nodes (55): o(), be, D, G, H(), I, L, M() (+47 more)

### Community 97 - "build.gradle"
Cohesion: 0.08
Nodes (38): applyPatches(), Cl(), constructor(), createDraft(), defineProperty(), deleteProperty(), dw(), El() (+30 more)

### Community 99 - "build.gradle"
Cohesion: 0.08
Nodes (49): ap, Bp(), Gl(), __vite__mapDeps(), Vl(), wp(), p, m (+41 more)

### Community 101 - "settings.gradle"
Cohesion: 0.07
Nodes (42): parse(), now, BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard() (+34 more)

### Community 102 - "variables.gradle"
Cohesion: 0.09
Nodes (20): Aa(), an, Cg(), dt(), ES(), fT(), IS(), ly() (+12 more)

### Community 103 - "v"
Cohesion: 0.13
Nodes (31): e, t, fe(), be(), Ee(), f(), ge, e (+23 more)

### Community 106 - "os"
Cohesion: 0.06
Nodes (14): lo, ao, co(), cs(), ee(), fo, ho(), lo() (+6 more)

### Community 107 - "Dashboard-CiJmES5V.js"
Cohesion: 0.06
Nodes (45): ar, er, Jt, or, rr, sr, tr, Zt (+37 more)

### Community 108 - ".forEach"
Cohesion: 0.07
Nodes (23): brighter(), darker(), bs(), da(), eu(), fa(), fl(), Fn() (+15 more)

### Community 109 - "Settings-B3PiUVnh.js"
Cohesion: 0.09
Nodes (37): App(), AppProps, DesktopApp, Gallery, MobileApp, BetsManagerProps, BookieAccountsCardProps, DashboardBetsFilters (+29 more)

### Community 110 - "BetsManager-DThhK6Cx.js"
Cohesion: 0.17
Nodes (9): a1(), b1(), Bm(), f(), Fs, n1(), wg, Ym() (+1 more)

### Community 111 - "MobileApp.tsx"
Cohesion: 0.10
Nodes (22): A0(), Aj(), cd(), cS(), displayable(), Fl(), formatHsl(), hd() (+14 more)

### Community 112 - "rs"
Cohesion: 0.07
Nodes (18): aa(), ds(), ea(), fs(), Gi(), io(), kn(), ko (+10 more)

### Community 113 - "Ct"
Cohesion: 0.07
Nodes (34): Al(), ap(), by(), Ct(), cu(), Cx(), Db(), deref() (+26 more)

### Community 114 - "bo"
Cohesion: 0.12
Nodes (3): bo, Ni(), or()

### Community 115 - "N"
Cohesion: 0.10
Nodes (35): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), EnabledBookmakersCard(), EnabledBookmakersCardProps (+27 more)

### Community 119 - "Ze"
Cohesion: 0.27
Nodes (6): c1(), o1, qg, r1(), wl(), yi()

### Community 120 - ".readValue"
Cohesion: 0.10
Nodes (7): Cn(), es(), ki(), so(), ts(), Un(), ze

### Community 121 - "iO"
Cohesion: 0.31
Nodes (6): C(), d(), f(), g, m(), R()

### Community 122 - "Ht"
Cohesion: 0.14
Nodes (4): Ht, Ke(), Yi(), zr()

### Community 123 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 124 - "DesktopApp.tsx"
Cohesion: 0.12
Nodes (9): e, a, m, A, G(), V(), G, o (+1 more)

### Community 125 - "MobileSocial-BXwyEbj8.js"
Cohesion: 0.22
Nodes (3): Yg(), j, z()

### Community 126 - "MobileImport-COK0PxdU.js"
Cohesion: 0.25
Nodes (7): builds, crons, test, git, deploymentEnabled, routes, version

### Community 127 - "en"
Cohesion: 0.10
Nodes (20): Ch(), Oh(), sg, cu(), en(), go(), jo(), ms() (+12 more)

### Community 128 - "Do"
Cohesion: 0.13
Nodes (3): Do, Ue, wo()

### Community 132 - "qr"
Cohesion: 0.20
Nodes (4): cg, wm(), x1, Nh

### Community 133 - "vn"
Cohesion: 0.06
Nodes (33): aO(), cf(), cM(), cO(), dO(), dS(), fO(), fS() (+25 more)

### Community 135 - "pb"
Cohesion: 0.15
Nodes (3): hb(), pb, zi()

### Community 136 - "u"
Cohesion: 0.29
Nodes (3): B(), D(), M

### Community 137 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, android:open, android:sync, build, clean, dev, lint, preview (+3 more)

### Community 138 - "Ba"
Cohesion: 0.05
Nodes (53): e, t, Ce(), De(), fe(), he(), Le, Me (+45 more)

### Community 140 - "fg"
Cohesion: 0.11
Nodes (14): aw(), Bk(), _c(), Ec(), Ic(), iw(), nw(), ow() (+6 more)

### Community 141 - "M"
Cohesion: 0.28
Nodes (9): kg(), tg, yh(), zg(), Zs(), ch(), Fh(), ou() (+1 more)

### Community 142 - "BetTrackr"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 144 - "Nh"
Cohesion: 0.20
Nodes (10): f1(), hp, k1(), nh(), o(), vp(), y1, Zm() (+2 more)

### Community 146 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 147 - "iO"
Cohesion: 0.31
Nodes (3): m1, Xn(), hl()

### Community 148 - "MobileApp.tsx"
Cohesion: 0.08
Nodes (36): A(), e, o, e, r, Be(), Ei, ky() (+28 more)

### Community 149 - "ml"
Cohesion: 0.11
Nodes (7): Dl(), Kv(), At(), dl, ml, ol(), rl()

### Community 150 - "Settings.tsx"
Cohesion: 0.15
Nodes (14): ne, e1(), gg(), Gm(), km(), Kn(), ks(), Lm() (+6 more)

### Community 152 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 153 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 161 - "Gn"
Cohesion: 0.08
Nodes (36): J1(), af(), Ar(), Ax(), bp(), bx(), Dj(), dx() (+28 more)

### Community 163 - "g1"
Cohesion: 0.50
Nodes (4): i1(), Pm(), Rh(), W1

### Community 166 - "wg"
Cohesion: 0.67
Nodes (3): u1(), Am(), to()

### Community 167 - "express"
Cohesion: 0.20
Nodes (5): Ba, ja(), ka(), ls, Ui

### Community 174 - "h1"
Cohesion: 0.27
Nodes (4): h1, hg, jg(), ry

### Community 181 - "a2"
Cohesion: 0.25
Nodes (8): a2(), e2(), i2(), n2(), P2(), r2(), t2(), yh()

### Community 182 - "ErrorBoundary"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 183 - "OA"
Cohesion: 0.33
Nodes (6): ed(), j1(), OA(), Pi(), T1(), oa

## Knowledge Gaps
- **506 isolated node(s):** `Jt`, `Zt`, `tr`, `ar`, `sr` (+501 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `b` connect `index-GUdJqaP1.js` to `CLAUDE.md`, `build.gradle`, `vn`, `BetTrackr — Extensão de importação de apostas`, `v`, `settings.gradle`, `Ba`, `BetsManager-DThhK6Cx.js`, `ExampleUnitTest.java`, `Nh`, `concat`, `I`, `lk`, `import-utils.js`, `Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior`, `DesktopApp.tsx`, `vite.config.ssr.ts`?**
  _High betweenness centrality (0.241) - this node is a cross-community bridge._
- **Why does `BetsManager()` connect `settings.gradle` to `Bet Lifecycle UI`, `bet`, `import-utils.js`, `index-GUdJqaP1.js`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `MobileBets()` connect `import-utils.js` to `Bet Lifecycle UI`, `bet`, `settings.gradle`, `index-GUdJqaP1.js`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `t()` (e.g. with `Gy()` and `ad()`) actually correct?**
  _`t()` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 57 inferred relationships involving `l()` (e.g. with `H()` and `Gy()`) actually correct?**
  _`l()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `vr()` (e.g. with `E()` and `dt()`) actually correct?**
  _`vr()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `e()` (e.g. with `Gy()` and `C()`) actually correct?**
  _`e()` has 24 INFERRED edges - model-reasoned connections that need verification._
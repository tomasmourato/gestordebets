# Graph Report - gestão-de-apostas  (2026-07-23)

## Corpus Check
- 220 files · ~206,247 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2982 nodes · 7587 edges · 187 communities (105 shown, 82 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 723 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `11084bfc`
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

## Communities (187 total, 82 thin omitted)

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
Cohesion: 0.18
Nodes (12): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), EnabledBookmakersCard(), EnabledBookmakersCardProps (+4 more)

### Community 16 - "Vercel Deployment"
Cohesion: 0.01
Nodes (109): $2(), ak(), bb(), bj(), bv(), c2(), cI(), cj() (+101 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.03
Nodes (89): ai(), An(), as, Bi, bn(), bs(), ca, Ci (+81 more)

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
Nodes (36): AccountPanel(), AccountPanelProps, AIInsightsProps, InsightsResponse, Pick, AuthPageProps, Mode, BrandMark() (+28 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "Cashout Freebet Migration"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 29 - "vite.config.ssr.ts"
Cohesion: 0.10
Nodes (42): A(), F(), Ce(), Pe(), ge(), ue(), v(), ag (+34 more)

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
Cohesion: 0.04
Nodes (80): hg, jg(), Re, an, AS(), Be(), bm(), Bt() (+72 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "import-utils.js"
Cohesion: 0.05
Nodes (54): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS (+46 more)

### Community 86 - "rr"
Cohesion: 0.11
Nodes (53): vr(), Ve(), me, Dp(), fe(), Lp(), Op(), wy() (+45 more)

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.03
Nodes (92): _1(), a1(), ao, b1(), bh(), bi(), Bm(), cg (+84 more)

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
Nodes (77): ad(), ah(), Ar(), Ax(), b1(), bS(), Bu(), bx() (+69 more)

### Community 93 - "concat"
Cohesion: 0.06
Nodes (46): pp, _0(), _A(), ab(), cancel(), cN(), concat(), copy() (+38 more)

### Community 96 - "CLAUDE.md"
Cohesion: 0.10
Nodes (42): D, G, H(), I, L, M(), O, R (+34 more)

### Community 97 - "build.gradle"
Cohesion: 0.07
Nodes (41): Lt, af(), applyPatches(), at(), bp(), bw(), Cl(), constructor() (+33 more)

### Community 99 - "build.gradle"
Cohesion: 0.06
Nodes (40): e, t, be, ce, de, fe, he, je (+32 more)

### Community 101 - "settings.gradle"
Cohesion: 0.10
Nodes (33): parse(), now, BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard() (+25 more)

### Community 102 - "variables.gradle"
Cohesion: 0.12
Nodes (15): Aa(), Cg(), dt(), ES(), fT(), Nu(), Or(), Qk() (+7 more)

### Community 103 - "v"
Cohesion: 0.06
Nodes (42): ar, er, Jt, or, rr, sr, tr, Zt (+34 more)

### Community 104 - "l"
Cohesion: 0.11
Nodes (36): ie, Ah, Eh(), fp(), g1, go(), ip(), Jn() (+28 more)

### Community 106 - "os"
Cohesion: 0.11
Nodes (8): ao, ee(), lo(), ns(), os, ro(), ss, uo()

### Community 107 - "Dashboard-CiJmES5V.js"
Cohesion: 0.12
Nodes (23): e, r, ph(), ug, B(), De, Ie, M (+15 more)

### Community 108 - ".forEach"
Cohesion: 0.07
Nodes (24): gm(), aa(), da(), es(), fa(), fl(), ga(), ia() (+16 more)

### Community 109 - "Settings-B3PiUVnh.js"
Cohesion: 0.09
Nodes (37): App(), AppProps, DesktopApp, Gallery, MobileApp, BetsManagerProps, BookieAccountsCardProps, DashboardBetsFilters (+29 more)

### Community 110 - "BetsManager-DThhK6Cx.js"
Cohesion: 0.12
Nodes (19): Gy(), qy(), Vy(), Df(), X0(), $e(), er(), In() (+11 more)

### Community 111 - "MobileApp.tsx"
Cohesion: 0.07
Nodes (30): A0(), Aj(), cd(), cS(), displayable(), $f(), Fl(), formatHsl() (+22 more)

### Community 112 - "rs"
Cohesion: 0.06
Nodes (16): Si(), $a, au, ds(), fs(), Gi(), Gl(), jn() (+8 more)

### Community 113 - "Ct"
Cohesion: 0.07
Nodes (35): Al(), ap(), by(), Ct(), cu(), Cx(), Db(), deref() (+27 more)

### Community 114 - "bo"
Cohesion: 0.09
Nodes (3): bo, Cn(), so()

### Community 115 - "N"
Cohesion: 0.14
Nodes (23): Settings(), configured, isNativeApp(), deliverTextFile(), exportBackupJSON(), exportBetsCSV(), importBetsFromFile(), parseCSVRow() (+15 more)

### Community 119 - "Ze"
Cohesion: 0.18
Nodes (13): ne, c1(), n1(), o1, qg, r1(), wl(), yi() (+5 more)

### Community 120 - ".readValue"
Cohesion: 0.15
Nodes (3): ki(), qr(), ze

### Community 121 - "iO"
Cohesion: 0.31
Nodes (6): C(), d(), f(), g, m(), R()

### Community 122 - "Ht"
Cohesion: 0.09
Nodes (4): cs(), Ht, qe, Yi()

### Community 123 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 124 - "DesktopApp.tsx"
Cohesion: 0.12
Nodes (10): e, a, m, A, G(), I(), q(), V() (+2 more)

### Community 125 - "MobileSocial-BXwyEbj8.js"
Cohesion: 0.18
Nodes (4): Yg(), j, z(), o

### Community 126 - "MobileImport-COK0PxdU.js"
Cohesion: 0.25
Nodes (7): builds, crons, test, git, deploymentEnabled, routes, version

### Community 127 - "en"
Cohesion: 0.09
Nodes (19): Ch(), Oh(), sg, cu(), en(), go(), jo(), $o() (+11 more)

### Community 128 - "Do"
Cohesion: 0.11
Nodes (5): lo, Do, fo, Ue, wo()

### Community 132 - "qr"
Cohesion: 0.12
Nodes (15): cA(), dc(), EA(), HA(), jC(), Kc(), qr(), sA() (+7 more)

### Community 133 - "vn"
Cohesion: 0.10
Nodes (21): cM(), cO(), dO(), dS(), fO(), Fu(), gS(), hf() (+13 more)

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
Cohesion: 0.10
Nodes (31): De(), fe(), he(), Le, Me, Ve, __vite__mapDeps(), we (+23 more)

### Community 140 - "fg"
Cohesion: 0.07
Nodes (25): aw(), Bk(), c1(), deleteProperty(), dM(), dw(), Ec(), fm() (+17 more)

### Community 141 - "M"
Cohesion: 0.50
Nodes (4): brighter(), darker(), Fn(), ua()

### Community 142 - "BetTrackr"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 144 - "Nh"
Cohesion: 0.08
Nodes (17): f(), Fm(), hp, J1(), k1(), nh(), o(), sp() (+9 more)

### Community 146 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 147 - "iO"
Cohesion: 0.08
Nodes (24): aO(), cf(), eO(), Fr(), fS(), Gg(), iO(), lf() (+16 more)

### Community 148 - "MobileApp.tsx"
Cohesion: 0.17
Nodes (16): o, r, Be(), Ei, mg, og, _p, Rm() (+8 more)

### Community 149 - "ml"
Cohesion: 0.14
Nodes (6): ny(), At(), dl, ml, ol(), rl()

### Community 150 - "Settings.tsx"
Cohesion: 0.12
Nodes (11): e1(), Gm(), ks(), m1, t1(), vi(), Xn(), zh (+3 more)

### Community 151 - "pg"
Cohesion: 0.07
Nodes (29): app, BackEntry, push(), remove(), runTopBackHandler(), stack, useBackHandler(), exitNativeApp() (+21 more)

### Community 152 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 153 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 161 - "Gn"
Cohesion: 0.07
Nodes (41): km(), yo(), av(), ay(), c0(), ck(), De(), eb() (+33 more)

### Community 163 - "g1"
Cohesion: 0.14
Nodes (16): e, r, le, zp, ce, Fe, Me, Oe (+8 more)

### Community 166 - "wg"
Cohesion: 0.14
Nodes (18): u1(), Am(), et, G(), gn(), He(), Hi(), Ii() (+10 more)

### Community 167 - "express"
Cohesion: 0.20
Nodes (5): Ba, ja(), ka(), ls, Ui

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
- **82 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `b` connect `vite.config.ssr.ts` to `fg`, `Nh`, `iO`, `pg`, `Gn`, `BetTrackr — Extensão de importação de apostas`, `wg`, `import-utils.js`, `rr`, `index-GUdJqaP1.js`, `Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior`, `concat`, `CLAUDE.md`, `build.gradle`, `settings.gradle`, `l`, `lk`, `I`, `Ze`, `DesktopApp.tsx`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Why does `BetsManager()` connect `settings.gradle` to `Bet Lifecycle UI`, `vite.config.ssr.ts`, `bet`, `import-utils.js`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `MobileBets()` connect `import-utils.js` to `Bet Lifecycle UI`, `bet`, `settings.gradle`, `vite.config.ssr.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `t()` (e.g. with `Gy()` and `ad()`) actually correct?**
  _`t()` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 57 inferred relationships involving `l()` (e.g. with `H()` and `Gy()`) actually correct?**
  _`l()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `vr()` (e.g. with `E()` and `dt()`) actually correct?**
  _`vr()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `e()` (e.g. with `Gy()` and `C()`) actually correct?**
  _`e()` has 24 INFERRED edges - model-reasoned connections that need verification._
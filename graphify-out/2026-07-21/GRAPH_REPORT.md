# Graph Report - gestão-de-apostas  (2026-07-21)

## Corpus Check
- 217 files · ~200,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2920 nodes · 7364 edges · 181 communities (100 shown, 81 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 721 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eae0f617`
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
- Betclic Content Bridge
- bet
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
- Bt
- BetTrackr — Extensão de importação de apostas
- vercel.json
- .unavailable
- index-DuVHi_Fd.js
- ig
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
- @capacitor/keyboard
- @capacitor/splash-screen
- @capgo/capacitor-updater
- @google/genai
- bets
- motion
- pg
- Test
- Test

## God Nodes (most connected - your core abstractions)
1. `nd` - 85 edges
2. `v` - 75 edges
3. `t()` - 68 edges
4. `l()` - 64 edges
5. `e()` - 52 edges
6. `Ze()` - 50 edges
7. `ae()` - 47 edges
8. `rr()` - 44 edges
9. `Dy()` - 43 edges
10. `R()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `MobileBets()` --indirect_call--> `v`  [INFERRED]
  src/mobile/screens/MobileBets.tsx → android/app/src/main/assets/public/assets/web-e_rwcfcJ.js
- `MobileDashboard()` --indirect_call--> `v`  [INFERRED]
  src/mobile/screens/MobileDashboard.tsx → android/app/src/main/assets/public/assets/web-e_rwcfcJ.js
- `BetsManager()` --indirect_call--> `b`  [INFERRED]
  src/components/BetsManager.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `MobileBets()` --indirect_call--> `b`  [INFERRED]
  src/mobile/screens/MobileBets.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `MobileDashboard()` --indirect_call--> `b`  [INFERRED]
  src/mobile/screens/MobileDashboard.tsx → android/app/src/main/assets/public/workbox-0bb07689.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (181 total, 81 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.10
Nodes (47): response(), BetsManagerProps, BookieAccountsCardProps, DashboardProps, ScreenshotImporter(), ScreenshotImporterProps, SettingsProps, FormSelection (+39 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.10
Nodes (35): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betclicReadStateFn(), BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab() (+27 more)

### Community 2 - "App Shell and State"
Cohesion: 0.10
Nodes (49): AIInsights(), AIInsightsProps, InsightsResponse, Pick, Social(), SocialProps, statusMeta(), useAccounts() (+41 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (27): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/haptics, @capacitor/status-bar, dotenv, express (+19 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.06
Nodes (31): adm-zip, esbuild, devDependencies, adm-zip, esbuild, tailwindcss, @tailwindcss/vite, tsx (+23 more)

### Community 5 - "API Security and Database"
Cohesion: 0.05
Nodes (43): connect(), getPool(), query(), extractJson(), getGeminiClient(), AuthenticatedRequest, authenticatedUserFromRequest(), authenticateToken() (+35 more)

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
Nodes (121): $2(), ak(), bb(), bj(), bv(), c2(), ch(), cI() (+113 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.03
Nodes (96): ai(), An(), as, Bi, bn(), bs(), ca, Ce (+88 more)

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
Cohesion: 0.08
Nodes (43): App(), AppProps, DesktopApp, Gallery, MobileApp, AccountPanel(), AccountPanelProps, AuthPageProps (+35 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "Cashout Freebet Migration"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

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
Nodes (92): ae(), an, AS(), bm(), Bt(), ce(), clamp(), cS() (+84 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "import-utils.js"
Cohesion: 0.05
Nodes (61): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), BackEntry, push() (+53 more)

### Community 86 - "rr"
Cohesion: 0.05
Nodes (78): rr(), ot(), P(), We(), ie, ne, pe, ye() (+70 more)

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.04
Nodes (74): _1(), a1(), ah(), bg, bh(), bm(), By(), c1 (+66 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 91 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.06
Nodes (15): Rd(), b, C, d, f(), i, L, m (+7 more)

### Community 92 - "ExampleUnitTest.java"
Cohesion: 0.04
Nodes (66): ad(), ah(), b1(), bS(), Bu(), cb(), cj(), cp() (+58 more)

### Community 93 - "concat"
Cohesion: 0.05
Nodes (63): _0(), _A(), A0(), ab(), Aj(), ay(), bo(), c0() (+55 more)

### Community 96 - "CLAUDE.md"
Cohesion: 0.10
Nodes (49): g, L(), D, G, H(), I, L, M() (+41 more)

### Community 97 - "build.gradle"
Cohesion: 0.06
Nodes (56): af(), applyPatches(), at(), bp(), bw(), Cl(), constructor(), createDraft() (+48 more)

### Community 99 - "build.gradle"
Cohesion: 0.07
Nodes (48): e, t, ae, be, de, fe, g(), he (+40 more)

### Community 101 - "settings.gradle"
Cohesion: 0.08
Nodes (40): parse(), now, BetsManager(), SortDirection, SortField, Dashboard(), FilterDropdownOption, FilterDropdownProps (+32 more)

### Community 102 - "variables.gradle"
Cohesion: 0.06
Nodes (39): Aa(), Ar(), Ax(), bx(), Cg(), Dj(), dt(), dx() (+31 more)

### Community 104 - "l"
Cohesion: 0.11
Nodes (44): le(), Ue(), ao(), b1(), Ce(), eo(), fh(), g1() (+36 more)

### Community 105 - "o"
Cohesion: 0.06
Nodes (31): Am(), dg(), eh(), f(), gh(), hg(), Iy(), K1 (+23 more)

### Community 106 - "os"
Cohesion: 0.06
Nodes (14): lo, ao, co(), cs(), ee(), fo, ho(), lo() (+6 more)

### Community 107 - "Dashboard-CiJmES5V.js"
Cohesion: 0.09
Nodes (32): e, t, e, r, Ge, H(), He, me() (+24 more)

### Community 108 - ".forEach"
Cohesion: 0.09
Nodes (19): gm(), aa(), da(), fa(), fl(), ga(), io(), iu() (+11 more)

### Community 109 - "Settings-B3PiUVnh.js"
Cohesion: 0.10
Nodes (29): de(), Fe(), Me(), Oe, Re, Ve, we, xe (+21 more)

### Community 110 - "BetsManager-DThhK6Cx.js"
Cohesion: 0.10
Nodes (25): Bt, Dt, Et, It, Mt, Ot, Pt, Tt (+17 more)

### Community 111 - "MobileApp.tsx"
Cohesion: 0.11
Nodes (26): app, BrandMark(), configured, isNativeApp(), downloadBlob(), exportBackupJSON(), exportBetsCSV(), getBundleVersion() (+18 more)

### Community 112 - "rs"
Cohesion: 0.09
Nodes (5): au, Gi(), ml, rl(), rs()

### Community 113 - "Ct"
Cohesion: 0.07
Nodes (32): Al(), ap(), by(), Ct(), cu(), Db(), deref(), ep() (+24 more)

### Community 114 - "bo"
Cohesion: 0.07
Nodes (9): bo, es(), fs(), ki(), Pn(), Si(), Tn(), Un() (+1 more)

### Community 115 - "N"
Cohesion: 0.16
Nodes (12): A(), F(), K(), ci(), ja(), jg(), wg(), xg() (+4 more)

### Community 116 - "lk"
Cohesion: 0.07
Nodes (27): aw(), Bk(), c1(), Cx(), dM(), Ec(), fm(), hv() (+19 more)

### Community 118 - ".constructor"
Cohesion: 0.10
Nodes (10): ch, D1, Gn(), i1(), ih(), ii(), Kg(), Mm (+2 more)

### Community 119 - "Ze"
Cohesion: 0.13
Nodes (25): Gs(), Hs(), Ze(), a2(), av(), De(), Ej(), Ek() (+17 more)

### Community 120 - ".readValue"
Cohesion: 0.09
Nodes (13): s1, $a, ds(), ea(), Gl(), Qo, qr(), vs() (+5 more)

### Community 121 - "iO"
Cohesion: 0.08
Nodes (25): aO(), cf(), eO(), Fr(), fS(), Gg(), iO(), lf() (+17 more)

### Community 122 - "Ht"
Cohesion: 0.13
Nodes (4): Ht, Pi(), qi(), Yi()

### Community 123 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 124 - "DesktopApp.tsx"
Cohesion: 0.11
Nodes (21): Settings(), AIInsights, BetsManager, Dashboard, DesktopApp(), ScreenshotImporter, Settings, Social (+13 more)

### Community 125 - "MobileSocial-BXwyEbj8.js"
Cohesion: 0.14
Nodes (16): e, t, ge, e, o, h(), ge, he (+8 more)

### Community 126 - "MobileImport-COK0PxdU.js"
Cohesion: 0.13
Nodes (18): o(), e, r, ce, P1, ce, Fe, Le() (+10 more)

### Community 127 - "en"
Cohesion: 0.12
Nodes (16): cu(), en(), ft, jo(), $o(), pr(), ql(), qs() (+8 more)

### Community 128 - "Do"
Cohesion: 0.15
Nodes (3): Do, Ue, wo()

### Community 129 - "index-BzOvdiRd.js"
Cohesion: 0.14
Nodes (8): G(), I(), q(), V(), m, e, m, $

### Community 130 - "so"
Cohesion: 0.17
Nodes (4): Cn(), Ni(), or(), so()

### Community 132 - "qr"
Cohesion: 0.13
Nodes (14): cA(), EA(), HA(), jC(), Kc(), qr(), sA(), TC() (+6 more)

### Community 133 - "vn"
Cohesion: 0.14
Nodes (15): cO(), dO(), dS(), fO(), Fu(), gS(), hf(), mS() (+7 more)

### Community 137 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, android:open, android:sync, build, clean, dev, lint, preview (+3 more)

### Community 138 - "Ba"
Cohesion: 0.20
Nodes (5): Ba, ja(), ka(), ls, Ui

### Community 140 - "fg"
Cohesion: 0.31
Nodes (3): fg(), og(), zm()

### Community 141 - "M"
Cohesion: 0.29
Nodes (3): B(), D(), M

### Community 142 - "BetTrackr"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 145 - "Bt"
Cohesion: 0.29
Nodes (6): $o(), rf(), xf(), xn(), zi(), Bt

### Community 146 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 147 - "vercel.json"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 149 - "index-DuVHi_Fd.js"
Cohesion: 0.40
Nodes (4): p, cp(), f1, __vite__mapDeps()

### Community 151 - "pg"
Cohesion: 0.33
Nodes (4): pg(), Fv(), updateYAxisWidth(), Wv()

### Community 152 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 153 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 155 - "ua"
Cohesion: 0.50
Nodes (4): brighter(), darker(), Fn(), ua()

## Knowledge Gaps
- **498 isolated node(s):** `It`, `Et`, `Dt`, `Mt`, `Tt` (+493 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **81 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `b` connect `Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior` to `CLAUDE.md`, `index-BzOvdiRd.js`, `build.gradle`, `build.gradle`, `settings.gradle`, `BetTrackr — Extensão de importação de apostas`, `l`, `Dashboard-CiJmES5V.js`, `Vercel Deployment`, `lk`, `I`, `rr`, `Ze`, `import-utils.js`, `iO`, `concat`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **Why does `BetsManager()` connect `settings.gradle` to `Bet Lifecycle UI`, `bet`, `Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior`, `import-utils.js`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `v` connect `v` to `so`, `build.gradle`, `settings.gradle`, `j`, `l`, `o`, `BetsManager-DThhK6Cx.js`, `N`, `I`, `rr`, `.constructor`, `pg`, `index-GUdJqaP1.js`, `import-utils.js`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `v` (e.g. with `F()` and `rr()`) actually correct?**
  _`v` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 37 inferred relationships involving `t()` (e.g. with `Dy()` and `ad()`) actually correct?**
  _`t()` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 57 inferred relationships involving `l()` (e.g. with `rr()` and `H()`) actually correct?**
  _`l()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `e()` (e.g. with `L()` and `Dy()`) actually correct?**
  _`e()` has 24 INFERRED edges - model-reasoned connections that need verification._
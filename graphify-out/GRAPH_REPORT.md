# Graph Report - gestão-de-apostas  (2026-07-21)

## Corpus Check
- 219 files · ~202,215 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2972 nodes · 7554 edges · 177 communities (94 shown, 83 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 739 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a922691e`
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
- @capacitor/splash-screen
- @google/genai
- bets
- Test
- Test

## God Nodes (most connected - your core abstractions)
1. `nd` - 85 edges
2. `t()` - 69 edges
3. `qy()` - 66 edges
4. `l()` - 64 edges
5. `nr` - 56 edges
6. `ae()` - 54 edges
7. `v` - 54 edges
8. `e()` - 53 edges
9. `b` - 50 edges
10. `qt()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `SwipeableRow()` --indirect_call--> `to()`  [INFERRED]
  src/mobile/ui/SwipeableRow.tsx → android/app/src/main/assets/public/assets/vendor-motion-B4Dy8_CB.js
- `BetsManager()` --indirect_call--> `b`  [INFERRED]
  src/components/BetsManager.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `MobileBets()` --indirect_call--> `b`  [INFERRED]
  src/mobile/screens/MobileBets.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `MobileDashboard()` --indirect_call--> `b`  [INFERRED]
  src/mobile/screens/MobileDashboard.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (177 total, 83 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.10
Nodes (50): response(), BetsManagerProps, SortDirection, SortField, BookieAccountsCardProps, DashboardProps, ScreenshotImporter(), ScreenshotImporterProps (+42 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.10
Nodes (35): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betclicReadStateFn(), BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab() (+27 more)

### Community 2 - "App Shell and State"
Cohesion: 0.08
Nodes (56): AIInsights(), AIInsightsProps, InsightsResponse, Pick, Social(), SocialProps, statusMeta(), useAccounts() (+48 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (29): bcryptjs, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/keyboard, @capacitor/status-bar, @capgo/capacitor-updater (+21 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.06
Nodes (33): adm-zip, @capacitor/cli, esbuild, devDependencies, adm-zip, @capacitor/cli, esbuild, tailwindcss (+25 more)

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
Nodes (127): $2(), a2(), ak(), bb(), bj(), bv(), c2(), ch() (+119 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.03
Nodes (88): ai(), An(), as, Bi, bn(), bs(), ca, Ci (+80 more)

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
Cohesion: 0.05
Nodes (59): App(), AppProps, DesktopApp, Gallery, MobileApp, AccountPanel(), AccountPanelProps, AuthPageProps (+51 more)

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
Cohesion: 0.14
Nodes (17): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets(), fetchSolverdeBets(), importKey(), needsUpdate(), persistMapped() (+9 more)

### Community 36 - "betStatus.ts"
Cohesion: 0.29
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "importers.test.js"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.04
Nodes (105): xt, hg, jg(), l(), ae(), AS(), Be(), bm() (+97 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.17
Nodes (19): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), mapBetclicBet, flattenSelections(), formatDateTime(), isCashoutStatus() (+11 more)

### Community 85 - "import-utils.js"
Cohesion: 0.05
Nodes (69): app, haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), tapHaptic(), AccountSheet() (+61 more)

### Community 86 - "rr"
Cohesion: 0.09
Nodes (61): F(), nr, Ve(), ge(), ie, me, ue(), v() (+53 more)

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.04
Nodes (102): _1(), a1(), ag, ao, b1(), bg(), bh(), bi() (+94 more)

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
Nodes (81): ad(), ah(), Al(), Ar(), at(), Ax(), b1(), bS() (+73 more)

### Community 93 - "concat"
Cohesion: 0.04
Nodes (67): er, rr, pp, _0(), _A(), ab(), ay(), bo() (+59 more)

### Community 96 - "CLAUDE.md"
Cohesion: 0.07
Nodes (65): A(), e, r, o, r, D, G, H() (+57 more)

### Community 97 - "build.gradle"
Cohesion: 0.06
Nodes (54): K(), A0(), af(), Aj(), applyPatches(), bp(), bw(), Cl() (+46 more)

### Community 99 - "build.gradle"
Cohesion: 0.07
Nodes (48): de(), _e, Fe, Le(), Me(), Ne, pe(), Re (+40 more)

### Community 101 - "settings.gradle"
Cohesion: 0.07
Nodes (44): bet(), parse(), now, BetsManager(), Dashboard(), DashboardBetsFilters, FilterDropdownOption, FilterDropdownProps (+36 more)

### Community 102 - "variables.gradle"
Cohesion: 0.10
Nodes (20): Aa(), an, Cg(), deleteProperty(), dw(), fd(), fT(), kl() (+12 more)

### Community 103 - "v"
Cohesion: 0.05
Nodes (62): ar, ct, dr, Jt, or, sr, tr, Zt (+54 more)

### Community 104 - "l"
Cohesion: 0.10
Nodes (47): e, t, Ah, Cp, Eh(), fe(), fp(), ip() (+39 more)

### Community 105 - "o"
Cohesion: 0.08
Nodes (14): f1(), Zm(), ck(), ny(), Tt(), At(), dl, ga() (+6 more)

### Community 106 - "os"
Cohesion: 0.06
Nodes (13): lo, ao, co(), cs(), fo, ho(), lo(), ns() (+5 more)

### Community 107 - "Dashboard-CiJmES5V.js"
Cohesion: 0.11
Nodes (24): o(), ph(), ug, $y, B(), De, Ee, Ie (+16 more)

### Community 108 - ".forEach"
Cohesion: 0.09
Nodes (18): brighter(), darker(), aa(), da(), fa(), fl(), Fn(), io() (+10 more)

### Community 110 - "BetsManager-DThhK6Cx.js"
Cohesion: 0.07
Nodes (35): qy(), Vy(), Df(), ey(), Nr(), qf(), qv(), X0() (+27 more)

### Community 111 - "MobileApp.tsx"
Cohesion: 0.07
Nodes (31): cd(), clamp(), copy(), cS(), dI(), displayable(), Ei(), Ek() (+23 more)

### Community 112 - "rs"
Cohesion: 0.05
Nodes (18): Xn(), Si(), $a, au, ds(), fs(), Gi(), Gl() (+10 more)

### Community 113 - "Ct"
Cohesion: 0.09
Nodes (26): ap(), Ct(), cu(), Cx(), Db(), deref(), Ex(), gc() (+18 more)

### Community 114 - "bo"
Cohesion: 0.07
Nodes (9): bo, Cn(), es(), Ni(), or(), Pn(), so(), Tn() (+1 more)

### Community 116 - "lk"
Cohesion: 0.09
Nodes (20): aw(), Bk(), c1(), dM(), Ec(), fm(), Ic(), iw() (+12 more)

### Community 119 - "Ze"
Cohesion: 0.05
Nodes (31): c1(), e1(), Gm, Km(), kn(), Ks(), l1(), m1 (+23 more)

### Community 120 - ".readValue"
Cohesion: 0.18
Nodes (3): ki(), qr(), ze

### Community 121 - "iO"
Cohesion: 0.08
Nodes (25): aO(), cf(), eO(), Fr(), fS(), Gg(), iO(), lf() (+17 more)

### Community 122 - "Ht"
Cohesion: 0.14
Nodes (5): av(), Hr(), Ht, ks(), Yi()

### Community 123 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 124 - "DesktopApp.tsx"
Cohesion: 0.11
Nodes (9): e, a, A, G(), V(), m, m, G (+1 more)

### Community 125 - "MobileSocial-BXwyEbj8.js"
Cohesion: 0.20
Nodes (3): j, z(), o

### Community 126 - "MobileImport-COK0PxdU.js"
Cohesion: 0.30
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 127 - "en"
Cohesion: 0.13
Nodes (17): cu(), en(), ft, go(), jo(), $o(), pr(), ql() (+9 more)

### Community 128 - "Do"
Cohesion: 0.11
Nodes (7): Do, ee(), hs(), Pi(), qi(), $s(), wo()

### Community 132 - "qr"
Cohesion: 0.12
Nodes (15): cA(), dc(), EA(), HA(), jC(), Kc(), qr(), sA() (+7 more)

### Community 133 - "vn"
Cohesion: 0.11
Nodes (19): cM(), cO(), dO(), dS(), fO(), Fu(), gS(), hf() (+11 more)

### Community 134 - "j"
Cohesion: 0.31
Nodes (6): C(), d(), f(), g, m(), R()

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
Cohesion: 0.18
Nodes (6): hp(), Ba, ja(), ka(), ls, Ui

### Community 142 - "BetTrackr"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 144 - "Nh"
Cohesion: 0.22
Nodes (3): cg, wm(), Nh

### Community 146 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 147 - "vercel.json"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 152 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 153 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

## Knowledge Gaps
- **500 isolated node(s):** `Jt`, `Zt`, `tr`, `ar`, `sr` (+495 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `b` connect `index-GUdJqaP1.js` to `CLAUDE.md`, `build.gradle`, `build.gradle`, `vn`, `BetTrackr — Extensão de importação de apostas`, `variables.gradle`, `l`, `settings.gradle`, `lk`, `I`, `rr`, `Ze`, `.constructor`, `iO`, `Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior`, `DesktopApp.tsx`, `concat`?**
  _High betweenness centrality (0.241) - this node is a cross-community bridge._
- **Why does `BetsManager()` connect `settings.gradle` to `Bet Lifecycle UI`, `MobileImport-COK0PxdU.js`, `index-GUdJqaP1.js`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `MobileBets()` connect `settings.gradle` to `import-utils.js`, `index-GUdJqaP1.js`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `t()` (e.g. with `qy()` and `ad()`) actually correct?**
  _`t()` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 32 inferred relationships involving `qy()` (e.g. with `F()` and `l()`) actually correct?**
  _`qy()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 57 inferred relationships involving `l()` (e.g. with `pe()` and `H()`) actually correct?**
  _`l()` has 57 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `nr` (e.g. with `U()` and `E()`) actually correct?**
  _`nr` has 11 INFERRED edges - model-reasoned connections that need verification._
# Graph Report - bettrackr  (2026-07-23)

## Corpus Check
- 148 files · ~166,865 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 987 nodes · 1968 edges · 125 communities (56 shown, 69 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfbbd007`
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
- capacitor.build.gradle
- build.gradle
- capacitor.settings.gradle
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
- MobileImport-COK0PxdU.js
- scripts
- package.json

## God Nodes (most connected - your core abstractions)
1. `authFetch()` - 39 edges
2. `parseJsonResponse()` - 38 edges
3. `Bet` - 33 edges
4. `safeNum()` - 24 edges
5. `isNativeApp()` - 23 edges
6. `BookieAccount` - 22 edges
7. `useToast()` - 16 edges
8. `BetStatus` - 16 edges
9. `App()` - 15 edges
10. `bet()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts
- `useBetForm()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBetForm.ts → extension/test/dashboard-stats.test.ts
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts
- `MobileBets()` --indirect_call--> `bet()`  [INFERRED]
  src/mobile/screens/MobileBets.tsx → extension/test/dashboard-stats.test.ts
- `ScreenshotImporter()` --indirect_call--> `response()`  [INFERRED]
  src/components/ScreenshotImporter.tsx → extension/test/bettrackr-identity.test.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (125 total, 69 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.17
Nodes (24): response(), BetsManager(), ScreenshotImporter(), ScreenshotImporterProps, FormSelection, nowLocal(), useBetForm(), AVAILABLE_BOOKMAKERS (+16 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.11
Nodes (29): betanoRequestId(), betanoTokenWaiters, betclicReadStateFn(), BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab(), extensionStatus() (+21 more)

### Community 2 - "App Shell and State"
Cohesion: 0.07
Nodes (71): App(), AccountPanel(), AIInsights(), AIInsightsProps, InsightsResponse, Pick, Social(), SocialProps (+63 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.04
Nodes (45): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+37 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.15
Nodes (13): @capacitor/cli, devDependencies, @capacitor/cli, tailwindcss, @types/express, @types/node, @types/pg, typescript (+5 more)

### Community 5 - "API Security and Database"
Cohesion: 0.06
Nodes (37): connect(), getPool(), query(), extractJson(), getGeminiClient(), tryParse(), AuthenticatedRequest, authenticatedUserFromRequest() (+29 more)

### Community 6 - "History and Reconciliation"
Cohesion: 0.28
Nodes (14): amountOrNull(), betclicRef(), betclicSelectionResult(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet() (+6 more)

### Community 7 - "TypeScript Project Config"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 8 - "Browser Extension Manifest"
Cohesion: 0.05
Nodes (36): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+28 more)

### Community 9 - "Extension Popup UI"
Cohesion: 0.06
Nodes (37): accountBox, accountChoices, accountHints, accountOptionsByKey, accountsBox, accountSelects, accountUser, applyDetectedUsernames() (+29 more)

### Community 15 - "Extension Import Settings"
Cohesion: 0.09
Nodes (25): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), EnabledBookmakersCard(), EnabledBookmakersCardProps (+17 more)

### Community 16 - "Vercel Deployment"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.10
Nodes (20): AccountPanelProps, AuthPageProps, Mode, BrandMark(), AIInsights, BetsManager, Dashboard, DesktopApp() (+12 more)

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
Cohesion: 0.10
Nodes (34): AppProps, DesktopApp, Gallery, MobileApp, BetsManagerProps, BookieAccountsCardProps, DashboardBetsFilters, DashboardProps (+26 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "Cashout Freebet Migration"
Cohesion: 0.15
Nodes (15): AccountSheet(), InsightsResponse, MobileInsightsProps, Pick, GalleryInner(), MobileBets, MobileDashboard, ListGroup() (+7 more)

### Community 29 - "vite.config.ssr.ts"
Cohesion: 0.20
Nodes (13): app, runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileBets, MobileDashboard (+5 more)

### Community 32 - "Betclic Content Bridge"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "bet"
Cohesion: 0.14
Nodes (23): accountsForBookmaker(), betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchBettrackrAccounts(), fetchExistingBets(), fetchSolverdeBets(), importKey() (+15 more)

### Community 36 - "betStatus.ts"
Cohesion: 0.29
Nodes (14): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoBets(), mapBetanoSelectionResult() (+6 more)

### Community 37 - "importers.test.js"
Cohesion: 0.22
Nodes (13): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+5 more)

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.21
Nodes (11): tapHaptic(), ChipGroup(), ChipGroupProps, FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+3 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "import-utils.js"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 86 - "rr"
Cohesion: 0.23
Nodes (9): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps, SheetPage() (+1 more)

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.17
Nodes (9): MobileDashboard(), MONEY_OPTIONS, MONTHS_PT, STATUS_META, Timeframe, TIMEFRAME_OPTIONS, toKey(), TONES (+1 more)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 90 - "ExampleInstrumentedTest.java"
Cohesion: 0.60
Nodes (3): ExampleInstrumentedTest, Test, RunWith

### Community 91 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.18
Nodes (8): formatDay(), MobileBets(), MONEY_OPTIONS, SORT_OPTIONS, SortField, STATUS_META, STATUS_OPTIONS, TYPE_OPTIONS

### Community 92 - "ExampleUnitTest.java"
Cohesion: 0.42
Nodes (8): Settings(), deliverTextFile(), exportBackupJSON(), exportBetsCSV(), importBetsFromFile(), parseCSVRow(), useI18n(), ThemeMode

### Community 93 - "concat"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 96 - "CLAUDE.md"
Cohesion: 0.25
Nodes (7): builds, crons, test, git, deploymentEnabled, routes, version

### Community 97 - "build.gradle"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 98 - "capacitor.build.gradle"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 100 - "capacitor.settings.gradle"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 101 - "settings.gradle"
Cohesion: 0.11
Nodes (29): parse(), now, SortDirection, SortField, Dashboard(), FilterDropdownOption, FilterDropdownProps, FiltersBarProps (+21 more)

### Community 102 - "variables.gradle"
Cohesion: 0.83
Nodes (3): addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 126 - "MobileImport-COK0PxdU.js"
Cohesion: 0.35
Nodes (9): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+1 more)

### Community 137 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, android:open, android:sync, build, clean, dev, lint, preview (+3 more)

### Community 152 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

## Knowledge Gaps
- **354 isolated node(s):** `config`, `bets`, `users`, `bets`, `manifest_version` (+349 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bet()` connect `bet` to `Bet Lifecycle UI`, `App Shell and State`, `betStatus.ts`, `importers.test.js`, `variables.gradle`, `mapper-solverde.js`, `Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `package.json`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `ScreenshotImporter()` connect `Bet Lifecycle UI` to `App Shell and State`, `Runtime Dependencies`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `config`, `bets`, `users` to the rest of the system?**
  _354 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Extension Import Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.10887096774193548 - nodes in this community are weakly interconnected._
- **Should `App Shell and State` be split into smaller, more focused modules?**
  _Cohesion score 0.07359781121751026 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
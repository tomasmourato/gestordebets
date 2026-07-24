# Graph Report - bettrackr-betano-account  (2026-07-24)

## Corpus Check
- 149 files · ~176,700 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1028 nodes · 2059 edges · 129 communities (57 shown, 72 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2190b62e`
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
- N
- I
- .constructor
- BetclicImport.tsx
- Implementation Plan
- i18n.tsx
- @capacitor/cli
- bets
- ErrorBoundary

## God Nodes (most connected - your core abstractions)
1. `authFetch()` - 41 edges
2. `parseJsonResponse()` - 40 edges
3. `Bet` - 33 edges
4. `isNativeApp()` - 25 edges
5. `safeNum()` - 24 edges
6. `BookieAccount` - 22 edges
7. `useToast()` - 18 edges
8. `bet()` - 16 edges
9. `BetStatus` - 16 edges
10. `App()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `AIInsights()` --indirect_call--> `bet()`  [INFERRED]
  src/components/AIInsights.tsx → extension/test/dashboard-stats.test.ts
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts
- `useBetForm()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBetForm.ts → extension/test/dashboard-stats.test.ts
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts
- `MobileBets()` --indirect_call--> `bet()`  [INFERRED]
  src/mobile/screens/MobileBets.tsx → extension/test/dashboard-stats.test.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (129 total, 72 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.15
Nodes (26): useBets(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets(), mapBetFromApi() (+18 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.09
Nodes (33): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab(), extensionStatus() (+25 more)

### Community 2 - "App Shell and State"
Cohesion: 0.10
Nodes (45): AIInsights(), AIInsightsProps, InsightsResponse, Pick, toneClasses(), Social(), SocialProps, statusMeta() (+37 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.04
Nodes (45): bcryptjs, @capacitor/android, @capacitor/app, @capacitor/camera, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+37 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.15
Nodes (13): adm-zip, @capacitor/cli, devDependencies, adm-zip, @capacitor/cli, @types/express, @types/node, @types/pg (+5 more)

### Community 5 - "API Security and Database"
Cohesion: 0.05
Nodes (44): connect(), getPool(), query(), extractJson(), getGeminiClient(), tryParse(), AuthenticatedRequest, authenticatedUserFromRequest() (+36 more)

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
Cohesion: 0.21
Nodes (11): tapHaptic(), ChipGroup(), ChipGroupProps, FAB(), FABProps, ChipOption, FilterChips(), FilterChipsProps (+3 more)

### Community 16 - "Vercel Deployment"
Cohesion: 0.14
Nodes (10): BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, formatDay(), MobileBets(), MONEY_OPTIONS, SORT_OPTIONS, SortField, STATUS_META (+2 more)

### Community 18 - "Betano Request Capture"
Cohesion: 0.31
Nodes (9): emitIdentity(), fetchCustomerIdFromApi(), fetchUsernameFromBalance(), headersToObject(), isBetanoRequest(), maybeCaptureIdentityFromResponse(), readInitialStateIdentity(), rememberHeaders() (+1 more)

### Community 19 - "Gemini Import Planning"
Cohesion: 0.23
Nodes (9): BackEntry, push(), remove(), stack, useBackHandler(), BottomSheet(), BottomSheetProps, SheetPage() (+1 more)

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
Cohesion: 0.16
Nodes (15): App(), AppProps, DesktopApp, Gallery, MobileApp, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES (+7 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

### Community 28 - "Cashout Freebet Migration"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 29 - "vite.config.ssr.ts"
Cohesion: 0.13
Nodes (17): haptics(), ImpactWeight, NotificationKind, notifyHaptic(), selectionHaptic(), PullToRefresh(), PullToRefreshProps, SwipeableRow() (+9 more)

### Community 32 - "Betclic Content Bridge"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "bet"
Cohesion: 0.17
Nodes (20): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchBettrackrAccounts(), fetchExistingBets(), fetchSolverdeBets(), importKey(), persistMapped() (+12 more)

### Community 36 - "betStatus.ts"
Cohesion: 0.31
Nodes (13): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoSelectionResult(), mapBetanoStatus() (+5 more)

### Community 37 - "importers.test.js"
Cohesion: 0.18
Nodes (16): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+8 more)

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.18
Nodes (11): scripts, android:open, android:sync, build, clean, dev, lint, preview (+3 more)

### Community 84 - "mapper-solverde.js"
Cohesion: 0.33
Nodes (11): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapSolverdeBets(), mapStatus(), normalize(), num() (+3 more)

### Community 85 - "import-utils.js"
Cohesion: 0.18
Nodes (14): app, runTopBackHandler(), exitNativeApp(), setThemeColorMeta(), useAndroidBackButton(), useNativeChrome(), MobileBets, MobileDashboard (+6 more)

### Community 86 - "rr"
Cohesion: 0.22
Nodes (15): AccountPanel(), AccountPanelProps, clearToken(), CurrentUser, errorFrom(), fetchCurrentUser(), getToken(), isAuthenticated() (+7 more)

### Community 87 - "index-GUdJqaP1.js"
Cohesion: 0.25
Nodes (7): 1. How Betclic works today (the pattern to mirror), 2. Betano research findings (from the two HARs + code), 3. Open question to resolve live (HAR can't answer), 4. Implementation steps (mirror Betclic), 5. Testing, 6. Risks / notes, Plan: Automatic account switching for Betano (mirror Betclic)

### Community 88 - "bundle-app.mjs"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 89 - "gen-icons.mjs"
Cohesion: 0.33
Nodes (3): base, master, repoRoot

### Community 91 - "Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 92 - "ExampleUnitTest.java"
Cohesion: 0.25
Nodes (7): builds, crons, test, git, deploymentEnabled, routes, version

### Community 93 - "concat"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 96 - "CLAUDE.md"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 97 - "build.gradle"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 98 - "capacitor.build.gradle"
Cohesion: 0.16
Nodes (11): AuthPageProps, Mode, BrandMark(), AIInsights, BetsManager, Dashboard, DesktopApp(), ScreenshotImporter (+3 more)

### Community 101 - "settings.gradle"
Cohesion: 0.07
Nodes (42): parse(), now, BetsManager(), BULK_MONEY_OPTIONS, BULK_STATUS_OPTIONS, SortDirection, SortField, Dashboard() (+34 more)

### Community 104 - "l"
Cohesion: 0.29
Nodes (10): apiUrl(), configured, isNativeApp(), getBundleVersion(), initLiveUpdate(), readOverride(), shouldUseMobileUI(), UiOverride (+2 more)

### Community 109 - "Settings-B3PiUVnh.js"
Cohesion: 0.19
Nodes (14): AccountSheet(), AccountSheetProps, GalleryInner(), MobileBets, MobileDashboard, ListGroup(), ListItem(), ListItemProps (+6 more)

### Community 115 - "N"
Cohesion: 0.08
Nodes (58): response(), BetsManagerProps, BookieAccountsCardProps, DashboardBetsFilters, DashboardProps, EnabledBookmakersCard(), EnabledBookmakersCardProps, ScreenshotImporter() (+50 more)

### Community 122 - "BetclicImport.tsx"
Cohesion: 0.24
Nodes (9): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), AllSourcesImportResult, BookmakerImportResult (+1 more)

### Community 123 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 124 - "i18n.tsx"
Cohesion: 0.29
Nodes (7): DICT, Entry, I18nContext, I18nProvider(), I18nValue, translate(), useI18n()

### Community 182 - "ErrorBoundary"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

## Knowledge Gaps
- **368 isolated node(s):** `config`, `bets`, `users`, `bets`, `manifest_version` (+363 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bet()` connect `bet` to `Bet Lifecycle UI`, `App Shell and State`, `settings.gradle`, `importers.test.js`, `Vercel Deployment`, `N`, `mapper-solverde.js`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `ScreenshotImporter()` connect `N` to `App Shell and State`, `Runtime Dependencies`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `CLAUDE.md`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `config`, `bets`, `users` to the rest of the system?**
  _368 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Extension Import Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.08819345661450925 - nodes in this community are weakly interconnected._
- **Should `App Shell and State` be split into smaller, more focused modules?**
  _Cohesion score 0.09860859044162129 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
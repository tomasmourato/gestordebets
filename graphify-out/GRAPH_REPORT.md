# Graph Report - bettrackr  (2026-07-21)

## Corpus Check
- 117 files · ~145,996 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 809 nodes · 1434 edges · 103 communities (46 shown, 57 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a455dcbb`
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
- persistMapped
- Betclic Content Bridge
- betStatus.ts
- betStatus.ts
- import-utils.js
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
- bettrackr-identity.js
- fetchSolverdeHistory
- migrate.mjs
- bundle-app.mjs
- gen-icons.mjs
- ExampleInstrumentedTest.java
- Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior
- ExampleUnitTest.java
- gradlew
- MainActivity.java
- capacitor.config.ts
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `authFetch()` - 35 edges
2. `parseJsonResponse()` - 34 edges
3. `Bet` - 20 edges
4. `App()` - 17 edges
5. `mapBetFromApi()` - 15 edges
6. `safeNum()` - 15 edges
7. `compilerOptions` - 14 edges
8. `normalizeBetStatus()` - 13 edges
9. `bet()` - 12 edges
10. `BookieAccount` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ScreenshotImporter()` --indirect_call--> `response()`  [INFERRED]
  src/components/ScreenshotImporter.tsx → extension/test/bettrackr-identity.test.js
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts
- `React Application Mount Point` --implements--> `BetTrackr`  [INFERRED]
  index.html → README.md
- `parse()` --calls--> `readFilters()`  [EXTRACTED]
  extension/test/filter-params.test.ts → src/lib/filterParams.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (103 total, 57 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.05
Nodes (77): response(), parse(), now, react, react, BetsManager(), BetsManagerProps, SortDirection (+69 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.10
Nodes (35): accountsForBookmaker(), betanoRequestId(), betanoTokenWaiters, betclicReadStateFn(), BETTRACKR_APP_URLS, configForImport(), detectBookmakerUsernames(), ensureBetanoHistoryTab() (+27 more)

### Community 2 - "App Shell and State"
Cohesion: 0.09
Nodes (55): AIInsights(), AIInsightsProps, InsightsResponse, Pick, Social(), SocialProps, statusMeta(), useAccounts() (+47 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (43): bcryptjs, @capacitor/android, @capacitor/core, @capgo/capacitor-updater, dotenv, express, @google/genai, jsonwebtoken (+35 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.06
Nodes (33): adm-zip, @capacitor/cli, esbuild, devDependencies, adm-zip, @capacitor/cli, esbuild, tailwindcss (+25 more)

### Community 5 - "API Security and Database"
Cohesion: 0.05
Nodes (44): connect(), getPool(), query(), extractJson(), getGeminiClient(), AuthenticatedRequest, authenticatedUserFromRequest(), authenticateToken() (+36 more)

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

### Community 11 - "App Architecture and Auth"
Cohesion: 0.22
Nodes (8): React Application Mount Point, API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 15 - "Extension Import Settings"
Cohesion: 0.14
Nodes (15): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIE_KEYS, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), EnabledBookmakersCard(), EnabledBookmakersCardProps (+7 more)

### Community 16 - "Vercel Deployment"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

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

### Community 25 - "Canonical Database Schema"
Cohesion: 0.06
Nodes (37): AIInsights, App(), AppProps, AppTab, BetsManager, BrandMark(), Dashboard, NAV_ITEMS (+29 more)

### Community 27 - "Status Constraint Migration"
Cohesion: 0.36
Nodes (10): flattenSelections(), formatDateTime(), isCashoutStatus(), mapSolverdeBet(), mapStatus(), normalize(), num(), round2() (+2 more)

### Community 29 - "persistMapped"
Cohesion: 0.20
Nodes (17): betPayload(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets(), importKey(), persistMapped(), postBulk(), progress() (+9 more)

### Community 32 - "Betclic Content Bridge"
Cohesion: 0.70
Nodes (4): betclicLoggedIn(), captureBetclicUsername(), extensionAlive(), extractBetclicUsername()

### Community 34 - "betStatus.ts"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

### Community 36 - "betStatus.ts"
Cohesion: 0.31
Nodes (13): betanoRef(), CASHOUT_STATUS_TOKENS, dateTime(), flattenSelections(), isBetanoCashout(), mapBetanoBet(), mapBetanoSelectionResult(), mapBetanoStatus() (+5 more)

### Community 37 - "import-utils.js"
Cohesion: 0.36
Nodes (6): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), mapBetclicBet

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 84 - "bettrackr-identity.js"
Cohesion: 0.57
Nodes (5): cleanBaseUrl(), cleanUserId(), responseError(), runAfterBettrackrVerification(), verifyBettrackrIdentity()

### Community 85 - "fetchSolverdeHistory"
Cohesion: 0.47
Nodes (5): fetchSolverdeBets(), solverdeRequestPage(), addDays(), fetchSolverdeHistory(), solverdeHistoryStart()

### Community 86 - "migrate.mjs"
Cohesion: 0.40
Nodes (4): dir, files, isLocalDb, pool

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
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior, Source Nodes

### Community 93 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

## Knowledge Gaps
- **290 isolated node(s):** `config`, `bets`, `users`, `bets`, `manifest_version` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bet()` connect `persistMapped` to `Bet Lifecycle UI`, `betStatus.ts`, `App Shell and State`, `fetchSolverdeHistory`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Bet Lifecycle UI`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `react` connect `Bet Lifecycle UI` to `Runtime Dependencies`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `config`, `bets`, `users` to the rest of the system?**
  _290 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bet Lifecycle UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05494949494949495 - nodes in this community are weakly interconnected._
- **Should `Extension Import Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.0953058321479374 - nodes in this community are weakly interconnected._
- **Should `App Shell and State` be split into smaller, more focused modules?**
  _Cohesion score 0.09271822704658525 - nodes in this community are weakly interconnected._
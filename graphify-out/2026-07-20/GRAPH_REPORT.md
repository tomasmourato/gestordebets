# Graph Report - bettrackr  (2026-07-13)

## Corpus Check
- 58 files · ~47,702 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 500 nodes · 763 edges · 84 communities (28 shown, 56 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `842e87c8`
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
- Status Constraint Migration
- Cashout Freebet Migration
- Cashout Enforcement Migration
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

## God Nodes (most connected - your core abstractions)
1. `Bet` - 14 edges
2. `compilerOptions` - 14 edges
3. `normalizeBetStatus()` - 13 edges
4. `safeNum()` - 13 edges
5. `parseJsonResponse()` - 12 edges
6. `authFetch()` - 12 edges
7. `Implementation Plan` - 11 edges
8. `persistMapped()` - 10 edges
9. `runBetanoImport()` - 10 edges
10. `App()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts
- `React Application Mount Point` --implements--> `BetTrackr`  [INFERRED]
  index.html → README.md
- `ScreenshotImporter()` --references--> `react`  [EXTRACTED]
  src/components/ScreenshotImporter.tsx → package.json
- `parseBetPayload()` --calls--> `normalizeBetStatus()`  [EXTRACTED]
  routes/betsRoutes.ts → src/lib/betStatus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (84 total, 56 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.09
Nodes (49): App(), BetsManager(), BetsManagerProps, SortDirection, SortField, Dashboard(), DashboardProps, matchBookmaker() (+41 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.09
Nodes (47): betanoRequestId(), betanoTokenWaiters, betPayload(), ensureBetanoHistoryTab(), fetchBetanoBets(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets() (+39 more)

### Community 2 - "App Shell and State"
Cohesion: 0.17
Nodes (26): AuthPageProps, Mode, useBets(), authFetch(), clearToken(), errorFrom(), getToken(), login() (+18 more)

### Community 3 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (37): bcryptjs, dotenv, express, @google/genai, jsonwebtoken, lucide-react, motion, dependencies (+29 more)

### Community 4 - "Build Toolchain"
Cohesion: 0.06
Nodes (31): adm-zip, esbuild, devDependencies, adm-zip, esbuild, tailwindcss, @tailwindcss/vite, tsx (+23 more)

### Community 5 - "API Security and Database"
Cohesion: 0.10
Nodes (19): connect(), getPool(), query(), AuthenticatedRequest, authenticateToken(), getJwtSecret(), Bucket, rateLimit() (+11 more)

### Community 6 - "History and Reconciliation"
Cohesion: 0.36
Nodes (11): amountOrNull(), betclicRef(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet(), mapBets() (+3 more)

### Community 7 - "TypeScript Project Config"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 8 - "Browser Extension Manifest"
Cohesion: 0.08
Nodes (23): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+15 more)

### Community 9 - "Extension Popup UI"
Cohesion: 0.19
Nodes (13): buttons, dotBetano, dotBetclic, dotBettrackr, formatSource(), importSource(), msg, refreshStatus() (+5 more)

### Community 11 - "App Architecture and Auth"
Cohesion: 0.25
Nodes (7): React Application Mount Point, API, Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 15 - "Extension Import Settings"
Cohesion: 0.39
Nodes (5): BetclicImport(), importSummary(), AllSourcesImportResult, BookmakerImportResult, useBetclicExtension()

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

### Community 36 - "betStatus.ts"
Cohesion: 0.30
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 37 - "import-utils.js"
Cohesion: 0.50
Nodes (7): comparableExisting(), importedBetChanged(), importKeyOf(), indexExistingBets(), metadataOf(), reconcileImportedBets(), stable()

### Community 38 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

## Knowledge Gaps
- **201 isolated node(s):** `bets`, `users`, `bets`, `bets`, `bets` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bet()` connect `Extension Import Orchestration` to `Bet Lifecycle UI`, `App Shell and State`, `import-utils.js`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `ScreenshotImporter()` connect `Bet Lifecycle UI` to `App Shell and State`, `Runtime Dependencies`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **What connects `bets`, `users`, `bets` to the rest of the system?**
  _201 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bet Lifecycle UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08630952380952381 - nodes in this community are weakly interconnected._
- **Should `Extension Import Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.08563134978229318 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Build Toolchain` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
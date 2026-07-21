# Graph Report - .  (2026-07-13)

## Corpus Check
- Corpus is ~47,590 words - fits in a single context window. You may not need a graph.

## Summary
- 461 nodes · 777 edges · 36 communities (30 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 14 edges
2. `normalizeBetStatus()` - 13 edges
3. `Bet` - 13 edges
4. `safeNum()` - 13 edges
5. `parseJsonResponse()` - 12 edges
6. `authFetch()` - 12 edges
7. `App()` - 10 edges
8. `mapBetFromApi()` - 10 edges
9. `host_permissions` - 9 edges
10. `persistMapped()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Bookmaker Adapter Architecture` --semantically_similar_to--> `Bookmaker-Specific Bet Mappers`  [INFERRED] [semantically similar]
  PLAN.md → extension/README.md
- `Trust Imported Actual Payouts` --conceptually_related_to--> `Bookmaker-Specific Bet Mappers`  [INFERRED]
  PLAN.md → extension/README.md
- `Extension Credential Security Constraints` --semantically_similar_to--> `No Embedded Session Credentials`  [INFERRED] [semantically similar]
  PLAN.md → extension/README.md
- `Automated Bookmaker Access Terms Risk` --semantically_similar_to--> `Automated Access Terms Limitation`  [INFERRED] [semantically similar]
  PLAN.md → extension/README.md
- `BetTrackr API Delivery` --shares_data_with--> `Authenticated Bets API`  [INFERRED]
  extension/README.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cashout End-to-End Delivery** — plan_cashout_first_class_outcome, plan_extension_cashout_import, plan_dashboard_result_distribution_fix, plan_cashout_end_to_end_slice [EXTRACTED 1.00]
- **Bookmaker-Aware Freebet Model** — plan_structured_bookmaker_registry, plan_freebet_types, plan_snr_freebet, plan_sr_freebet, plan_bookmaker_freebet_defaults [EXTRACTED 1.00]
- **Extension Import Pipeline** — extension_readme_session_capture, extension_readme_bet_reading, extension_readme_bookie_mappers, extension_readme_deduplication_updates, extension_readme_bettrackr_api_delivery [EXTRACTED 1.00]
- **Sports Betting Tracking Motif** — public_pwa_192x192_betting_slip, public_pwa_192x192_soccer_ball, public_pwa_192x192_performance_bar_chart [INFERRED 0.85]
- **Sports Analytics Branding** — public_pwa_512x512_bettrackr_pwa_icon, public_pwa_512x512_football, public_pwa_512x512_performance_analytics, public_pwa_512x512_upward_trend, public_pwa_512x512_betting_ticket [INFERRED 0.95]

## Communities (36 total, 6 thin omitted)

### Community 0 - "Bet Lifecycle UI"
Cohesion: 0.09
Nodes (55): BetsManager(), BetsManagerProps, SortDirection, SortField, Dashboard(), DashboardProps, matchBookmaker(), matchStatus() (+47 more)

### Community 1 - "Extension Import Orchestration"
Cohesion: 0.10
Nodes (40): betanoRequestId(), betanoTokenWaiters, betPayload(), ensureBetanoHistoryTab(), fetchBetanoBets(), fetchBetclicBets(), fetchBetclicBetsForImport(), fetchExistingBets() (+32 more)

### Community 2 - "App Shell and State"
Cohesion: 0.09
Nodes (30): App(), AuthPageProps, Mode, makeInitialLogs(), useAuditLog(), DEFAULT_PREFERENCES, loadPreferences(), usePreferences() (+22 more)

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
Cohesion: 0.14
Nodes (24): createSixMonthWindows(), EARLIEST_HISTORY, fetchBetanoHistory(), fetchPages(), fetchBetclicHistory(), comparableExisting(), importedBetChanged(), importKeyOf() (+16 more)

### Community 7 - "TypeScript Project Config"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 8 - "Browser Extension Manifest"
Cohesion: 0.08
Nodes (23): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+15 more)

### Community 9 - "Extension Popup UI"
Cohesion: 0.19
Nodes (13): buttons, dotBetano, dotBetclic, dotBettrackr, formatSource(), importSource(), msg, refreshStatus() (+5 more)

### Community 10 - "Extension Security and Sessions"
Cohesion: 0.24
Nodes (10): Bookmaker and BetTrackr Session Status, Extension Usage Instructions, Paginated Bookmaker Bet Reading, BetTrackr Browser Import Extension, No Embedded Session Credentials, Bookmaker Session Capture, Automated Access Terms Limitation, Extension Login and Opt-In Auto-Import (+2 more)

### Community 11 - "App Architecture and Auth"
Cohesion: 0.20
Nodes (10): Pre-Mount Theme Bootstrap, React Application Mount Point, Internationalization, BetTrackr Application Stack, Authenticated Bets API, BetTrackr, Browser Token User Cache and Preferences, JWT Authentication (+2 more)

### Community 12 - "Cashout and Freebet Logic"
Cohesion: 0.22
Nodes (10): Trust Imported Actual Payouts, Cashout as a First-Class Settled Outcome, Foundation-First Delivery Sequence, Typed Freebet Rules, FreeBetOffers Stake Return Guide, GamblingCalc Free Bet Calculator, Stake Not Returned Freebet, Stake Returned Freebet (+2 more)

### Community 13 - "Bookmaker Freebet Research"
Cohesion: 0.25
Nodes (8): Aposta Legal Bwin Portugal Guide, Betano Brazil Help Centre, Per-Bookmaker Freebet Defaults, Bookmaker Ratings Freebet Guide, Observador Bwin Guide, Olhar Digital Betano Freebet Guide, Placard FAQ, Viva Aposta Placard Guide

### Community 14 - "Product Feature Architecture"
Cohesion: 0.29
Nodes (8): Cashout End-to-End Build Slice, Dashboard Filters, Dashboard Result Distribution Fix, Bookmaker Adapter Architecture, Extension Cashout Import, Structured Bookmaker Registry, Dashboard Improvements, Extension Import Improvements

### Community 15 - "Extension Import Settings"
Cohesion: 0.39
Nodes (5): BetclicImport(), importSummary(), AllSourcesImportResult, BookmakerImportResult, useBetclicExtension()

### Community 16 - "Vercel Deployment"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 17 - "Bookmaker Adapter Pipeline"
Cohesion: 0.33
Nodes (6): Bookmaker Import Actions, Betano Import Integration, Betclic Import Integration, BetTrackr API Delivery, Bookmaker-Specific Bet Mappers, Bet Deduplication and Settlement Updates

### Community 18 - "Betano Request Capture"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "Gemini Import Planning"
Cohesion: 0.40
Nodes (5): Gemini Multi-Bet Screenshot Import, Implementation Plan, Gemini Screenshot Bet Extraction, Gemini Multi-Bet Import Request, BetTrackr Product Backlog

### Community 20 - "PWA Icon 192"
Cohesion: 0.70
Nodes (5): Betting Slip, Performance Bar Chart, Soccer Ball, Sports Betting Analytics, Sports Betting Analytics App Icon

### Community 21 - "PWA Icon 512"
Cohesion: 0.50
Nodes (5): Betting Ticket, BetTrackr PWA Icon, Football, Performance Analytics, Upward Trend

### Community 22 - "Extension Packaging"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

## Knowledge Gaps
- **147 isolated node(s):** `bets`, `users`, `bets`, `bets`, `bets` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ScreenshotImporter()` connect `Bet Lifecycle UI` to `Runtime Dependencies`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `react` connect `Runtime Dependencies` to `Bet Lifecycle UI`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `bets`, `users`, `bets` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Bet Lifecycle UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09226594301221167 - nodes in this community are weakly interconnected._
- **Should `Extension Import Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.10188261351052048 - nodes in this community are weakly interconnected._
- **Should `App Shell and State` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
# Graph Report - gestão-de-apostas  (2026-07-14)

## Corpus Check
- 68 files · ~56,436 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 468 nodes · 867 edges · 27 communities (25 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5fe9b62`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- background.js
- dependencies
- server.ts
- betsApi.ts
- devDependencies
- compilerOptions
- Implementation Plan
- manifest.json
- authApi.ts
- popup.js
- mapper.js
- BetclicImport.tsx
- BetTrackr — Extensão de importação de apostas
- BetTrackr
- vercel.json
- rememberHeaders
- zip-extension.mjs
- inject.js
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `parseJsonResponse()` - 22 edges
2. `authFetch()` - 22 edges
3. `Bet` - 16 edges
4. `safeNum()` - 15 edges
5. `compilerOptions` - 14 edges
6. `normalizeBetStatus()` - 13 edges
7. `mapBetFromApi()` - 12 edges
8. `App()` - 11 edges
9. `Social()` - 11 edges
10. `Implementation Plan` - 11 edges

## Surprising Connections (you probably didn't know these)
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts
- `ScreenshotImporter()` --references--> `react`  [EXTRACTED]
  src/components/ScreenshotImporter.tsx → package.json
- `parseBetPayload()` --calls--> `normalizeBetStatus()`  [EXTRACTED]
  routes/betsRoutes.ts → src/lib/betStatus.ts
- `fetchBetclicBetsForImport()` --calls--> `betclicRef()`  [EXTRACTED]
  extension/src/background.js → extension/src/mapper.js

## Import Cycles
- None detected.

## Communities (27 total, 2 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (51): BetsManager(), BetsManagerProps, SortDirection, SortField, calendarDaysFor(), Dashboard(), DashboardBetsFilters, DashboardProps (+43 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (55): betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, ensureBetanoHistoryTab(), fetchBetanoBets(), fetchBetclicBets(), fetchBetclicBetsForImport() (+47 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (37): bcryptjs, dotenv, express, @google/genai, jsonwebtoken, lucide-react, motion, dependencies (+29 more)

### Community 3 - "server.ts"
Cohesion: 0.10
Nodes (20): connect(), getPool(), query(), AuthenticatedRequest, authenticateToken(), getJwtSecret(), Bucket, rateLimit() (+12 more)

### Community 4 - "betsApi.ts"
Cohesion: 0.20
Nodes (29): Social(), SocialProps, statusMeta(), useBets(), authFetch(), parseJsonResponse(), ApiBetRow, createBet() (+21 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (31): adm-zip, esbuild, devDependencies, adm-zip, esbuild, tailwindcss, @tailwindcss/vite, tsx (+23 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): bootstrap.ts, db, DOM, DOM.Iterable, ES2022, middleware, node, routes (+19 more)

### Community 7 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 8 - "manifest.json"
Cohesion: 0.08
Nodes (24): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+16 more)

### Community 9 - "authApi.ts"
Cohesion: 0.08
Nodes (37): App(), AppTab, TAB_PATHS, tabFromPath(), AccountPanel(), AccountPanelProps, AuthPageProps, Mode (+29 more)

### Community 10 - "popup.js"
Cohesion: 0.19
Nodes (13): buttons, dotBetano, dotBetclic, dotBettrackr, formatSource(), importSource(), msg, refreshStatus() (+5 more)

### Community 11 - "mapper.js"
Cohesion: 0.36
Nodes (11): amountOrNull(), betclicRef(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet(), mapBets() (+3 more)

### Community 14 - "BetclicImport.tsx"
Cohesion: 0.39
Nodes (5): BetclicImport(), importSummary(), AllSourcesImportResult, BookmakerImportResult, useBetclicExtension()

### Community 15 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 16 - "BetTrackr"
Cohesion: 0.29
Nodes (6): API, Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 17 - "vercel.json"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 18 - "rememberHeaders"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "zip-extension.mjs"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

## Knowledge Gaps
- **157 isolated node(s):** `manifest_version`, `name`, `version`, `description`, `storage` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bet()` connect `background.js` to `App.tsx`, `betsApi.ts`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `ScreenshotImporter()` connect `App.tsx` to `dependencies`, `betsApi.ts`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **What connects `manifest_version`, `name`, `version` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08134920634920635 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07244843997884717 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._
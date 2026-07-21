# Graph Report - gestão-de-apostas  (2026-07-17)

## Corpus Check
- 73 files · ~62,029 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 508 nodes · 967 edges · 28 communities (26 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5de892c4`
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
- manifest.json
- authApi.ts
- popup.js
- mapper.js
- Implementation Plan
- BetTrackr — Extensão de importação de apostas
- BetclicImport.tsx
- BetTrackr — Extensão de importação de apostas
- BetTrackr
- vercel.json
- rememberHeaders
- zip-extension.mjs
- inject.js

## God Nodes (most connected - your core abstractions)
1. `parseJsonResponse()` - 27 edges
2. `authFetch()` - 27 edges
3. `Bet` - 18 edges
4. `safeNum()` - 15 edges
5. `compilerOptions` - 14 edges
6. `normalizeBetStatus()` - 13 edges
7. `App()` - 12 edges
8. `mapBetFromApi()` - 12 edges
9. `BookieAccount` - 12 edges
10. `Social()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts
- `useBets()` --indirect_call--> `bet()`  [INFERRED]
  src/hooks/useBets.ts → extension/test/dashboard-stats.test.ts
- `parseBetPayload()` --calls--> `normalizeBetStatus()`  [EXTRACTED]
  routes/betsRoutes.ts → src/lib/betStatus.ts
- `ScreenshotImporter()` --references--> `react`  [EXTRACTED]
  src/components/ScreenshotImporter.tsx → package.json
- `Settings()` --references--> `react`  [EXTRACTED]
  src/components/Settings.tsx → package.json

## Import Cycles
- None detected.

## Communities (28 total, 2 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (54): react, react, BetsManager(), BetsManagerProps, SortDirection, SortField, BookieAccountsCardProps, calendarDaysFor() (+46 more)

### Community 1 - "background.js"
Cohesion: 0.07
Nodes (57): betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, ensureBetanoHistoryTab(), fetchBetanoBets(), fetchBetclicBets(), fetchBetclicBetsForImport() (+49 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (35): bcryptjs, dependencies, bcryptjs, dotenv, express, @google/genai, jsonwebtoken, lucide-react (+27 more)

### Community 3 - "server.ts"
Cohesion: 0.08
Nodes (22): connect(), getPool(), query(), AuthenticatedRequest, authenticateToken(), getJwtSecret(), Bucket, rateLimit() (+14 more)

### Community 4 - "betsApi.ts"
Cohesion: 0.15
Nodes (37): Social(), SocialProps, statusMeta(), useAccounts(), useBets(), ApiAccountRow, createAccount(), deleteAccount() (+29 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (31): adm-zip, devDependencies, adm-zip, esbuild, tailwindcss, @tailwindcss/vite, tsx, @types/express (+23 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+19 more)

### Community 8 - "manifest.json"
Cohesion: 0.08
Nodes (24): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+16 more)

### Community 9 - "authApi.ts"
Cohesion: 0.08
Nodes (37): App(), AppTab, TAB_PATHS, tabFromPath(), AccountPanel(), AccountPanelProps, AuthPageProps, Mode (+29 more)

### Community 10 - "popup.js"
Cohesion: 0.09
Nodes (25): accountBox, accountChoices, accountsBox, accountUser, autoImportToggle, BOOKIES, buttons, dotBetano (+17 more)

### Community 11 - "mapper.js"
Cohesion: 0.36
Nodes (11): amountOrNull(), betclicRef(), calc(), cashoutReturn(), formatDateTime(), isCashoutResult(), mapBet(), mapBets() (+3 more)

### Community 12 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 13 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 14 - "BetclicImport.tsx"
Cohesion: 0.29
Nodes (8): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), AllSourcesImportResult, BookmakerImportResult, useBetclicExtension()

### Community 15 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): API, Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 16 - "BetTrackr"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 18 - "rememberHeaders"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "zip-extension.mjs"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

## Knowledge Gaps
- **171 isolated node(s):** `manifest_version`, `name`, `version`, `description`, `storage` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bet()` connect `background.js` to `App.tsx`, `betsApi.ts`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `App.tsx`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `dependencies`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **What connects `manifest_version`, `name`, `version` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0792838874680307 - nodes in this community are weakly interconnected._
- **Should `background.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06713286713286713 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
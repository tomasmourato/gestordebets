# Graph Report - gestão-de-apostas  (2026-07-19)

## Corpus Check
- 116 files · ~177,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2143 nodes · 5134 edges · 134 communities (111 shown, 23 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 671 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f5fe2d7`
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
- index-CsEfPK2R.js
- Settings-0ow9AGhu.js
- t
- U
- .start
- us
- tr
- constructor
- e
- Social-DLpOT8JE.js
- go
- z
- _s
- es
- Tv
- nl
- Hr
- o
- Dashboard-B-B1Z20Y.js
- b
- It
- qP
- .constructor
- f
- Ut
- Vt
- Xe
- Zt
- r
- concat
- Dashboard.tsx
- cg
- Rn
- L0
- uw
- cs
- ja
- $r
- betsApi.ts
- pP
- rn
- ue
- betStatus.ts
- c1
- scripts
- lg
- hg
- U
- cx
- .add
- sg
- on
- BetTrackr
- Ot
- oh
- Me
- tj
- pj
- .setTimeout
- Ne
- package.json
- ExampleInstrumentedTest.java
- N1
- Pa
- bO
- is
- yk
- tl
- xA
- se
- ExampleUnitTest.java
- gradlew
- br
- cb
- Ne
- qd
- mf
- Ss
- MainActivity.java
- Gc
- bp
- ad
- d_
- D0
- deref
- Hc
- jh
- capacitor.config.ts
- tsx
- typescript
- vite-plugin-pwa
- @capacitor/cli
- tailwindcss
- @vitejs/plugin-react

## God Nodes (most connected - your core abstractions)
1. `r()` - 110 edges
2. `t()` - 81 edges
3. `e()` - 55 edges
4. `Tv()` - 44 edges
5. `es()` - 43 edges
6. `f()` - 40 edges
7. `d` - 40 edges
8. `Yt()` - 38 edges
9. `nl` - 37 edges
10. `_s()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `rateLimit()` --indirect_call--> `ip()`  [INFERRED]
  middleware/rateLimit.ts → android/app/src/main/assets/public/assets/index-CsEfPK2R.js
- `BetsManager()` --indirect_call--> `bk()`  [INFERRED]
  src/components/BetsManager.tsx → android/app/src/main/assets/public/assets/vendor-charts-okpKzrw_.js
- `Dashboard()` --indirect_call--> `m`  [INFERRED]
  src/components/Dashboard.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `BetsManager()` --indirect_call--> `b`  [INFERRED]
  src/components/BetsManager.tsx → android/app/src/main/assets/public/workbox-0bb07689.js
- `BetsManager()` --indirect_call--> `bet()`  [INFERRED]
  src/components/BetsManager.tsx → extension/test/dashboard-stats.test.ts

## Import Cycles
- None detected.

## Communities (134 total, 23 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.14
Nodes (31): react, react, BetsManager(), BetsManagerProps, SortDirection, SortField, BookieAccountsCardProps, DashboardProps (+23 more)

### Community 1 - "background.js"
Cohesion: 0.06
Nodes (68): betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, ensureBetanoHistoryTab(), fetchBetanoBets(), fetchBetclicBets(), fetchBetclicBetsForImport() (+60 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (27): bcryptjs, @capacitor/android, @capacitor/core, @capgo/capacitor-updater, dotenv, express, @google/genai, jsonwebtoken (+19 more)

### Community 3 - "server.ts"
Cohesion: 0.07
Nodes (29): connect(), getPool(), query(), extractJson(), getGeminiClient(), AuthenticatedRequest, authenticateToken(), getJwtSecret() (+21 more)

### Community 4 - "betsApi.ts"
Cohesion: 0.22
Nodes (24): AIInsights(), Social(), SocialProps, statusMeta(), useAccounts(), ApiAccountRow, createAccount(), deleteAccount() (+16 more)

### Community 5 - "devDependencies"
Cohesion: 0.08
Nodes (25): adm-zip, esbuild, devDependencies, adm-zip, esbuild, @tailwindcss/vite, tsx, @types/express (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+19 more)

### Community 8 - "manifest.json"
Cohesion: 0.06
Nodes (34): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+26 more)

### Community 9 - "authApi.ts"
Cohesion: 0.09
Nodes (27): AIInsights, App(), AppTab, BetsManager, Dashboard, NAV_ITEMS, ScreenshotImporter, Settings (+19 more)

### Community 10 - "popup.js"
Cohesion: 0.09
Nodes (25): accountBox, accountChoices, accountsBox, accountUser, autoImportToggle, BOOKIES, buttons, dotBetano (+17 more)

### Community 11 - "mapper.js"
Cohesion: 0.02
Nodes (17): Du, eO, [ES,IS], ju, ku, l_(), la, ni (+9 more)

### Community 12 - "Implementation Plan"
Cohesion: 0.08
Nodes (23): Appendix — freebet research sources (F3), Build Spec — Slice 1 (Cashout end-to-end + Dashboard fix), C1 — Language options (i18n), Configurations (TODO §5), Cross-cutting risks & notes, D1 — Fix "Distribuição de Resultados" count (confirmed bug), D2 — Dashboard filters (bookie, sport, bet type, …), Dashboard (TODO §4) (+15 more)

### Community 13 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.29
Nodes (6): BetTrackr — Extensão de importação de apostas, Como funciona, Ficheiros, Instalação (modo programador), Limitações conhecidas, Utilização

### Community 14 - "BetclicImport.tsx"
Cohesion: 0.20
Nodes (12): BetclicImport(), BetclicImportProps, EXTENSION_BOOKIES, importSummary(), loadAccountChoices(), AllSourcesImportResult, BookmakerImportResult, useBetclicExtension() (+4 more)

### Community 15 - "BetTrackr — Extensão de importação de apostas"
Cohesion: 0.03
Nodes (72): darker(), at, bo, Bt, Ct, Da(), Do(), $e() (+64 more)

### Community 16 - "BetTrackr"
Cohesion: 0.11
Nodes (23): BrandMark(), AccountPanel(), AccountPanelProps, AIInsightsProps, InsightsResponse, Pick, AuthPageProps, Mode (+15 more)

### Community 18 - "rememberHeaders"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "zip-extension.mjs"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

### Community 22 - "index-CsEfPK2R.js"
Cohesion: 0.04
Nodes (77): $0(), A0, Av(), b0(), bg(), Bs(), Bv(), cp (+69 more)

### Community 29 - "Settings-0ow9AGhu.js"
Cohesion: 0.06
Nodes (40): e, r, p0, $s(), sm, y1, yp, z1() (+32 more)

### Community 30 - "t"
Cohesion: 0.07
Nodes (38): ag(), Ao(), Bb(), bC(), cj(), cl(), d1(), deleteProperty() (+30 more)

### Community 31 - "U"
Cohesion: 0.06
Nodes (13): oa, sr(), C, f(), g(), i, L, N() (+5 more)

### Community 32 - ".start"
Cohesion: 0.06
Nodes (24): ai(), am(), dg(), Hn(), La(), Ls(), ng(), R0() (+16 more)

### Community 33 - "us"
Cohesion: 0.07
Nodes (13): Go(), ao(), go, ho(), Io(), lo(), Mn(), no() (+5 more)

### Community 34 - "tr"
Cohesion: 0.29
Nodes (8): Bl(), gl(), pm(), Qi(), tr(), vm(), wm(), yl()

### Community 35 - "constructor"
Cohesion: 0.10
Nodes (31): al(), applyPatches(), at(), Bx(), constructor(), createDraft(), ds(), Ea() (+23 more)

### Community 36 - "e"
Cohesion: 0.07
Nodes (26): c1(), Dm(), e(), ff(), g_(), g1(), h1(), j1() (+18 more)

### Community 37 - "Social-DLpOT8JE.js"
Cohesion: 0.13
Nodes (35): _1(), ao(), ap(), ep(), f1, hi(), i1, lo() (+27 more)

### Community 38 - "go"
Cohesion: 0.12
Nodes (10): I0(), Zv(), aa(), Ba, ca(), fa(), gl, ka (+2 more)

### Community 39 - "z"
Cohesion: 0.40
Nodes (5): dr(), KN(), nC(), rC(), tC()

### Community 40 - "_s"
Cohesion: 0.07
Nodes (40): Aa(), ae(), bd(), bE(), bn(), cd(), cE(), dd() (+32 more)

### Community 41 - "es"
Cohesion: 0.11
Nodes (42): Yt(), at(), Ge, O(), Ve(), n, bp(), de() (+34 more)

### Community 42 - "Tv"
Cohesion: 0.10
Nodes (19): Mv(), Tv(), bu(), Dc(), Dl(), If(), O0(), Xf() (+11 more)

### Community 43 - "nl"
Cohesion: 0.10
Nodes (19): $a(), cr, De(), fe(), ga(), ia, In(), It() (+11 more)

### Community 44 - "Hr"
Cohesion: 0.10
Nodes (6): Hr, ke, ss(), wo, yo(), zo()

### Community 45 - "o"
Cohesion: 0.11
Nodes (28): b1, c1, dm(), dp(), e1, ei(), eo(), fm() (+20 more)

### Community 46 - "Dashboard-B-B1Z20Y.js"
Cohesion: 0.06
Nodes (45): Bt, Dt, Et, It, Mt, Ot, Pt, $t (+37 more)

### Community 47 - "b"
Cohesion: 0.17
Nodes (23): bg(), c_(), Dn(), Ec(), i_(), jC(), jP(), kg() (+15 more)

### Community 48 - "It"
Cohesion: 0.15
Nodes (17): Fl(), hh(), It(), Jo(), Kb(), Mh(), nb(), ns() (+9 more)

### Community 49 - "qP"
Cohesion: 0.13
Nodes (4): Vs(), Io(), ka(), qP()

### Community 50 - ".constructor"
Cohesion: 0.10
Nodes (15): brighter(), br(), bs(), eo(), fs(), ha(), Ji(), li() (+7 more)

### Community 51 - "f"
Cohesion: 0.14
Nodes (22): f(), CA(), ek(), ex(), _h(), j$(), Jb(), lx() (+14 more)

### Community 52 - "Ut"
Cohesion: 0.18
Nodes (3): Ut, vs(), xr()

### Community 54 - "Xe"
Cohesion: 0.14
Nodes (18): _0(), a_(), Ac(), aN(), Cv(), en(), iN(), Jj() (+10 more)

### Community 55 - "Zt"
Cohesion: 0.17
Nodes (13): kv(), ci(), eu(), ev(), Jy(), Lv(), Mt(), nd() (+5 more)

### Community 56 - "r"
Cohesion: 0.06
Nodes (44): $1(), A0, b1(), bA(), Bs(), dA(), eh(), Er() (+36 more)

### Community 57 - "concat"
Cohesion: 0.14
Nodes (18): am(), cN, ej(), fj(), Gg(), Hr(), kl(), mR() (+10 more)

### Community 58 - "Dashboard.tsx"
Cohesion: 0.21
Nodes (12): calendarDaysFor(), Dashboard(), formatDateKey(), fromLocalDateKey(), RangeEndpoint, Timeframe, TIMEFRAME_OPTIONS, toLocalDateKey() (+4 more)

### Community 60 - "Rn"
Cohesion: 0.15
Nodes (14): a1, Bf(), displayable(), e1(), m1, r1(), rgb(), Rn() (+6 more)

### Community 61 - "L0"
Cohesion: 0.33
Nodes (6): clamp(), formatHsl(), gr(), Hf(), k1(), Kf()

### Community 62 - "uw"
Cohesion: 0.15
Nodes (15): dw(), fw(), Gw(), hw(), jw(), lw(), Mw(), nt() (+7 more)

### Community 66 - "betsApi.ts"
Cohesion: 0.33
Nodes (13): useBets(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets(), mapBetFromApi() (+5 more)

### Community 67 - "pP"
Cohesion: 0.09
Nodes (29): Ar(), cP(), dP(), fP(), gP(), hP(), Ip(), Jd() (+21 more)

### Community 68 - "rn"
Cohesion: 0.20
Nodes (6): qv(), ds, ea(), na(), rn(), yl

### Community 69 - "ue"
Cohesion: 0.20
Nodes (10): g1, l1, Au(), bm(), hm(), kE(), KM(), nu() (+2 more)

### Community 70 - "betStatus.ts"
Cohesion: 0.30
Nodes (10): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+2 more)

### Community 71 - "c1"
Cohesion: 0.24
Nodes (10): aP(), Co(), concat(), d_(), lP(), Od(), oP(), prepend() (+2 more)

### Community 72 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, android:open, android:sync, build, clean, dev, lint, preview (+3 more)

### Community 73 - "lg"
Cohesion: 0.19
Nodes (8): C0(), eg(), lg(), lm(), tg(), Lt, ul(), Uo()

### Community 74 - "hg"
Cohesion: 0.11
Nodes (12): hg(), Hs(), li(), M0(), mg(), _n(), nm, T0 (+4 more)

### Community 75 - "U"
Cohesion: 0.40
Nodes (5): dj(), hj(), sj(), vj(), vv()

### Community 76 - "cx"
Cohesion: 0.22
Nodes (9): as(), cx(), Ix(), os(), Ox(), ux(), ws(), _x() (+1 more)

### Community 77 - ".add"
Cohesion: 0.24
Nodes (3): fo(), ws(), Xt()

### Community 79 - "on"
Cohesion: 0.32
Nodes (8): ed(), gm(), Jf(), ri(), Su(), _u(), Ua(), ym()

### Community 80 - "BetTrackr"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 81 - "Ot"
Cohesion: 0.25
Nodes (9): Cr(), Ee(), gt(), _m(), mg(), pr(), Xe(), Xr (+1 more)

### Community 83 - "Me"
Cohesion: 0.06
Nodes (42): mi, cf(), copy(), D0(), db(), Di(), dk(), dO() (+34 more)

### Community 84 - "tj"
Cohesion: 0.33
Nodes (6): aj(), dv(), ij(), nj(), rj(), tj()

### Community 85 - "pj"
Cohesion: 0.33
Nodes (6): bj(), gj(), hv(), mj(), pj(), yj()

### Community 86 - ".setTimeout"
Cohesion: 0.50
Nodes (4): cancel(), iA(), nA(), rA()

### Community 87 - "Ne"
Cohesion: 0.32
Nodes (8): Iu(), jm(), Lu(), Rm(), rr(), Ru(), Tm(), Ye()

### Community 88 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 89 - "ExampleInstrumentedTest.java"
Cohesion: 0.60
Nodes (3): ExampleInstrumentedTest, Test, RunWith

### Community 90 - "N1"
Cohesion: 0.33
Nodes (6): qg, kv(), Vn(), Xg(), yg(), zw()

### Community 91 - "Pa"
Cohesion: 0.33
Nodes (6): jv(), lR(), mv(), om(), Or(), uo()

### Community 92 - "bO"
Cohesion: 0.40
Nodes (5): bO(), mO(), Of(), pO(), yO()

### Community 93 - "is"
Cohesion: 0.29
Nodes (3): fg, av(), iv()

### Community 94 - "yk"
Cohesion: 0.50
Nodes (4): bk(), gk(), mk(), yk()

### Community 96 - "xA"
Cohesion: 0.50
Nodes (4): eP(), wA(), xA(), ZA()

### Community 97 - "se"
Cohesion: 0.12
Nodes (16): Ev(), xv(), jE(), Ai(), bi(), ci(), D(), di (+8 more)

### Community 99 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 100 - "br"
Cohesion: 0.67
Nodes (3): br(), eb(), tb()

### Community 101 - "cb"
Cohesion: 0.67
Nodes (3): cb(), sb(), ub()

### Community 103 - "qd"
Cohesion: 0.67
Nodes (3): Fk(), Kk(), qd()

### Community 104 - "mf"
Cohesion: 0.67
Nodes (3): mf(), pf(), wO()

### Community 105 - "Ss"
Cohesion: 0.18
Nodes (11): ak(), ck(), ik(), _k(), Ld(), lk(), MC(), ok() (+3 more)

### Community 107 - "Gc"
Cohesion: 0.18
Nodes (12): An(), Dn(), Dt(), es(), gr(), He(), Me(), mr() (+4 more)

### Community 109 - "ad"
Cohesion: 0.40
Nodes (5): ad(), dg(), gd(), Sr(), Wk()

### Community 112 - "D0"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 119 - "tsx"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 123 - "vite-plugin-pwa"
Cohesion: 0.50
Nodes (4): ah(), ge(), J0(), th()

## Knowledge Gaps
- **318 isolated node(s):** `It`, `Et`, `Dt`, `Mt`, `Tt` (+313 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BetsManager()` connect `App.tsx` to `background.js`, `betStatus.ts`, `b`, `Dashboard.tsx`, `yk`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `bk()` connect `yk` to `App.tsx`, `mapper.js`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `safeNum()` connect `Dashboard.tsx` to `App.tsx`, `authApi.ts`, `betsApi.ts`, `betsApi.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `r()` (e.g. with `Tv()` and `vendor-charts-okpKzrw_.js`) actually correct?**
  _`r()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **Are the 50 inferred relationships involving `t()` (e.g. with `at()` and `Tv()`) actually correct?**
  _`t()` has 50 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `e()` (e.g. with `R()` and `Tv()`) actually correct?**
  _`e()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `Tv()` (e.g. with `Dc()` and `e()`) actually correct?**
  _`Tv()` has 19 INFERRED edges - model-reasoned connections that need verification._
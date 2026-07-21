# Graph Report - gestão-de-apostas  (2026-07-18)

## Corpus Check
- 111 files · ~184,973 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2115 nodes · 5089 edges · 140 communities (117 shown, 23 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 671 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb862fe5`
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
- yd
- qd
- mf
- Ss
- MainActivity.java
- Gc
- bp
- zs
- CC
- d_
- D0
- deref
- Hc
- jh
- k0
- Or
- capacitor.config.ts
- tsx
- @types/node
- @types/react
- typescript
- vite-plugin-pwa
- yv
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

## Communities (140 total, 23 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.13
Nodes (33): react, react, BetsManager(), BetsManagerProps, SortDirection, SortField, BookieAccountsCardProps, DashboardProps (+25 more)

### Community 1 - "background.js"
Cohesion: 0.06
Nodes (67): betanoRequestId(), betanoTokenWaiters, betPayload(), BETTRACKR_APP_URLS, ensureBetanoHistoryTab(), fetchBetanoBets(), fetchBetclicBets(), fetchBetclicBetsForImport() (+59 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (27): bcryptjs, @capacitor/android, @capacitor/core, @capgo/capacitor-updater, dotenv, express, @google/genai, jsonwebtoken (+19 more)

### Community 3 - "server.ts"
Cohesion: 0.08
Nodes (23): connect(), getPool(), query(), AuthenticatedRequest, authenticateToken(), getJwtSecret(), Bucket, rateLimit() (+15 more)

### Community 4 - "betsApi.ts"
Cohesion: 0.23
Nodes (23): Social(), SocialProps, statusMeta(), useAccounts(), ApiAccountRow, createAccount(), deleteAccount(), fetchAccounts() (+15 more)

### Community 5 - "devDependencies"
Cohesion: 0.08
Nodes (25): adm-zip, esbuild, devDependencies, adm-zip, esbuild, @tailwindcss/vite, tsx, @types/express (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (27): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+19 more)

### Community 8 - "manifest.json"
Cohesion: 0.08
Nodes (24): action, default_popup, default_title, background, service_worker, type, content_scripts, description (+16 more)

### Community 9 - "authApi.ts"
Cohesion: 0.10
Nodes (24): App(), AppTab, BetsManager, Dashboard, ScreenshotImporter, Settings, Social, TAB_PATHS (+16 more)

### Community 10 - "popup.js"
Cohesion: 0.09
Nodes (25): accountBox, accountChoices, accountsBox, accountUser, autoImportToggle, BOOKIES, buttons, dotBetano (+17 more)

### Community 11 - "mapper.js"
Cohesion: 0.02
Nodes (14): Du, [ES,IS], ju, ku, la, ni, [OS,SS], p1 (+6 more)

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
Nodes (70): darker(), ae(), ar(), at, bo, Bt, Co(), cr (+62 more)

### Community 16 - "BetTrackr"
Cohesion: 0.15
Nodes (19): AccountPanel(), AccountPanelProps, AuthPageProps, Mode, clearToken(), CurrentUser, errorFrom(), fetchCurrentUser() (+11 more)

### Community 18 - "rememberHeaders"
Cohesion: 0.60
Nodes (3): headersToObject(), isBetanoRequest(), rememberHeaders()

### Community 19 - "zip-extension.mjs"
Cohesion: 0.40
Nodes (4): extDir, outDir, outFile, root

### Community 22 - "index-CsEfPK2R.js"
Cohesion: 0.04
Nodes (72): A0, Av(), b0(), bg(), Bs(), Bv(), cp, Cv() (+64 more)

### Community 29 - "Settings-0ow9AGhu.js"
Cohesion: 0.10
Nodes (23): Bt, Dt, Et, It, Mt, Ot, Pt, $t (+15 more)

### Community 30 - "t"
Cohesion: 0.09
Nodes (27): Bb(), bC(), cj(), d1(), df(), el(), _f(), f1() (+19 more)

### Community 31 - "U"
Cohesion: 0.06
Nodes (13): oa, sr(), C, f(), g(), i, L, N() (+5 more)

### Community 32 - ".start"
Cohesion: 0.19
Nodes (13): R(), ai(), Bn(), La(), Ov(), pg(), xg, yg() (+5 more)

### Community 33 - "us"
Cohesion: 0.08
Nodes (15): Lt, ao(), go, ho(), Io(), jo(), lo(), no() (+7 more)

### Community 34 - "tr"
Cohesion: 0.06
Nodes (49): g1, l1, ad(), Au(), Bl(), bm(), clamp(), Cr() (+41 more)

### Community 35 - "constructor"
Cohesion: 0.08
Nodes (42): al(), Ao(), applyPatches(), at(), Bx(), cl(), constructor(), createDraft() (+34 more)

### Community 36 - "e"
Cohesion: 0.06
Nodes (31): c1(), Dm(), e(), ff(), g_(), g1(), h1(), j1() (+23 more)

### Community 37 - "Social-DLpOT8JE.js"
Cohesion: 0.12
Nodes (36): _1(), ao(), ap(), ep(), f1, hi(), i1, lo() (+28 more)

### Community 38 - "go"
Cohesion: 0.12
Nodes (10): I0(), Zv(), aa(), Ba, ca(), fa(), gl, ka (+2 more)

### Community 39 - "z"
Cohesion: 0.10
Nodes (21): am(), dj(), dr(), ej(), fj(), hj(), jv(), KN() (+13 more)

### Community 40 - "_s"
Cohesion: 0.05
Nodes (48): qg, Aa(), bd(), bE(), bn(), cd(), cE(), dd() (+40 more)

### Community 41 - "es"
Cohesion: 0.12
Nodes (32): Yt(), at(), Ge, O(), Ve(), n, bp(), gp() (+24 more)

### Community 42 - "Tv"
Cohesion: 0.13
Nodes (15): Mv(), Tv(), bu(), Dc(), If(), O0(), Xf(), dl (+7 more)

### Community 43 - "nl"
Cohesion: 0.11
Nodes (20): $a(), fe(), ga(), ha(), In(), ki(), la, Mt() (+12 more)

### Community 45 - "o"
Cohesion: 0.17
Nodes (16): E, j, b1, dp(), ei(), Fs(), gm(), h1 (+8 more)

### Community 46 - "Dashboard-B-B1Z20Y.js"
Cohesion: 0.12
Nodes (20): Be, $e, G(), He, Ke, me, qe, Ue (+12 more)

### Community 47 - "b"
Cohesion: 0.23
Nodes (15): ae(), bg(), Dn(), Ec(), Em(), i_(), Ln(), qr (+7 more)

### Community 48 - "It"
Cohesion: 0.11
Nodes (22): cf(), dO(), Fl(), fO(), hb(), hh(), Hl(), It() (+14 more)

### Community 49 - "qP"
Cohesion: 0.13
Nodes (3): Vs(), Io(), qP()

### Community 50 - ".constructor"
Cohesion: 0.09
Nodes (13): am(), dg(), Hn(), li(), Ls(), _n(), ng(), nm (+5 more)

### Community 51 - "f"
Cohesion: 0.13
Nodes (25): f(), c_(), CA(), CC(), ek(), _h(), j$(), jC() (+17 more)

### Community 52 - "Ut"
Cohesion: 0.17
Nodes (4): Ut, vs(), xr(), waitForTabComplete()

### Community 53 - "Vt"
Cohesion: 0.15
Nodes (15): Ce(), Dn(), dr(), fr(), gr(), He(), hs(), lt() (+7 more)

### Community 54 - "Xe"
Cohesion: 0.15
Nodes (17): _0(), a_(), Ac(), aN(), Cv(), en(), iN(), Jj() (+9 more)

### Community 55 - "Zt"
Cohesion: 0.25
Nodes (9): kv(), ci(), ev(), Lv(), rt(), Xv(), zl(), Zt() (+1 more)

### Community 56 - "r"
Cohesion: 0.10
Nodes (21): A0, b1(), Dl(), eh(), Er(), Gh(), Gi(), Il() (+13 more)

### Community 57 - "concat"
Cohesion: 0.18
Nodes (13): cN, concat(), d_(), Hr(), kl(), Ld(), Ng(), Od() (+5 more)

### Community 58 - "Dashboard.tsx"
Cohesion: 0.18
Nodes (12): calendarDaysFor(), Dashboard(), DashboardBetsFilters, formatDateKey(), fromLocalDateKey(), RangeEndpoint, Timeframe, TIMEFRAME_OPTIONS (+4 more)

### Community 59 - "cg"
Cohesion: 0.28
Nodes (7): $0(), Hv(), Lv(), ug(), Y0(), fl(), hl()

### Community 60 - "Rn"
Cohesion: 0.14
Nodes (15): a1, Bf(), displayable(), e1(), k1(), m1, r1(), rgb() (+7 more)

### Community 61 - "L0"
Cohesion: 0.13
Nodes (5): bv(), ho(), L0, R0(), Ti()

### Community 62 - "uw"
Cohesion: 0.15
Nodes (15): dw(), fw(), Gw(), hw(), jw(), lw(), Mw(), nt() (+7 more)

### Community 64 - "ja"
Cohesion: 0.18
Nodes (4): De(), ia, It(), ja

### Community 65 - "$r"
Cohesion: 0.17
Nodes (3): fo(), $r(), zr

### Community 66 - "betsApi.ts"
Cohesion: 0.33
Nodes (13): useBets(), ApiBetRow, createBet(), createBets(), deleteAllBets(), deleteBet(), fetchBets(), mapBetFromApi() (+5 more)

### Community 67 - "pP"
Cohesion: 0.10
Nodes (22): aP(), Co(), cP(), dP(), gP(), hP(), Ip(), jr() (+14 more)

### Community 68 - "rn"
Cohesion: 0.22
Nodes (5): ds, ea(), na(), rn(), yl

### Community 69 - "ue"
Cohesion: 0.14
Nodes (3): br(), Rr(), ue()

### Community 70 - "betStatus.ts"
Cohesion: 0.35
Nodes (9): CASHOUT_TOKENS, compactStatusToken(), hasCashoutSignal(), isCashoutStatusValue(), normalizeBetStatus(), parseBetMetadata(), STATUS_ALIASES, statusToken() (+1 more)

### Community 71 - "c1"
Cohesion: 0.21
Nodes (14): c1, dm(), e1, eo(), fm(), H0(), Is(), j1() (+6 more)

### Community 72 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, android:open, android:sync, build, clean, dev, lint, preview (+3 more)

### Community 73 - "lg"
Cohesion: 0.27
Nodes (5): C0(), eg(), lg(), lm(), tg()

### Community 74 - "hg"
Cohesion: 0.12
Nodes (9): fg, hg(), Hs(), M0(), mg(), um(), av(), iv() (+1 more)

### Community 75 - "U"
Cohesion: 0.07
Nodes (28): Ev(), xv(), jE(), Ai(), bi(), ci(), D(), di (+20 more)

### Community 76 - "cx"
Cohesion: 0.22
Nodes (9): as(), cx(), Ix(), os(), Ox(), ux(), ws(), _x() (+1 more)

### Community 77 - ".add"
Cohesion: 0.16
Nodes (12): $t, om(), Xe(), Be, fs(), li(), Nt(), os() (+4 more)

### Community 78 - "sg"
Cohesion: 0.32
Nodes (3): N0(), O0(), sg

### Community 79 - "on"
Cohesion: 0.31
Nodes (9): gA(), on(), qA(), qC(), um(), w1(), wu(), z1() (+1 more)

### Community 80 - "BetTrackr"
Cohesion: 0.25
Nodes (7): API, App Android (Capacitor), Arquitetura, BetTrackr, Configuração, Scripts, Stack

### Community 81 - "Ot"
Cohesion: 0.67
Nodes (4): Ar(), Jd(), Ot(), Xt()

### Community 83 - "Me"
Cohesion: 0.07
Nodes (34): mi, $b(), copy(), D0(), db(), Di(), dk(), fb() (+26 more)

### Community 84 - "tj"
Cohesion: 0.33
Nodes (6): aj(), dv(), ij(), nj(), rj(), tj()

### Community 85 - "pj"
Cohesion: 0.33
Nodes (6): bj(), gj(), hv(), mj(), pj(), yj()

### Community 86 - ".setTimeout"
Cohesion: 0.50
Nodes (4): cancel(), iA(), nA(), rA()

### Community 88 - "package.json"
Cohesion: 0.33
Nodes (5): description, name, private, type, version

### Community 89 - "ExampleInstrumentedTest.java"
Cohesion: 0.60
Nodes (3): ExampleInstrumentedTest, Test, RunWith

### Community 90 - "N1"
Cohesion: 0.40
Nodes (5): $1(), fm(), N1(), wv(), xu()

### Community 91 - "Pa"
Cohesion: 0.50
Nodes (4): bA(), mA(), Pa(), yA()

### Community 92 - "bO"
Cohesion: 0.40
Nodes (5): bO(), mO(), Of(), pO(), yO()

### Community 93 - "is"
Cohesion: 0.29
Nodes (7): dA(), Es(), ex(), hA(), is(), Jb(), vA()

### Community 94 - "yk"
Cohesion: 0.50
Nodes (4): bk(), gk(), mk(), yk()

### Community 95 - "tl"
Cohesion: 0.11
Nodes (21): z1(), At, Bt, Ct, Ee, Et, Ft, Gt() (+13 more)

### Community 96 - "xA"
Cohesion: 0.50
Nodes (4): eP(), wA(), xA(), ZA()

### Community 97 - "se"
Cohesion: 0.16
Nodes (10): brighter(), Ge(), Ji(), ni(), $s(), Vo(), wo, yo() (+2 more)

### Community 99 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 100 - "br"
Cohesion: 0.50
Nodes (4): br(), eb(), rb(), tb()

### Community 101 - "cb"
Cohesion: 0.67
Nodes (3): cb(), sb(), ub()

### Community 102 - "yd"
Cohesion: 0.16
Nodes (12): e, r, sm, yp, Be, J(), Ue, c (+4 more)

### Community 103 - "qd"
Cohesion: 0.67
Nodes (3): Fk(), Kk(), qd()

### Community 104 - "mf"
Cohesion: 0.67
Nodes (3): mf(), pf(), wO()

### Community 105 - "Ss"
Cohesion: 0.20
Nodes (10): ak(), ck(), ik(), _k(), lk(), MC(), ok(), oL() (+2 more)

### Community 107 - "Gc"
Cohesion: 0.25
Nodes (4): An(), Dt(), es(), tn

### Community 110 - "CC"
Cohesion: 0.29
Nodes (8): ag(), eI(), hi(), pt(), qe(), te(), Ur(), xd()

### Community 111 - "d_"
Cohesion: 0.29
Nodes (7): Gg(), jP(), rd(), Sn(), tP(), Us(), w()

### Community 112 - "D0"
Cohesion: 0.29
Nodes (6): builds, test, git, deploymentEnabled, routes, version

### Community 119 - "tsx"
Cohesion: 0.33
Nodes (5): distDir, EXCLUDE, root, versionFile, zipFile

### Community 121 - "@types/react"
Cohesion: 0.67
Nodes (3): Jk(), Qk(), Zk()

## Knowledge Gaps
- **305 isolated node(s):** `It`, `Et`, `Dt`, `Mt`, `Tt` (+300 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BetsManager()` connect `App.tsx` to `background.js`, `betStatus.ts`, `yk`, `b`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `bk()` connect `yk` to `App.tsx`, `mapper.js`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `bet()` connect `background.js` to `App.tsx`, `betsApi.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `r()` (e.g. with `Tv()` and `vendor-charts-okpKzrw_.js`) actually correct?**
  _`r()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **Are the 50 inferred relationships involving `t()` (e.g. with `at()` and `Tv()`) actually correct?**
  _`t()` has 50 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `e()` (e.g. with `R()` and `Tv()`) actually correct?**
  _`e()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `Tv()` (e.g. with `Dc()` and `e()`) actually correct?**
  _`Tv()` has 19 INFERRED edges - model-reasoned connections that need verification._
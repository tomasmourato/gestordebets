---
type: "query"
date: "2026-07-13T22:34:11.924434+00:00"
question: "Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior"
contributor: "graphify"
outcome: "useful"
source_nodes: ["BetsManager.tsx", "normalizeBetStatus()", "calculateBetReturnAndProfit()", "calculateDashboardStats()", "Dashboard()"]
---

# Q: Analyze last commit from remote mourato and merge while preserving cashout filtering and status behavior

## Answer

Mourato main at 5bb3080 is already an ancestor of extension_redo, so the requested merge is already up to date. Graphify traced CASHOUT through BetsManager, normalization, import mapping, return calculation, migrations, and Dashboard. The cashout filter remains present. The audit found calculateDashboardStats omitted CASHOUT from its dedicated settled-status counters; it now tracks cashoutBets and excludes cashouts from win/loss rate classification, with regression tests.

## Outcome

- Signal: useful

## Source Nodes

- BetsManager.tsx
- normalizeBetStatus()
- calculateBetReturnAndProfit()
- calculateDashboardStats()
- Dashboard()
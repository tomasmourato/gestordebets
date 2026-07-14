**Manual Import**
- [x] Create multiple freebets types (SNR/SR) — `src/lib/bookmakers.ts` + `freebetType` na aposta
- [x] Link each freebet type to its correspondent bookie (defaults por casa, corrigível por aposta)
- [x] Add cashout option with return editable (estado `CASHOUT` + campo "Valor do Cashout")

**Gemini Import Feature**
- [x] Let AI read multiple bets in one screenshot (fila de revisão boletim a boletim)

**Bet Import Extension**
- [x] Add multiple betting bookies to the extension (Betclic + Betano)
- [x] Add cashed out bets to import (FullCashout/PartialCashout → `CASHOUT` com retorno real)
- [ ] Auto-import when the user logs into a bookie (needs extension login so the
      BetTrackr site doesn't have to be open — see PLAN.md §E3; opt-in, off by default)

**Dashboard**
- [x] Add filters (bookie, sport, bet type, money type, timeframe) — stats/charts recalculam
- [x] Solve error on "Distribuição de Resultados" (pendentes já não entram na contagem)

**Configurations**
- [~] Add different language options — infraestrutura i18n + shell traduzidos
      (`src/lib/i18n.tsx`); falta extrair as strings dos separadores (PLAN.md §C1)

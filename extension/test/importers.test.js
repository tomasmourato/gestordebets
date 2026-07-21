import { describe, expect, test } from "bun:test";
import fixture from "./fixtures/betano-sample.json" with { type: "json" };
import { mapBetanoBets, parseBetanoMoney } from "../src/mapper-betano.js";
import { mapBetclicBet } from "../src/mapper.js";
import { fetchBetanoHistory, createSixMonthWindows } from "../src/betano-history.js";
import { fetchBetclicHistory } from "../src/betclic-history.js";
import { mapSolverdeBets, mapSolverdeBet, solverdeRef } from "../src/mapper-solverde.js";
import { fetchSolverdeHistory } from "../src/solverde-history.js";
import { importedBetChanged, reconcileImportedBets } from "../src/import-utils.js";

describe("Betclic mapper", () => {
  test("maps only explicit selection outcomes", () => {
    const mapped = mapBetclicBet({
      bet_reference: "selection-results",
      bet_type: "multiple",
      result: "Lose",
      stake: 10,
      odds: 3,
      bet_selections: [
        { selection_label: "Casa", result: "Win" },
        { selection_label: "Mais de 2.5", result: "Lose" },
        { selection_label: "Ambas marcam" },
      ],
    });

    expect(mapped.selections.map((selection) => selection.result)).toEqual([
      "GANHA",
      "PERDIDA",
      undefined,
    ]);
  });

  test("maps FullCashout using the actual cashout return", () => {
    const mapped = mapBetclicBet({
      id: -1,
      bet_reference: "69f4b112796874f7ae83a2c4",
      bet_type: "simple",
      placed_date_utc: "2026-05-01T13:56:34.116Z",
      result: "FullCashout",
      odds: 1.41,
      stake: 5.93,
      is_freebet: false,
      bet_selections: [{
        odds: 1.41,
        selection_label: "Manchester City",
        market_label: "Resultado (Tempo Regulamentar)",
        match_label: "Everton - Manchester City",
        sport_label: "Football",
      }],
      is_awaiting_payment: false,
      winning_details: [
        { type: "NET_WIN", amount: 5.63, unit: "CASH" },
        { type: "NET_STAKE_WIN", amount: 5.63, unit: "CASH" },
        { type: "TOTAL", amount: 5.63, unit: "CASH" },
      ],
      winnings: 5.63,
    });

    expect(mapped).toMatchObject({
      status: "CASHOUT",
      stake: 5.93,
      odd: 1.41,
      potentialReturn: 8.36,
      finalReturn: 5.63,
      netProfit: -0.3,
      metadata: {
        originalStatus: "FullCashout",
        originalReturn: 5.63,
        isCashout: true,
        cashoutReturn: 5.63,
      },
    });
  });

  test("falls back to winning_details when winnings is missing", () => {
    const mapped = mapBetclicBet({
      bet_reference: "cashout-fallback",
      bet_type: "simple",
      result: "full_cashout",
      odds: 2,
      stake: 10,
      is_freebet: false,
      winning_details: [{ type: "TOTAL", amount: "8,50", unit: "CASH" }],
    });

    expect(mapped).toMatchObject({
      status: "CASHOUT",
      finalReturn: 8.5,
      netProfit: -1.5,
    });
  });

  test("keeps a profitable cashout in the dedicated status", () => {
    const mapped = mapBetclicBet({
      bet_reference: "profitable-cashout",
      bet_type: "simple",
      result: "FullCashout",
      odds: 2,
      stake: 10,
      is_freebet: false,
      winnings: 12.5,
    });

    expect(mapped).toMatchObject({
      status: "CASHOUT",
      finalReturn: 12.5,
      netProfit: 2.5,
    });
  });
});

describe("Betclic pagination", () => {
  test("advances by the returned count when Betclic caps pages below the requested limit", async () => {
    const allBets = Array.from({ length: 25 }, (_, id) => ({ id }));
    const offsets = [];
    const result = await fetchBetclicHistory(async ({ offset, limit }) => {
      offsets.push(offset);
      // Simula a API Betclic a limitar cada resposta a 10, apesar de limit=20.
      return { bets: allBets.slice(offset, offset + Math.min(limit, 10)), total: allBets.length };
    }, { pageSize: 20 });

    expect(offsets).toEqual([0, 10, 20, 25]);
    expect(result.map((bet) => bet.id)).toEqual(allBets.map((bet) => bet.id));
  });

  test("continues past a stale total to collect an uncounted cashout", async () => {
    const regularBets = Array.from({ length: 38 }, (_, id) => ({ id, result: id % 2 ? "Win" : "Lose" }));
    const cashout = { id: 38, result: "FullCashout" };
    const offsets = [];

    const result = await fetchBetclicHistory(async ({ offset }) => {
      offsets.push(offset);
      if (offset < 38) return { bets: regularBets.slice(offset, offset + 10), total: 38 };
      if (offset === 38) return { bets: [cashout], total: 38 };
      return { bets: [], total: 38 };
    }, { pageSize: 20 });

    expect(offsets).toEqual([0, 10, 20, 30, 38, 39]);
    expect(result).toHaveLength(39);
    expect(result.at(-1)).toEqual(cashout);
  });
});

describe("Betano mapper", () => {
  test("maps selection outcomes without falling back to the overall bet result", () => {
    const mapped = mapBetanoBets([{
      BetId: "selection-results",
      Type: "Triple",
      Settled: true,
      Status: 3,
      Stake: "10,00 €",
      DecimalOdds: 3,
      Legs: [{ LegItems: [{ Selections: [
        { Title: "Casa", Status: 2 },
        { Title: "Mais de 2.5", Result: "Lost" },
        { Title: "Ambas marcam" },
      ] }] }],
    }]).bets[0];

    expect(mapped.selections.map((selection) => selection.result)).toEqual([
      "GANHA",
      "PERDIDA",
      undefined,
    ]);
  });

  test("parses Portuguese money formats", () => {
    expect(parseBetanoMoney("5,00 €")).toBe(5);
    expect(parseBetanoMoney("1.234,56 €")).toBe(1234.56);
    expect(parseBetanoMoney("10.20")).toBe(10.2);
  });

  test("maps normal, RiskFree, FullBet, and pending bets", () => {
    const { bets, unsupported } = mapBetanoBets(fixture.Bets);
    expect(unsupported).toBe(0);
    expect(bets).toHaveLength(4);

    // Aposta sem risco perdida: a stake é dinheiro real, por isso a derrota
    // perde a stake como uma aposta normal -> net -5 (a freebet devolvida é
    // registada à parte).
    expect(bets[0]).toMatchObject({
      status: "PERDIDA", isFreebet: false, isRiskFree: true, finalReturn: 0, netProfit: -5,
    });
    // Aposta sem risco ganha: paga como uma aposta normal.
    expect(bets[1]).toMatchObject({
      status: "GANHA", isFreebet: false, isRiskFree: true, finalReturn: 10.2, netProfit: 5.2,
    });
    expect(bets[2]).toMatchObject({ status: "PERDIDA", isFreebet: true, isRiskFree: false, netProfit: 0, type: "MULTIPLA" });
    expect(bets[2].selections).toHaveLength(2);
    expect(bets[3]).toMatchObject({ status: "POR_LIQUIDAR", finalReturn: 0, netProfit: 0 });

    const fullBetWin = mapBetanoBets([{
      BetId: "winner", Type: "Single", Settled: true, Status: 2,
      Stake: "10,00 €", Return: "59,00 €", PossibleWinnings: "59,00 €",
      DecimalOdds: 5.9, BonusTokens: [{ Type: "FullBet", Amount: "10,00 €" }],
    }]).bets[0];
    expect(fullBetWin).toMatchObject({ isFreebet: true, isRiskFree: false, finalReturn: 59, netProfit: 59 });
  });

  test("detects risk-free bets from BonusType when tokens are absent", () => {
    const [riskFreeLoss] = mapBetanoBets([{
      BetId: "rf-bonustype", Type: "Single", Settled: true, Status: 3,
      Stake: "20,00 €", Return: "0,00 €", DecimalOdds: 2, BonusType: 3, BonusTokens: [],
    }]).bets;
    expect(riskFreeLoss).toMatchObject({ isRiskFree: true, isFreebet: false, netProfit: -20, finalReturn: 0 });

    const [riskFreeWin] = mapBetanoBets([{
      BetId: "rf-win", Type: "Single", Settled: true, Status: 2,
      Stake: "20,00 €", Return: "50,00 €", DecimalOdds: 2.5,
      BonusTokens: [{ Type: "RiskFree", Amount: "20,00 €" }],
    }]).bets;
    expect(riskFreeWin).toMatchObject({ isRiskFree: true, isFreebet: false, finalReturn: 50, netProfit: 30 });
  });

  test("keeps an explicitly labelled Betano cashout in the dedicated status", () => {
    const mapped = mapBetanoBets([{
      BetId: "cashout", Type: "Single", Settled: true, Status: "FullCashout",
      Stake: "10,00 €", Return: "7,25 €", PossibleWinnings: "20,00 €",
      DecimalOdds: 2, BonusTokens: [],
    }]).bets[0];

    expect(mapped).toMatchObject({
      status: "CASHOUT",
      finalReturn: 7.25,
      netProfit: -2.75,
      metadata: { isCashout: true, cashoutReturn: 7.25 },
    });
  });
});

describe("Betano pagination", () => {
  test("follows LastId and creates six-month windows", async () => {
    const calls = [];
    const requestPage = async (url) => {
      calls.push(url);
      const parsed = new URL(url);
      const settled = parsed.searchParams.get("settled");
      const page = parsed.searchParams.get("page");
      if (settled === "false") return { Result: { Bets: [], LastId: null } };
      if (page === "1") return { Result: { Bets: [{ BetId: "a" }], LastId: "next" } };
      return { Result: { Bets: [{ BetId: "b" }] } };
    };
    const result = await fetchBetanoHistory(requestPage, {
      now: "2026-07-01T00:00:00Z",
      earliest: "2026-01-01T00:00:00Z",
    });
    expect(result.settled).toHaveLength(2);
    expect(calls.some((url) => url.includes("lastId=next"))).toBe(true);
    expect(createSixMonthWindows(new Date("2026-07-01"), new Date("2026-01-01"))).toHaveLength(1);
  });
});

describe("Solverde mapper", () => {
  const wonSingle = {
    id: 1001,
    betType: "SGL",
    settled: true,
    status: "WON",
    odds: 2.5,
    placementTime: "2026-07-12T18:30:00Z",
    funds: { stake: 10, cashStake: 10, freebetStake: 0, payout: 25, payoutNet: 23, payoutTax: 2 },
    legs: [{
      odds: 2.5,
      legInfo: { eventName: "Benfica - Porto", sportId: "FOOT" },
      parts: [{ marketName: "Resultado Final", selectionName: "Benfica" }],
    }],
    channel: { name: "web" },
  };

  test("maps a settled winning single using the house net payout", () => {
    const bet = mapSolverdeBet(wonSingle);
    expect(bet).toMatchObject({
      type: "SIMPLES",
      status: "GANHA",
      stake: 10,
      odd: 2.5,
      isFreebet: false,
      potentialReturn: 25,
      finalReturn: 23,
      netProfit: 13, // payoutNet(23) - cashStake(10)
      bookmaker: "Solverde",
    });
    expect(bet.dateTime).toMatch(/^2026-07-12 /);
    expect(bet.selections).toEqual([
      expect.objectContaining({ event: "Benfica - Porto", market: "Resultado Final", choice: "Benfica", odd: 2.5, sport: "FOOT" }),
    ]);
    expect(bet.metadata).toMatchObject({ source: "solverde", ref: "1001", importKey: "solverde:1001" });
  });

  test("a lost bet loses only the cash stake", () => {
    const bet = mapSolverdeBet({ ...wonSingle, id: 2, status: "LOST", funds: { stake: 5, cashStake: 5, payout: 0, payoutNet: 0 } });
    expect(bet).toMatchObject({ status: "PERDIDA", finalReturn: 0, netProfit: -5 });
  });

  test("a freebet stakes no real cash, so the whole net payout is profit", () => {
    const bet = mapSolverdeBet({
      ...wonSingle, id: 3, status: "WON",
      funds: { stake: 10, cashStake: 0, freebetStake: 10, payout: 20, payoutNet: 18 },
    });
    expect(bet).toMatchObject({ isFreebet: true, freebetType: "SR", finalReturn: 18, netProfit: 18 });
  });

  test("an unsettled bet is pending regardless of status", () => {
    const bet = mapSolverdeBet({ ...wonSingle, id: 4, settled: false, status: "WON" });
    expect(bet).toMatchObject({ status: "POR_LIQUIDAR", finalReturn: 0, netProfit: 0 });
  });

  test("flattens a multiple across legs and parts", () => {
    const combo = {
      id: 5, betType: "MUL", settled: true, status: "LOST", odds: 3.6,
      placementTime: "2026-07-01T12:00:00Z",
      funds: { stake: 4, cashStake: 4, payout: 0, payoutNet: 0 },
      legs: [
        { odds: 1.8, legInfo: { eventName: "A - B", sportId: "FOOT" }, parts: [{ marketName: "1X2", selectionName: "1" }] },
        { odds: 2.0, legInfo: { eventName: "C - D", sportId: "BASK" }, parts: [{ marketName: "Total", selectionName: "Mais de 2.5" }] },
      ],
    };
    const bet = mapSolverdeBet(combo);
    expect(bet.type).toBe("MULTIPLA");
    expect(bet.selections).toHaveLength(2);
    expect(bet.selections.map((s) => s.choice)).toEqual(["1", "Mais de 2.5"]);
  });

  test("skips unknown settled states as unsupported, keeps the rest", () => {
    const { bets, unsupported } = mapSolverdeBets([
      wonSingle,
      { id: 9, settled: true, status: "SOME_NEW_STATE", funds: { stake: 1 }, odds: 1.5 },
    ]);
    expect(bets).toHaveLength(1);
    expect(unsupported).toBe(1);
    expect(solverdeRef(wonSingle)).toBe("1001");
  });
});

describe("Solverde pagination", () => {
  const now = new Date("2026-07-20T00:00:00.000Z");

  test("pages a window via hasMoreData and dedupes by id", async () => {
    const all = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const seenPages = [];
    const bets = await fetchSolverdeHistory(async ({ page, itemsPerPage }) => {
      seenPages.push(page);
      const slice = all.slice((page - 1) * itemsPerPage, page * itemsPerPage);
      return { bets: slice, pagination: { hasMoreData: page * itemsPerPage < all.length } };
    }, { now, start: new Date("2026-07-10T00:00:00.000Z"), itemsPerPage: 20 });

    expect(seenPages).toEqual([1, 2]); // single 90-day window
    expect(bets.map((b) => b.id).sort((a, b) => a - b)).toEqual(all.map((b) => b.id));
  });

  test("without hasMoreData, stops when a page comes back not full", async () => {
    const seenPages = [];
    const bets = await fetchSolverdeHistory(async ({ page }) => {
      seenPages.push(page);
      if (page === 1) return { bets: [{ id: 1 }, { id: 2 }], pagination: {} };
      return { bets: [{ id: 3 }], pagination: {} };
    }, { now, start: new Date("2026-07-15T00:00:00.000Z"), itemsPerPage: 2 });

    expect(seenPages).toEqual([1, 2]);
    expect(bets.map((b) => b.id)).toEqual([1, 2, 3]);
  });
});

describe("source-aware reconciliation", () => {
  test("does not collide across bookmakers and updates changed bets", () => {
    const existing = [
      { id: "1", type: "SIMPLES", status: "POR_LIQUIDAR", stake: 5, odd: 2, is_freebet: false, potential_return: 10, final_return: 0, net_profit: 0, bookmaker: "Betclic", date_time: "", selections: [], metadata: { source: "betclic", ref: "42" } },
      { id: "2", type: "SIMPLES", status: "PERDIDA", stake: 5, odd: 2, is_freebet: false, potential_return: 10, final_return: 0, net_profit: -5, bookmaker: "Betano", date_time: "", selections: [], metadata: { source: "betano", ref: "42", importKey: "betano:42" } },
    ];
    const incoming = [
      { type: "SIMPLES", status: "GANHA", stake: 5, odd: 2, isFreebet: false, potentialReturn: 10, finalReturn: 10, netProfit: 5, bookmaker: "Betclic", dateTime: "", selections: [], metadata: { source: "betclic", ref: "42", importKey: "betclic:42" } },
      { type: "SIMPLES", status: "PERDIDA", stake: 5, odd: 2, isFreebet: false, potentialReturn: 10, finalReturn: 0, netProfit: -5, bookmaker: "Betano", dateTime: "", selections: [], metadata: { source: "betano", ref: "42", importKey: "betano:42" } },
    ];
    const result = reconcileImportedBets(incoming, new Map([["betclic:42", existing[0]], ["betano:42", existing[1]]]));
    expect(result.fresh).toHaveLength(0);
    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].id).toBe("1");
    expect(importedBetChanged(existing[1], incoming[1])).toBe(false);
  });

  test("updates an existing import when a selection result becomes available", () => {
    const existing = {
      id: "selection-update",
      type: "MULTIPLA",
      status: "PERDIDA",
      stake: 10,
      odd: 3,
      is_freebet: false,
      potential_return: 30,
      final_return: 0,
      net_profit: -10,
      bookmaker: "Betclic",
      date_time: "2026-07-15 12:00",
      selections: [{ event: "A - B", market: "Resultado", choice: "A", odd: 2 }],
      metadata: { source: "betclic", ref: "selection-update", importKey: "betclic:selection-update" },
    };
    const incoming = {
      type: "MULTIPLA",
      status: "PERDIDA",
      stake: 10,
      odd: 3,
      isFreebet: false,
      potentialReturn: 30,
      finalReturn: 0,
      netProfit: -10,
      bookmaker: "Betclic",
      dateTime: "2026-07-15 12:00",
      selections: [{ event: "A - B", market: "Resultado", choice: "A", odd: 2, result: "PERDIDA" }],
      metadata: { source: "betclic", ref: "selection-update", importKey: "betclic:selection-update" },
    };

    expect(importedBetChanged(existing, incoming)).toBe(true);
  });
});

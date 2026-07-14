import { describe, expect, test } from "bun:test";
import fixture from "./fixtures/betano-sample.json" with { type: "json" };
import { mapBetanoBets, parseBetanoMoney } from "../src/mapper-betano.js";
import { mapBetclicBet } from "../src/mapper.js";
import { fetchBetanoHistory, createSixMonthWindows } from "../src/betano-history.js";
import { fetchBetclicHistory } from "../src/betclic-history.js";
import { importedBetChanged, reconcileImportedBets } from "../src/import-utils.js";

describe("Betclic mapper", () => {
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
  test("parses Portuguese money formats", () => {
    expect(parseBetanoMoney("5,00 €")).toBe(5);
    expect(parseBetanoMoney("1.234,56 €")).toBe(1234.56);
    expect(parseBetanoMoney("10.20")).toBe(10.2);
  });

  test("maps normal, RiskFree, FullBet, and pending bets", () => {
    const { bets, unsupported } = mapBetanoBets(fixture.Bets);
    expect(unsupported).toBe(0);
    expect(bets).toHaveLength(4);

    expect(bets[0]).toMatchObject({ status: "PERDIDA", isFreebet: false, netProfit: -5 });
    expect(bets[1]).toMatchObject({ status: "GANHA", isFreebet: false, finalReturn: 10.2, netProfit: 5.2 });
    expect(bets[2]).toMatchObject({ status: "PERDIDA", isFreebet: true, netProfit: 0, type: "MULTIPLA" });
    expect(bets[2].selections).toHaveLength(2);
    expect(bets[3]).toMatchObject({ status: "POR_LIQUIDAR", finalReturn: 0, netProfit: 0 });

    const fullBetWin = mapBetanoBets([{
      BetId: "winner", Type: "Single", Settled: true, Status: 2,
      Stake: "10,00 €", Return: "59,00 €", PossibleWinnings: "59,00 €",
      DecimalOdds: 5.9, BonusTokens: [{ Type: "FullBet", Amount: "10,00 €" }],
    }]).bets[0];
    expect(fullBetWin).toMatchObject({ isFreebet: true, finalReturn: 59, netProfit: 59 });
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
});

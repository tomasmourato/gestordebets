import { describe, expect, test } from "bun:test";
import fixture from "./fixtures/betano-sample.json" with { type: "json" };
import { mapBetanoBets, parseBetanoMoney } from "../src/mapper-betano.js";
import { fetchBetanoHistory, createSixMonthWindows } from "../src/betano-history.js";
import { importedBetChanged, reconcileImportedBets } from "../src/import-utils.js";

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

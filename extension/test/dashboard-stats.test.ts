import { describe, expect, test } from "bun:test";
import type { Bet, BetStatus } from "../../src/types";
import { calculateDashboardStats } from "../../src/utils";

function bet(status: BetStatus, finalReturn: number, netProfit: number): Bet {
  return {
    id: `${status}-${finalReturn}`,
    type: "SIMPLES",
    status,
    selections: [],
    stake: 10,
    odd: 2,
    isFreebet: false,
    potentialReturn: 20,
    finalReturn,
    netProfit,
    bookmaker: "Test",
    dateTime: "2026-07-13 12:00",
    origin: "MANUAL",
  };
}

describe("dashboard cashout statistics", () => {
  test("counts cashouts as their own settled status", () => {
    const stats = calculateDashboardStats([
      bet("CASHOUT", 7, -3),
      bet("POR_LIQUIDAR", 0, 0),
    ]);

    expect(stats.totalBets).toBe(2);
    expect(stats.pendingBets).toBe(1);
    expect(stats.cashoutBets).toBe(1);
    expect(stats.halfWonBets).toBe(0);
    expect(stats.halfLostBets).toBe(0);
    expect(stats.totalStake).toBe(10);
    expect(stats.totalReturn).toBe(7);
    expect(stats.netProfit).toBe(-3);
  });

  test("does not classify cashouts as wins or losses in win rate", () => {
    const stats = calculateDashboardStats([
      bet("GANHA", 20, 10),
      bet("CASHOUT", 12, 2),
    ]);

    expect(stats.cashoutBets).toBe(1);
    expect(stats.wonBets).toBe(1);
    expect(stats.lostBets).toBe(0);
    expect(stats.winRate).toBe(100);
  });
});

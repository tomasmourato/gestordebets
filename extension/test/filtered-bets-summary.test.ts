import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import type { Bet, BetStatus } from "../../src/types";
import { calculateFilteredBetsSummary, selectBetsForFinancialSummary } from "../../src/utils";
import FilteredBetsSummary from "../../src/components/FilteredBetsSummary";

function bet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: "bet-1",
    type: "SIMPLES",
    status: "GANHA" as BetStatus,
    selections: [],
    stake: 10,
    odd: 2,
    isFreebet: false,
    potentialReturn: 20,
    finalReturn: 20,
    netProfit: 10,
    bookmaker: "Test",
    dateTime: "2026-07-24 12:00",
    origin: "MANUAL",
    ...overrides,
  };
}

describe("calculateFilteredBetsSummary", () => {
  it("separates settled and pending real-money stakes", () => {
    const summary = calculateFilteredBetsSummary([
      bet({ id: "won", stake: 10, finalReturn: 20, netProfit: 10 }),
      bet({ id: "pending", status: "POR_LIQUIDAR", stake: 5, finalReturn: 0, netProfit: 0 }),
      bet({ id: "freebet", isFreebet: true, stake: 8, finalReturn: 16, netProfit: 16 }),
      bet({ id: "pending-freebet", status: "POR_LIQUIDAR", isFreebet: true, stake: 3, finalReturn: 0, netProfit: 0 }),
      bet({ id: "ignored", isIgnored: true, stake: 50, finalReturn: 100, netProfit: 50 }),
    ]);

    assert.deepEqual(summary, {
      settledStake: 10,
      pendingStake: 5,
      totalReturn: 36,
      netProfit: 26,
      betCount: 4,
      freebetStake: 11,
    });
  });

  it("returns zeroes for an empty visible set", () => {
    assert.deepEqual(calculateFilteredBetsSummary([]), {
      settledStake: 0,
      pendingStake: 0,
      totalReturn: 0,
      netProfit: 0,
      betCount: 0,
      freebetStake: 0,
    });
  });

  it("marks the Freebet-only total with a compact asterisk helper", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet({ isFreebet: true, stake: 12.5, finalReturn: 25, netProfit: 25 })],
        currency: "€",
        freebetOnly: true,
      }),
    );

    assert.match(markup, /\*.*12,50€/);
    assert.match(markup, /role="tooltip"/);
    assert.match(markup, /Valor utilizado em freebets/);
    assert.match(markup, /aria-expanded="false"/);
    assert.match(markup, /text-violet/);
  });

  it("keeps cash, freebet, and pending stake information on one metric line", () => {
    const markup = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [
          bet({ id: "cash", stake: 10 }),
          bet({ id: "freebet", isFreebet: true, stake: 8 }),
          bet({ id: "pending", status: "POR_LIQUIDAR", stake: 5 }),
        ],
        currency: "€",
        freebetOnly: false,
      }),
    );

    assert.match(markup, /10,00€.*\*.*8,00€.*5,00€ por liquidar/);
  });

  it("reserves a stable desktop footer slot and compacts metrics only when actions are present", () => {
    const withFooter = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet()],
        currency: "€",
        freebetOnly: false,
        reserveFooterSpace: true,
        footer: React.createElement("div", null, "2 apostas selecionadas"),
      }),
    );
    const withoutFooter = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet()],
        currency: "€",
        freebetOnly: false,
        reserveFooterSpace: true,
      }),
    );
    const mobileLayout = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet()],
        currency: "€",
        freebetOnly: false,
      }),
    );

    assert.match(withFooter, /data-summary-footer-slot/);
    assert.match(withoutFooter, /data-summary-footer-slot/);
    assert.match(withFooter, /md:h-20/);
    assert.match(withoutFooter, /md:h-20/);
    assert.match(withFooter, /md:h-14/);
    assert.match(withoutFooter, /md:h-14/);
    assert.match(withFooter, /data-summary-compact="true"/);
    assert.match(withFooter, /data-summary-metric-size="compact"/);
    assert.match(withFooter, /2 apostas selecionadas/);
    assert.match(withFooter, /data-motion-value=/);
    assert.match(withoutFooter, /data-summary-compact="false"/);
    assert.match(withoutFooter, /data-summary-metric-size="normal"/);
    assert.doesNotMatch(withoutFooter, /2 apostas selecionadas/);
    assert.doesNotMatch(mobileLayout, /data-summary-footer-slot/);
    assert.doesNotMatch(mobileLayout, /md:h-20/);
  });
});

describe("selectBetsForFinancialSummary", () => {
  it("uses only selected bets that remain visible while selection mode is active", () => {
    const visibleBets = [bet({ id: "cash", stake: 10 }), bet({ id: "freebet", isFreebet: true, stake: 8 })];

    assert.deepEqual(
      selectBetsForFinancialSummary(visibleBets, new Set(["freebet", "hidden"]), true),
      [visibleBets[1]],
    );
  });

  it("keeps filtered totals when selection mode has no selected bets", () => {
    const visibleBets = [bet({ id: "first" }), bet({ id: "second" })];

    assert.equal(selectBetsForFinancialSummary(visibleBets, new Set(), true), visibleBets);
    assert.equal(selectBetsForFinancialSummary(visibleBets, new Set(["first"]), false), visibleBets);
  });
});

describe("desktop bet-card focus", () => {
  it("shows the emerald focus ring for keyboard focus only", () => {
    const source = readFileSync(new URL("../../src/components/BetsManager.tsx", import.meta.url), "utf8");
    const cardClass = source
      .split("\n")
      .find((line) => line.includes("rounded-sm border p-4 md:p-5"));

    assert.ok(cardClass);
    assert.match(cardClass, /focus-visible:ring-2 focus-visible:ring-emerald-500\/40/);
    assert.doesNotMatch(cardClass, /\bfocus:ring-2\b/);
  });
});

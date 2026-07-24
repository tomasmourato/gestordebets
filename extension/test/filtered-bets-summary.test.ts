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

  it("uses the same fixed desktop height and only renders a compact top rail while selecting", () => {
    const withSelectionRail = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet()],
        currency: "€",
        freebetOnly: false,
        fixedSelectionHeight: true,
        footer: React.createElement("div", null, "2 apostas selecionadas"),
      }),
    );
    const withoutFooter = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet()],
        currency: "€",
        freebetOnly: false,
        fixedSelectionHeight: true,
      }),
    );
    const mobileLayout = renderToStaticMarkup(
      React.createElement(FilteredBetsSummary, {
        bets: [bet()],
        currency: "€",
        freebetOnly: false,
      }),
    );

    assert.match(withSelectionRail, /data-summary-fixed-height="true"/);
    assert.match(withoutFooter, /data-summary-fixed-height="true"/);
    assert.match(withSelectionRail, /md:h-36/);
    assert.match(withoutFooter, /md:h-36/);
    assert.match(withSelectionRail, /data-summary-metrics-state="compact"/);
    assert.match(withSelectionRail, /md:h-\[5\.375rem\]/);
    assert.match(withoutFooter, /data-summary-metrics-state="expanded"/);
    assert.match(withoutFooter, /md:flex-1/);
    assert.match(withSelectionRail, /data-summary-selection-rail="true"/);
    assert.match(withSelectionRail, /data-summary-selection-divider="true"/);
    assert.ok(withSelectionRail.indexOf("data-summary-selection-rail") < withSelectionRail.indexOf("data-summary-metrics-state"));
    assert.doesNotMatch(withoutFooter, /data-summary-selection-rail/);
    assert.doesNotMatch(withoutFooter, /data-summary-selection-divider/);
    assert.match(withSelectionRail, /data-summary-compact="true"/);
    assert.match(withSelectionRail, /data-summary-metric-size="compact"/);
    assert.match(withSelectionRail, /--summary-metric-size:1rem/);
    assert.match(withSelectionRail, /--summary-label-size:0\.625rem/);
    assert.match(withSelectionRail, /md:items-start md:text-left/);
    assert.match(withSelectionRail, /2 apostas selecionadas/);
    assert.match(withSelectionRail, /data-summary-rail-motion="fade"/);
    assert.match(withoutFooter, /data-summary-compact="false"/);
    assert.match(withoutFooter, /data-summary-metric-size="normal"/);
    assert.match(withoutFooter, /--summary-metric-size:1\.5rem/);
    assert.match(withoutFooter, /--summary-label-size:0\.75rem/);
    assert.match(withoutFooter, /md:items-center md:text-center/);
    assert.doesNotMatch(withoutFooter, /2 apostas selecionadas/);
    assert.doesNotMatch(mobileLayout, /data-summary-fixed-height/);
    assert.doesNotMatch(mobileLayout, /md:h-36/);
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

describe("desktop integrated selection rail", () => {
  it("keeps all desktop bulk actions together in the compact top rail", () => {
    const source = readFileSync(new URL("../../src/components/BetsManager.tsx", import.meta.url), "utf8");

    assert.match(source, /flex flex-wrap items-center justify-between gap-2[^`]*md:flex-nowrap md:gap-1/);
    assert.match(source, /flex items-center gap-2 md:shrink-0 md:gap-1/);
    assert.match(source, /Cancelar seleção/);
    assert.match(source, /flex flex-wrap items-center gap-2[^`]*md:flex-nowrap md:shrink-0 md:gap-1/);
    assert.match(source, /px-3 py-1\.5[^`]*md:px-2 md:py-1 md:text-\[11px\] md:gap-1/);
    assert.match(source, /inline-flex items-center gap-2[^`]*md:gap-1 md:shrink-0 md:text-\[11px\]/);
  });

  it("keeps Cancel neutral and preserves the Lucide icons within the summary rail", () => {
    const source = readFileSync(new URL("../../src/components/BetsManager.tsx", import.meta.url), "utf8");
    const toolbar = source.slice(source.indexOf("id=\"bets-toolbar\""), source.indexOf("<FilteredBetsSummary"));
    const summary = source.slice(source.indexOf("<FilteredBetsSummary"), source.indexOf("{/* Painel: editar em massa"));
    const cancelLabelIndex = summary.indexOf("Cancelar seleção");
    const cancelButton = summary.slice(summary.lastIndexOf("<button", cancelLabelIndex), summary.indexOf("</button>", cancelLabelIndex) + 9);

    assert.doesNotMatch(toolbar, /Cancelar seleção/);
    assert.match(toolbar, /Selecionar várias/);
    assert.match(toolbar, /Selecionar filtradas/);
    assert.match(summary, /Cancelar seleção/);
    assert.match(summary, /footer=\{\s*isSelecting\s*\?/);
    assert.match(cancelButton, /border-zinc-200/);
    assert.doesNotMatch(cancelButton, /bg-emerald-|(?<!hover:)text-emerald-/);
    assert.match(summary, /<CheckSquare size=\{13\} \/>/);
    assert.match(summary, /<Edit size=\{13\} \/>/);
    assert.match(summary, /allSelectedIgnored \? <>\s*<Eye size=\{13\} \/> Repor\s*<\/> : <>\s*<EyeOff size=\{13\} \/> Ignorar/);
    assert.match(summary, /<Copy size=\{13\} \/>/);
    assert.match(summary, /<Trash2 size=\{13\} \/>/);
    assert.match(summary, /aria-label="Cancelar eliminação"[\s\S]*?<X size=\{14\} \/>/);
  });

  it("uses desktop-only 180 ms typography transitions without FLIP or positional rail motion", () => {
    const summarySource = readFileSync(new URL("../../src/components/FilteredBetsSummary.tsx", import.meta.url), "utf8");
    const typedUtility = (prefix: string, variable: string) => `${prefix}${"["}${"length:var("}${variable}${")]"}`;
    const ambiguousUtility = (prefix: string, variable: string) => `${prefix}${"["}${"var("}${variable}${")]"}`;
    const metricSizeUtility = typedUtility("md:text-", "--summary-metric-size");
    const labelSizeUtility = typedUtility("md:text-", "--summary-label-size");
    const metricLineHeightUtility = typedUtility("md:leading-", "--summary-metric-line-height");

    assert.match(summarySource, /data-summary-rail-motion="fade"[\s\S]*?transition=\{\{[\s\S]*?duration: reduceMotion \? 0 : 0\.18/);
    assert.match(summarySource, /--summary-metric-size":\s*fixedSelectionHeight\s*\?\s*compactMetrics\s*\?\s*"1rem"\s*:\s*"1\.5rem"\s*:\s*"0\.875rem"/);
    assert.match(summarySource, /--summary-label-size":\s*fixedSelectionHeight\s*\?\s*compactMetrics\s*\?\s*"0\.625rem"\s*:\s*"0\.75rem"\s*:\s*"0\.625rem"/);
    assert.ok(summarySource.includes(metricSizeUtility));
    assert.ok(summarySource.includes(labelSizeUtility));
    assert.ok(summarySource.includes(metricLineHeightUtility));
    assert.ok(!summarySource.includes(ambiguousUtility("md:text-", "--summary-metric-size")));
    assert.ok(!summarySource.includes(ambiguousUtility("md:text-", "--summary-label-size")));
    assert.ok(!summarySource.includes(ambiguousUtility("md:leading-", "--summary-metric-line-height")));
    assert.match(summarySource, /--summary-metric-size[\s\S]*?transition=\{\{[\s\S]*?duration: reduceMotion \? 0 : 0\.18/);
    assert.match(summarySource, /--summary-label-size[\s\S]*?transition=\{\{[\s\S]*?duration: reduceMotion \? 0 : 0\.18/);
    assert.doesNotMatch(summarySource, /\blayout=/);
    assert.doesNotMatch(summarySource, /\by\s*:/);
    assert.doesNotMatch(summarySource, /\bexit=/);
    assert.doesNotMatch(summarySource, /motion-safe:transition-\[opacity,transform\]|motion-safe:duration-\[180ms\]|motion-reduce:transition-none/);
  });
});

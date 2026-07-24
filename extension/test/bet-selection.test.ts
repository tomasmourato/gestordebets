import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  INITIAL_BET_SELECTION_STATE,
  betSelectionReducer,
  type BetSelectionState,
} from "../../src/lib/betSelection";

const selected = (...ids: string[]): BetSelectionState => ({
  isSelecting: true,
  selectedIds: new Set(ids),
});

describe("betSelectionReducer", () => {
  it("allows manual selection mode to start with no selected bets", () => {
    const started = betSelectionReducer(INITIAL_BET_SELECTION_STATE, { type: "toggle-mode" });

    assert.equal(started.isSelecting, true);
    assert.deepEqual([...started.selectedIds], []);

    const stopped = betSelectionReducer(started, { type: "toggle-mode" });
    assert.equal(stopped.isSelecting, false);
    assert.deepEqual([...stopped.selectedIds], []);
  });

  it("preserves manually enabled empty selection mode when no filtered bets exist", () => {
    const manuallyEnabled = betSelectionReducer(INITIAL_BET_SELECTION_STATE, {
      type: "toggle-mode",
    });
    const result = betSelectionReducer(manuallyEnabled, {
      type: "toggle-filtered",
      filteredIds: [],
    });

    assert.equal(result, manuallyEnabled);
    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], []);
  });

  it("starts selection when an individual bet is added", () => {
    const result = betSelectionReducer(INITIAL_BET_SELECTION_STATE, {
      type: "toggle-one",
      betId: "a",
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["a"]);
  });

  it("exits selection mode when the final selected bet is removed", () => {
    const result = betSelectionReducer(selected("a"), {
      type: "toggle-one",
      betId: "a",
    });

    assert.equal(result.isSelecting, false);
    assert.deepEqual([...result.selectedIds], []);
  });

  it("keeps selection mode active when one of several selected bets is removed", () => {
    const result = betSelectionReducer(selected("a", "b"), {
      type: "toggle-one",
      betId: "a",
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["b"]);
  });

  it("exits when deselecting all filtered bets empties the selection", () => {
    const result = betSelectionReducer(selected("a", "b"), {
      type: "toggle-filtered",
      filteredIds: ["a", "b"],
    });

    assert.equal(result.isSelecting, false);
    assert.deepEqual([...result.selectedIds], []);
  });

  it("keeps selection active when deselecting filtered bets leaves a hidden selection", () => {
    const result = betSelectionReducer(selected("a", "b", "hidden"), {
      type: "toggle-filtered",
      filteredIds: ["a", "b"],
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["hidden"]);
  });

  it("selects every filtered bet when the filtered set is not fully selected", () => {
    const result = betSelectionReducer(selected("a"), {
      type: "toggle-filtered",
      filteredIds: ["a", "b"],
    });

    assert.equal(result.isSelecting, true);
    assert.deepEqual([...result.selectedIds], ["a", "b"]);
  });

  it("clears selection and mode explicitly after a completed bulk action", () => {
    const result = betSelectionReducer(selected("a", "b"), { type: "clear" });

    assert.equal(result.isSelecting, false);
    assert.deepEqual([...result.selectedIds], []);
  });
});

describe("desktop and mobile selection integration", () => {
  const desktopSource = readFileSync(
    new URL("../../src/components/BetsManager.tsx", import.meta.url),
    "utf8",
  );
  const mobileSource = readFileSync(
    new URL("../../src/mobile/screens/MobileBets.tsx", import.meta.url),
    "utf8",
  );

  it("routes desktop selection paths through the shared reducer action", () => {
    assert.match(desktopSource, /useReducer\(\s*betSelectionReducer/);
    assert.match(desktopSource, /const toggleBetSelection = \(id: string\).*type: "toggle-one"/s);
    assert.match(desktopSource, /toggleBetSelectionFromLongPress.*toggleBetSelection\(id\)/s);
    assert.match(desktopSource, /onChange=\{\(\) => toggleBetSelection\(bet\.id\)\}/);
    assert.match(desktopSource, /type: "toggle-filtered"/);
  });

  it("routes mobile selection paths through the shared reducer action", () => {
    assert.match(mobileSource, /useReducer\(\s*betSelectionReducer/);
    assert.match(mobileSource, /const toggleSelected = \(id: string\).*type: "toggle-one"/s);
    assert.match(mobileSource, /toggleSelectedFromLongPress.*toggleSelected\(id\)/s);
    assert.match(mobileSource, /if \(isSelecting\) toggleSelected\(bet\.id\)/);
    assert.match(mobileSource, /type: "toggle-filtered"/);
  });

  it("keeps the desktop card as the selection target while animating only its inner padding", () => {
    const cardSource = desktopSource.slice(desktopSource.indexOf("{/* Bets List / Grid */}"), desktopSource.indexOf("{/* Detail Modal */}"));

    assert.match(cardSource, /className=\{`relative bg-white/);
    assert.match(cardSource, /className="absolute left-4 top-1\/2 z-10 hidden -translate-y-1\/2 md:flex/);
    assert.match(cardSource, /<motion\.div[\s\S]*?animate=\{\{ paddingLeft: isSelecting \? "44px" : "0px" \}\}/);
    assert.match(cardSource, /duration: reduceMotion \? 0 : 0\.18/);
    assert.doesNotMatch(cardSource, /<AnimatePresence|\blayout=/);
  });
});

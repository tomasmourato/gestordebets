import assert from "node:assert/strict";
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

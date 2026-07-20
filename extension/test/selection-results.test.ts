import { describe, expect, test } from "bun:test";
import { mapBetFromApi, mapBetToApi } from "../../src/lib/betsApi";

describe("selection result API mapping", () => {
  test("preserves supported results and discards unknown values", () => {
    const mapped = mapBetFromApi({
      id: "bet-with-results",
      type: "MULTIPLA",
      status: "PERDIDA",
      stake: 10,
      odd: 3,
      selections: [
        { id: "won", event: "A - B", market: "Resultado", choice: "A", odd: 2, result: "GANHA" },
        { id: "lost", event: "C - D", market: "Golos", choice: "+2.5", odd: 1.5, result: "PERDIDA" },
        { id: "unknown", event: "E - F", market: "Cantos", choice: "+8.5", odd: 1.4, result: "UNKNOWN" },
      ],
    });

    expect(mapped.selections.map((selection) => selection.result)).toEqual([
      "GANHA",
      "PERDIDA",
      undefined,
    ]);
    expect(mapBetToApi(mapped).selections[1].result).toBe("PERDIDA");
  });
});

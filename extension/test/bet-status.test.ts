import { describe, expect, test } from "bun:test";
import { normalizeBetStatus } from "../../src/lib/betStatus";

describe("canonical bet status", () => {
  test("normalizes bookmaker cashout labels", () => {
    expect(normalizeBetStatus("FullCashout")).toBe("CASHOUT");
    expect(normalizeBetStatus("partial_cashout")).toBe("CASHOUT");
    expect(normalizeBetStatus("Cashed Out")).toBe("CASHOUT");
  });

  test("cashout metadata overrides historical half-result mappings", () => {
    expect(normalizeBetStatus("MEIO_PERDIDA", { isCashout: true })).toBe("CASHOUT");
    expect(normalizeBetStatus("MEIO_GANHA", { originalStatus: "FullCashout" })).toBe("CASHOUT");
  });

  test("keeps real half results distinct from cashouts", () => {
    expect(normalizeBetStatus("MEIO_GANHA")).toBe("MEIO_GANHA");
    expect(normalizeBetStatus("HALF_LOST")).toBe("MEIO_PERDIDA");
  });
});

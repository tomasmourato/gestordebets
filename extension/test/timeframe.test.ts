import { describe, expect, test } from "bun:test";
import { rangeSpansAtLeastTwoMonths, resolveTimeframeRange } from "../../src/components/TimeframeFilter";

const now = new Date(2026, 6, 16, 12, 0, 0);

describe("shared timeframe ranges", () => {
  test("uses inclusive rolling-day presets", () => {
    expect(resolveTimeframeRange({ timeframe: "7_DAYS", startDate: "", endDate: "" }, now))
      .toEqual({ start: "2026-07-10", end: "2026-07-16" });
    expect(resolveTimeframeRange({ timeframe: "30_DAYS", startDate: "", endDate: "" }, now))
      .toEqual({ start: "2026-06-17", end: "2026-07-16" });
  });

  test("uses calendar boundaries for month and year presets", () => {
    expect(resolveTimeframeRange({ timeframe: "THIS_MONTH", startDate: "", endDate: "" }, now))
      .toEqual({ start: "2026-07-01", end: "2026-07-16" });
    expect(resolveTimeframeRange({ timeframe: "THIS_YEAR", startDate: "", endDate: "" }, now))
      .toEqual({ start: "2026-01-01", end: "2026-07-16" });
  });

  test("preserves custom inclusive boundaries", () => {
    expect(resolveTimeframeRange({
      timeframe: "CUSTOM",
      startDate: "2026-03-04",
      endDate: "2026-04-05",
    }, now)).toEqual({ start: "2026-03-04", end: "2026-04-05" });
  });

  test("shows monthly performance only from two calendar months onward", () => {
    expect(rangeSpansAtLeastTwoMonths(new Date(2026, 0, 1), new Date(2026, 1, 28))).toBe(false);
    expect(rangeSpansAtLeastTwoMonths(new Date(2026, 0, 1), new Date(2026, 2, 1))).toBe(true);
  });
});

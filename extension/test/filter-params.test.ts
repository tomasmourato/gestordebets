import { describe, expect, test } from "bun:test";
import {
  EMPTY_BET_FILTERS,
  readFilters,
  serializeFilters,
  type BetFilters,
} from "../../src/lib/filterParams";

const parse = (search: string) => readFilters(new URLSearchParams(search));

describe("filter params", () => {
  test("an empty query means no filters, and serializes back to no query", () => {
    expect(parse("")).toEqual(EMPTY_BET_FILTERS);
    expect(serializeFilters(EMPTY_BET_FILTERS)).toBe("");
  });

  test("round-trips the full drill-down param set", () => {
    const search = "?status=GANHA&bookmaker=Betano&account=acc-1&sport=Futebol&type=SIMPLES&money=FREEBET&timeframe=30_DAYS";
    const filters = parse(search);

    expect(filters.status).toBe("GANHA");
    expect(filters.bookmaker).toBe("Betano");
    expect(filters.account).toBe("acc-1");
    expect(filters.sport).toBe("Futebol");
    expect(filters.type).toBe("SIMPLES");
    expect(filters.money).toBe("FREEBET");
    expect(filters.timeframe.timeframe).toBe("30_DAYS");

    // Reserializar tem de reproduzir exatamente os mesmos filtros.
    expect(parse(serializeFilters(filters))).toEqual(filters);
  });

  test("keeps the explicit range only for custom periods", () => {
    const custom = parse("?timeframe=CUSTOM&dateFrom=2026-01-01&dateTo=2026-03-31");
    expect(custom.timeframe).toEqual({ timeframe: "CUSTOM", startDate: "2026-01-01", endDate: "2026-03-31" });
    expect(serializeFilters(custom)).toBe("?timeframe=CUSTOM&dateFrom=2026-01-01&dateTo=2026-03-31");

    // Num período relativo as datas são derivadas: mantê-las no URL fixava um
    // intervalo que deixava de corresponder a "últimos 30 dias" no dia seguinte.
    const relative = parse("?timeframe=30_DAYS&dateFrom=2026-01-01&dateTo=2026-03-31");
    expect(serializeFilters(relative)).toBe("?timeframe=30_DAYS");
  });

  test("a bare date range counts as a custom period", () => {
    expect(parse("?dateFrom=2026-05-01").timeframe).toEqual({
      timeframe: "CUSTOM",
      startDate: "2026-05-01",
      endDate: "",
    });
    expect(parse("?dateTo=2026-05-31").timeframe.timeframe).toBe("CUSTOM");
  });

  test("ignores unknown params and invalid timeframes", () => {
    const filters = parse("?utm_source=x&timeframe=NEXT_CENTURY&sport=Ténis");
    expect(filters.timeframe.timeframe).toBe("ALL");
    expect(filters.sport).toBe("Ténis");
    expect(serializeFilters(filters)).toBe("?sport=T%C3%A9nis");
  });

  test("omits filters left at ALL", () => {
    const onlyAccount: BetFilters = { ...EMPTY_BET_FILTERS, account: "acc-9" };
    expect(serializeFilters(onlyAccount)).toBe("?account=acc-9");

    // "NONE" (apostas sem conta) é um filtro real, não a ausência de filtro.
    const noAccount: BetFilters = { ...EMPTY_BET_FILTERS, account: "NONE" };
    expect(serializeFilters(noAccount)).toBe("?account=NONE");
    expect(parse(serializeFilters(noAccount)).account).toBe("NONE");
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { resolveSelectionDisplayResult } from "../../src/lib/selectionDisplayResult";

describe("selection display result", () => {
  it("uses the settled ticket result for a single bet when its only selection contradicts it", () => {
    assert.equal(resolveSelectionDisplayResult("PERDIDA", "GANHA", "SIMPLES"), "PERDIDA");
    assert.equal(resolveSelectionDisplayResult("GANHA", "PERDIDA", "SIMPLES"), "GANHA");
  });

  it("shows an unknown result when a settled bet still has a pending selection", () => {
    assert.equal(resolveSelectionDisplayResult("GANHA", "POR_LIQUIDAR"), "DESCONHECIDO");
    assert.equal(resolveSelectionDisplayResult("PERDIDA", "POR_LIQUIDAR"), "DESCONHECIDO");
    assert.equal(resolveSelectionDisplayResult("CASHOUT", "POR_LIQUIDAR"), "DESCONHECIDO");
  });

  it("keeps pending for a genuinely unsettled bet", () => {
    assert.equal(resolveSelectionDisplayResult("POR_LIQUIDAR", "POR_LIQUIDAR"), "POR_LIQUIDAR");
  });

  it("preserves explicit results for legs in a multiple bet", () => {
    assert.equal(resolveSelectionDisplayResult("GANHA", "PERDIDA", "MULTIPLA"), "PERDIDA");
    assert.equal(resolveSelectionDisplayResult("PERDIDA", "GANHA", "MULTIPLA"), "GANHA");
    assert.equal(resolveSelectionDisplayResult("GANHA", undefined), undefined);
  });

  it("renders a selection detail badge only for unknown outcomes while retaining tinting", () => {
    const source = readFileSync(new URL("../../src/components/BetsManager.tsx", import.meta.url), "utf8");
    const badgeSource = source.slice(source.indexOf("const getSelectionResultBadge"), source.indexOf("const selectionDetailClass"));
    const tintSource = source.slice(source.indexOf("const selectionDetailClass"), source.indexOf("const betTitleClass"));

    assert.match(badgeSource, /case "DESCONHECIDO":/);
    assert.match(badgeSource, /Desconhecido/);
    assert.doesNotMatch(badgeSource, /case "GANHA"|case "PERDIDA"|case "ANULADA"|case "POR_LIQUIDAR"|case "MEIO_GANHA"|case "MEIO_PERDIDA"/);
    assert.match(tintSource, /result === "PERDIDA" \|\| result === "MEIO_PERDIDA"/);
    assert.match(tintSource, /result === "GANHA" \|\| result === "MEIO_GANHA"/);
  });
});

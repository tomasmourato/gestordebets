import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveSelectionDisplayResult } from "../../src/lib/selectionDisplayResult";

describe("selection display result", () => {
  it("shows an unknown result when a settled bet still has a pending selection", () => {
    assert.equal(resolveSelectionDisplayResult("GANHA", "POR_LIQUIDAR"), "DESCONHECIDO");
    assert.equal(resolveSelectionDisplayResult("PERDIDA", "POR_LIQUIDAR"), "DESCONHECIDO");
    assert.equal(resolveSelectionDisplayResult("CASHOUT", "POR_LIQUIDAR"), "DESCONHECIDO");
  });

  it("keeps pending for a genuinely unsettled bet", () => {
    assert.equal(resolveSelectionDisplayResult("POR_LIQUIDAR", "POR_LIQUIDAR"), "POR_LIQUIDAR");
  });

  it("preserves explicit selection results", () => {
    assert.equal(resolveSelectionDisplayResult("GANHA", "PERDIDA"), "PERDIDA");
    assert.equal(resolveSelectionDisplayResult("PERDIDA", "GANHA"), "GANHA");
    assert.equal(resolveSelectionDisplayResult("GANHA", undefined), undefined);
  });
});

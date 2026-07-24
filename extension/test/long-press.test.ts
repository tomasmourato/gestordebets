import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createLongPressController } from "../../src/lib/longPress";

describe("long-press controller", () => {
  it("fires once and consumes only the release click", () => {
    let scheduled: (() => void) | undefined;
    let fired = 0;
    const controller = createLongPressController({
      delay: 500,
      schedule: (callback) => {
        scheduled = callback;
        return 1;
      },
      cancelScheduled: () => {},
    });

    controller.start(() => fired++);
    scheduled?.();
    scheduled?.();

    assert.equal(fired, 1);
    assert.equal(controller.consumeClick(), true);
    assert.equal(controller.consumeClick(), false);
  });

  it("does nothing after a cancelled press", () => {
    let scheduled: (() => void) | undefined;
    let fired = 0;
    const controller = createLongPressController({
      schedule: (callback) => {
        scheduled = callback;
        return 1;
      },
      cancelScheduled: () => {},
    });

    controller.start(() => fired++);
    controller.cancel();
    scheduled?.();

    assert.equal(fired, 0);
    assert.equal(controller.consumeClick(), false);
  });

  it("still suppresses the release click after activation and later pointer cancellation", () => {
    let scheduled: (() => void) | undefined;
    const controller = createLongPressController({
      schedule: (callback) => {
        scheduled = callback;
        return 1;
      },
      cancelScheduled: () => {},
    });

    controller.start(() => {});
    scheduled?.();
    controller.cancel();

    assert.equal(controller.consumeClick(), true);
  });
});

type TimerHandle = ReturnType<typeof setTimeout> | number;

interface LongPressOptions {
  delay?: number;
  schedule?: (callback: () => void, delay: number) => TimerHandle;
  cancelScheduled?: (handle: TimerHandle) => void;
}

export interface LongPressController {
  start(callback: () => void): void;
  cancel(): void;
  finish(): void;
  consumeClick(): boolean;
  dispose(): void;
}

export function createLongPressController(options: LongPressOptions = {}): LongPressController {
  const delay = options.delay ?? 500;
  const schedule = options.schedule ?? ((callback, ms) => window.setTimeout(callback, ms));
  const cancelScheduled = options.cancelScheduled ?? ((handle) => window.clearTimeout(handle as number));
  let timer: TimerHandle | null = null;
  let suppressClick = false;

  const cancelTimer = () => {
    if (timer !== null) cancelScheduled(timer);
    timer = null;
  };

  return {
    start(callback) {
      cancelTimer();
      suppressClick = false;
      timer = schedule(() => {
        if (timer === null) return;
        timer = null;
        suppressClick = true;
        callback();
      }, delay);
    },
    cancel() {
      const wasPending = timer !== null;
      cancelTimer();
      if (wasPending) suppressClick = false;
    },
    finish() {
      cancelTimer();
    },
    consumeClick() {
      const consumed = suppressClick;
      suppressClick = false;
      return consumed;
    },
    dispose() {
      cancelTimer();
      suppressClick = false;
    },
  };
}

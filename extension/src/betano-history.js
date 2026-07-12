const BETANO_HISTORY_URL = "https://www.betano.pt/myaccount/api/ma/bet/bet-history-v3";
const EARLIEST_HISTORY = new Date("2012-01-01T00:00:00.000Z");
const MAX_PAGES_PER_WINDOW = 1000;

export function createSixMonthWindows(now = new Date(), earliest = EARLIEST_HISTORY) {
  const windows = [];
  let end = new Date(now);
  while (end > earliest) {
    let start = new Date(end);
    start.setUTCMonth(start.getUTCMonth() - 6);
    if (start < earliest) start = new Date(earliest);
    windows.push({ start: new Date(start), end: new Date(end) });
    end = start;
  }
  return windows;
}

async function fetchPages(requestPage, query, onProgress) {
  const bets = [];
  const seenLastIds = new Set();
  let lastId = null;

  for (let page = 1; page <= MAX_PAGES_PER_WINDOW; page++) {
    const params = new URLSearchParams({ ...query, page: String(page) });
    if (lastId !== null) params.set("lastId", String(lastId));
    const payload = await requestPage(`${BETANO_HISTORY_URL}?${params}`);
    const result = payload?.Result ?? {};
    const pageBets = Array.isArray(result.Bets) ? result.Bets : [];
    bets.push(...pageBets);
    onProgress?.({ page, pageCount: pageBets.length, total: bets.length });

    const nextLastId = result.LastId;
    if (pageBets.length === 0 || nextLastId === undefined || nextLastId === null) break;
    const key = String(nextLastId);
    if (seenLastIds.has(key)) break;
    seenLastIds.add(key);
    lastId = nextLastId;
  }
  return bets;
}

export async function fetchBetanoHistory(requestPage, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const earliest = options.earliest ? new Date(options.earliest) : EARLIEST_HISTORY;
  const onProgress = options.onProgress;

  const open = await fetchPages(requestPage, { settled: "false" }, (info) => {
    onProgress?.({ kind: "open", ...info });
  });

  const settled = [];
  const windows = createSixMonthWindows(now, earliest);
  for (let index = 0; index < windows.length; index++) {
    const window = windows[index];
    const bets = await fetchPages(
      requestPage,
      {
        startDate: window.start.toISOString(),
        endDate: window.end.toISOString(),
        settled: "true",
      },
      (info) => onProgress?.({ kind: "settled", window: index + 1, windows: windows.length, ...info })
    );
    settled.push(...bets);
  }

  return { open, settled };
}

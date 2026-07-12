// Extension service worker. It imports each bookmaker independently, maps
// source-specific payloads, updates changed imports, and sends new records to
// BetTrackr in bounded batches.
import { mapBetclicBets, betclicRef } from "./mapper.js";
import { mapBetanoBets, betanoRef } from "./mapper-betano.js";
import { fetchBetanoHistory } from "./betano-history.js";

const PAGE_SIZE = 20;
const DEFAULT_BETTRACKR_BASE = "https://gestordebets.vercel.app";
const pendingBetanoRequests = new Map();
let requestSequence = 0;

function progress(text) {
  chrome.runtime.sendMessage({ type: "PROGRESS", text }).catch(() => {});
}

async function getConfig() {
  const stored = await chrome.storage.local.get([
    "betclicToken", "betclicApiBase", "bettrackrToken", "bettrackrBase",
  ]);
  return {
    betclicToken: stored.betclicToken || null,
    betclicApiBase: stored.betclicApiBase || "https://betting.begmedia.pt",
    bettrackrToken: stored.bettrackrToken || null,
    bettrackrBase: stored.bettrackrBase || DEFAULT_BETTRACKR_BASE,
  };
}

async function fetchBetclicBets(kind, cfg) {
  const out = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const url = `${cfg.betclicApiBase}/api/v2/me/bets/${kind}` +
      `?cache-burst=${Date.now()}&limit=${PAGE_SIZE}&offset=${offset}&embed=Metagame`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cfg.betclicToken}`,
        Accept: "application/json",
        "X-Bg-Universe": "Sports",
        "X-Bg-Language": "pt",
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error("Sessão Betclic expirada. Abre betclic.pt e recarrega as tuas apostas.");
    }
    if (!res.ok) throw new Error(`Betclic respondeu ${res.status} ao obter apostas (${kind}).`);
    const totalHeader = Number(res.headers.get("X-Total-Count"));
    if (Number.isFinite(totalHeader)) total = totalHeader;
    const data = await res.json().catch(() => ({}));
    const bets = Array.isArray(data.bets) ? data.bets : [];
    out.push(...bets);
    progress(`A ler apostas do Betclic (${kind}): ${out.length}${Number.isFinite(total) ? "/" + total : ""}…`);
    if (bets.length === 0) break;
    offset += PAGE_SIZE;
    if (offset > 5000) break;
  }
  return out;
}

async function findBetanoTab() {
  const tabs = await chrome.tabs.query({ url: ["https://www.betano.pt/*"] });
  return tabs.find((tab) => tab.active) || tabs[0] || null;
}

function betanoRequestId() {
  requestSequence = (requestSequence + 1) % 1000000000;
  return `betano-${Date.now()}-${requestSequence}`;
}

function requestBetanoPage(tabId, params) {
  const requestId = betanoRequestId();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingBetanoRequests.delete(requestId);
      reject(new Error("O separador do Betano não respondeu a tempo."));
    }, 30000);
    pendingBetanoRequests.set(requestId, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
    chrome.tabs.sendMessage(tabId, { type: "BETANO_FETCH_PAGE", requestId, params })
      .catch((error) => {
        pendingBetanoRequests.delete(requestId);
        clearTimeout(timer);
        reject(new Error("Abre ou recarrega a página principal do Betano antes de importar."));
      });
  });
}

async function fetchBetanoBets(tabId) {
  return fetchBetanoHistory(async (url) => {
    const parsed = new URL(url);
    const params = {};
    parsed.searchParams.forEach((value, key) => { params[key] = value; });
    const response = await requestBetanoPage(tabId, params);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Sessão Betano expirada. Abre o histórico do Betano e inicia sessão novamente.");
      }
      throw new Error(`Betano respondeu ${response.status || "sem resposta"} ao obter apostas.`);
    }
    return response.payload;
  }, {
    onProgress(info) {
      const source = info.kind === "open" ? "abertas" : `histórico ${info.window}/${info.windows}`;
      progress(`A ler apostas do Betano (${source}): ${info.total}…`);
    },
  });
}

async function fetchBetclicBetsForImport(cfg) {
  const [ended, ongoing] = await Promise.all([
    fetchBetclicBets("ended", cfg),
    fetchBetclicBets("ongoing", cfg),
  ]);
  const byRef = new Map();
  for (const bet of ongoing) byRef.set(betclicRef(bet), bet);
  for (const bet of ended) byRef.set(betclicRef(bet), bet);
  byRef.delete(null);
  return mapBetclicBets([...byRef.values()]);
}

async function fetchExistingBets(cfg) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets`, {
    headers: { Authorization: `Bearer ${cfg.bettrackrToken}` },
  });
  if (res.status === 401) throw new Error("Sessão BetTrackr expirada. Inicia sessão novamente.");
  if (!res.ok) throw new Error(`BetTrackr respondeu ${res.status} ao listar apostas.`);
  const data = await res.json().catch(() => ({}));
  const existing = new Map();
  for (const bet of data.bets || []) {
    const metadata = typeof bet.metadata === "string"
      ? (() => { try { return JSON.parse(bet.metadata); } catch (_) { return {}; } })()
      : (bet.metadata || {});
    let key = metadata.importKey;
    if (!key && metadata.source && metadata.ref) key = `${metadata.source}:${metadata.ref}`;
    // Before source-aware keys existed, all extension imports were Betclic.
    if (!key && metadata.ref) key = `betclic:${metadata.ref}`;
    if (key) existing.set(String(key), { ...bet, metadata });
  }
  return existing;
}

function importKey(bet) {
  if (bet && bet.metadata && bet.metadata.importKey) return String(bet.metadata.importKey);
  if (bet && bet.metadata && bet.metadata.source && bet.metadata.ref) {
    return `${bet.metadata.source}:${bet.metadata.ref}`;
  }
  return null;
}

function selectionsSignature(selections) {
  let value = selections;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch (_) { value = []; }
  }
  return JSON.stringify((Array.isArray(value) ? value : []).map((selection) => ({
    event: selection.event || "",
    market: selection.market || "",
    choice: selection.choice || "",
    odd: Number(selection.odd) || 0,
  })));
}

function needsUpdate(existing, incoming) {
  return existing.status !== incoming.status ||
    Number(existing.stake) !== Number(incoming.stake) ||
    Number(existing.odd) !== Number(incoming.odd) ||
    Number(existing.final_return) !== Number(incoming.finalReturn) ||
    Number(existing.net_profit) !== Number(incoming.netProfit) ||
    Boolean(existing.is_freebet) !== Boolean(incoming.isFreebet) ||
    selectionsSignature(existing.selections) !== selectionsSignature(incoming.selections);
}

function betPayload(bet) {
  return {
    type: bet.type,
    status: bet.status,
    stake: bet.stake,
    odd: bet.odd,
    isFreebet: bet.isFreebet,
    potentialReturn: bet.potentialReturn,
    finalReturn: bet.finalReturn,
    netProfit: bet.netProfit,
    bookmaker: bet.bookmaker,
    dateTime: bet.dateTime,
    notes: bet.notes,
    origin: bet.origin,
    selections: bet.selections,
    comment: bet.comment,
    tags: bet.tags,
    metadata: bet.metadata,
  };
}

async function postBulk(bets, cfg) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.bettrackrToken}` },
    body: JSON.stringify({ bets: bets.map(betPayload) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `BetTrackr respondeu ${res.status} ao importar.`);
  return Array.isArray(data.bets) ? data.bets.length : bets.length;
}

async function updateBet(existing, incoming, cfg) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/${encodeURIComponent(existing.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.bettrackrToken}` },
    body: JSON.stringify(betPayload(incoming)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `BetTrackr respondeu ${res.status} ao atualizar.`);
}

async function persistMapped(mapped, unsupported, source, cfg) {
  const existing = await fetchExistingBets(cfg);
  const fresh = [];
  const updates = [];
  let skipped = 0;
  for (const bet of mapped) {
    const key = importKey(bet);
    const old = key && existing.get(key);
    if (!old) fresh.push(bet);
    else if (needsUpdate(old, bet)) updates.push({ old, bet });
    else skipped++;
  }

  let imported = 0;
  const chunkSize = 500;
  for (let i = 0; i < fresh.length; i += chunkSize) {
    imported += await postBulk(fresh.slice(i, i + chunkSize), cfg);
    progress(`A importar ${source}: ${Math.min(i + chunkSize, fresh.length)}/${fresh.length}…`);
  }
  let updated = 0;
  for (const pair of updates) {
    await updateBet(pair.old, pair.bet, cfg);
    updated++;
    progress(`A atualizar ${source}: ${updated}/${updates.length}…`);
  }
  return { fetched: mapped.length, imported, updated, skipped, unsupported };
}

async function runBetclicImport(cfg) {
  if (!cfg.betclicToken) throw new Error("Sessão Betclic não detetada.");
  progress("A obter apostas do Betclic…");
  const mapped = await fetchBetclicBetsForImport(cfg);
  return persistMapped(mapped, 0, "Betclic", cfg);
}

async function runBetanoImport(cfg) {
  const tab = await findBetanoTab();
  if (!tab || tab.id === undefined) throw new Error("Abre o Betano.pt numa página com sessão iniciada.");
  progress("A obter apostas do Betano…");
  const { open, settled } = await fetchBetanoBets(tab.id);
  const byRef = new Map();
  for (const bet of settled) byRef.set(betanoRef(bet), bet);
  for (const bet of open) if (!byRef.has(betanoRef(bet))) byRef.set(betanoRef(bet), bet);
  byRef.delete(null);
  const mapped = mapBetanoBets([...byRef.values()]);
  return persistMapped(mapped.bets, mapped.unsupported, "Betano", cfg);
}

async function runImport(source) {
  const cfg = await getConfig();
  if (!cfg.bettrackrToken) throw new Error("Sem sessão BetTrackr. Abre a app e inicia sessão.");
  const sources = source === "all" ? ["betclic", "betano"] : [source];
  const results = {};
  for (const current of sources) {
    try {
      results[current] = current === "betano"
        ? { ok: true, ...(await runBetanoImport(cfg)) }
        : { ok: true, ...(await runBetclicImport(cfg)) };
    } catch (error) {
      results[current] = { ok: false, error: String(error && error.message || error) };
    }
  }
  const available = Object.values(results).some((result) => result.ok);
  if (!available) {
    const errors = Object.entries(results).map(([name, result]) => `${name}: ${result.error}`).join("; ");
    throw new Error(errors || "Nenhuma fonte disponível.");
  }
  const totals = Object.values(results).reduce((sum, result) => {
    if (!result.ok) return sum;
    for (const key of ["fetched", "imported", "updated", "skipped", "unsupported"]) sum[key] += result[key] || 0;
    return sum;
  }, { fetched: 0, imported: 0, updated: 0, skipped: 0, unsupported: 0 });
  return { ok: true, sourceResults: results, ...totals };
}

async function extensionStatus() {
  const [stored, tabs] = await Promise.all([
    chrome.storage.local.get(["betclicToken", "bettrackrToken", "bettrackrBase"]),
    chrome.tabs.query({ url: ["https://www.betano.pt/*"] }),
  ]);
  return {
    betclic: Boolean(stored.betclicToken),
    // A Betano tab enables the action. The page bridge reports a useful
    // authentication error if the user is not logged in or needs a reload.
    betano: tabs.length > 0,
    bettrackr: Boolean(stored.bettrackrToken),
    bettrackrBase: stored.bettrackrBase || DEFAULT_BETTRACKR_BASE,
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "BETANO_PAGE_RESULT") {
    const pending = pendingBetanoRequests.get(msg.requestId);
    if (!pending) return false;
    pendingBetanoRequests.delete(msg.requestId);
    pending.resolve({ ok: msg.ok, status: msg.status, payload: msg.payload, error: msg.error });
    return false;
  }
  if (msg && msg.type === "GET_STATUS") {
    extensionStatus().then(sendResponse).catch(() => sendResponse({ betclic: false, betano: false, bettrackr: false }));
    return true;
  }
  if (msg && msg.type === "IMPORT") {
    const source = ["betclic", "betano", "all"].includes(msg.source) ? msg.source : "all";
    runImport(source)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  return false;
});

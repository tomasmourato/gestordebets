// Extension service worker. It imports each bookmaker independently, maps
// source-specific payloads, updates changed imports, and sends new records to
// BetTrackr in bounded batches.
import { mapBetclicBets, betclicRef } from "./mapper.js";
import { fetchBetclicHistory } from "./betclic-history.js";
import { mapBetanoBets, betanoHistoryStart, betanoRef } from "./mapper-betano.js";
import { fetchBetanoHistory } from "./betano-history.js";
import { runAfterBettrackrVerification } from "./bettrackr-identity.js";

const PAGE_SIZE = 20;
const DEFAULT_BETTRACKR_BASE = "https://gestordebets.vercel.app";
const BETTRACKR_APP_URLS = [
  "https://gestordebets.vercel.app/*",
  "http://localhost/*",
  "http://127.0.0.1/*",
];

// Recarregar/atualizar a extensão mata os content scripts das tabs já abertas
// e o Chrome NÃO os reinjeta — a app deixava de detetar a extensão (PING sem
// resposta) até o utilizador recarregar a página à mão. Numa reinstalação o
// chrome.storage também vem vazio (token BetTrackr perdido). Reinjetar a ponte
// nas tabs abertas da app repõe a deteção e ressincroniza o token de imediato.
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({ url: BETTRACKR_APP_URLS });
    for (const tab of tabs) {
      if (tab.id === undefined) continue;
      chrome.scripting
        .executeScript({ target: { tabId: tab.id }, files: ["src/content-bettrackr.js"] })
        .catch(() => {}); // tab protegida/descarregada — o reload manual continua a funcionar
    }
  } catch (_) {}
});

const pendingBetanoRequests = new Map();
const betanoTokenWaiters = new Set();
let betanoSessionTokens = null;
let requestSequence = 0;

function progress(text) {
  chrome.runtime.sendMessage({ type: "PROGRESS", text }).catch(() => {});
}

async function getConfig() {
  const stored = await chrome.storage.local.get([
    "betclicToken", "betclicApiBase", "bettrackrToken", "bettrackrBase", "bettrackrUserId",
  ]);
  return {
    betclicToken: stored.betclicToken || null,
    betclicApiBase: stored.betclicApiBase || "https://betting.begmedia.pt",
    bettrackrToken: stored.bettrackrToken || null,
    bettrackrBase: stored.bettrackrBase || DEFAULT_BETTRACKR_BASE,
    bettrackrUserId: stored.bettrackrUserId || null,
  };
}

function validSessionSnapshot(value) {
  if (!value || typeof value !== "object") return null;
  const token = typeof value.token === "string" ? value.token.trim() : "";
  const baseUrl = typeof value.baseUrl === "string" ? value.baseUrl.trim().replace(/\/+$/, "") : "";
  const expectedUserId = typeof value.expectedUserId === "string" ? value.expectedUserId.trim() : "";
  if (!token || !baseUrl) return null;
  return { token, baseUrl, expectedUserId };
}

async function sessionFromOpenBettrackrTab() {
  const tabs = await chrome.tabs.query({ url: BETTRACKR_APP_URLS });
  const ordered = [...tabs].sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)));
  for (const tab of ordered) {
    if (tab.id === undefined) continue;
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_BETTRACKR_SESSION" });
      const session = validSessionSnapshot(response?.session);
      if (session) return session;
    } catch (_) {}
  }
  return null;
}

async function configForImport(sessionSnapshot) {
  const suppliedSnapshot = sessionSnapshot !== undefined && sessionSnapshot !== null;
  const session = validSessionSnapshot(sessionSnapshot) || await sessionFromOpenBettrackrTab();

  if (suppliedSnapshot && !session) {
    throw new Error("A sessão enviada pela app é inválida. Recarrega a página e tenta novamente.");
  }
  if (session) {
    if (!session.expectedUserId) {
      throw new Error("Não foi possível identificar o utilizador atual. Termina sessão e volta a entrar na app.");
    }
    await chrome.storage.local.set({
      bettrackrToken: session.token,
      bettrackrBase: session.baseUrl,
      bettrackrUserId: session.expectedUserId,
    });
  }

  return getConfig();
}

async function fetchBetclicBets(kind, cfg) {
  return fetchBetclicHistory(async ({ offset, limit }) => {
    const url = `${cfg.betclicApiBase}/api/v2/me/bets/${kind}` +
      `?cache-burst=${Date.now()}&limit=${limit}&offset=${offset}&embed=Metagame`;
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
    const totalHeader = res.headers.get("X-Total-Count");
    const data = await res.json().catch(() => ({}));
    const bets = Array.isArray(data.bets) ? data.bets : [];
    return {
      bets,
      total: totalHeader === null ? undefined : Number(totalHeader),
    };
  }, {
    pageSize: PAGE_SIZE,
    onPage: ({ count, total }) => {
      progress(`A ler apostas do Betclic (${kind}): ${count}${Number.isFinite(total) ? "/" + total : ""}…`);
    },
  });
}

async function findBetanoTab() {
  const tabs = await chrome.tabs.query({ url: ["https://www.betano.pt/*", "https://betano.pt/*"] });
  const mainTabs = tabs.filter((tab) => {
    try { return !new URL(tab.url || "").pathname.startsWith("/myaccount/bethistory"); } catch (_) { return true; }
  });
  return mainTabs.find((tab) => tab.active) || mainTabs[0] || tabs.find((tab) => tab.active) || tabs[0] || null;
}

function isBetanoHistoryTab(tab) {
  try { return new URL(tab.url || "").pathname.startsWith("/myaccount/bethistory"); } catch (_) { return false; }
}

function isBetanoSettledTab(tab) {
  try { return new URL(tab.url || "").pathname === "/myaccount/bethistory/settled"; } catch (_) { return false; }
}

function settledHistoryUrl(origin) {
  const end = Date.now();
  const startDate = betanoHistoryStart();
  return `${origin}/myaccount/bethistory/settled?dateFrom=${startDate.getTime()}&dateTo=${end}`;
}

function waitForTabComplete(tabId, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      clearTimeout(timer);
      if (error) reject(error); else resolve();
    };
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") finish();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    timer = setTimeout(() => finish(new Error("A página do histórico do Betano não terminou de carregar.")), timeoutMs);
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === "complete") finish();
    }).catch(finish);
  });
}

function waitForBetanoTokens(timeoutMs = 15000) {
  if (betanoSessionTokens) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const waiter = { resolve, reject, timer: null };
    waiter.timer = setTimeout(() => {
      betanoTokenWaiters.delete(waiter);
      reject(new Error("Sessão Betano ainda não foi capturada. Mantém a página principal aberta e recarrega-a uma vez."));
    }, timeoutMs);
    betanoTokenWaiters.add(waiter);
  });
}

async function ensureBetanoHistoryTab(opts = {}) {
  const tabs = await chrome.tabs.query({ url: ["https://www.betano.pt/*", "https://betano.pt/*"] });
  const existingSettled = tabs.find(isBetanoSettledTab);
  if (existingSettled && existingSettled.id !== undefined) {
    await waitForTabComplete(existingSettled.id).catch(() => {});
    return { tab: existingSettled, created: false };
  }

  // Auto-import: nunca sequestrar o separador do utilizador. Sem um separador
  // de histórico já aberto, salta silenciosamente (fica para o próximo gatilho).
  if (opts.auto) return null;

  const source = tabs.find(isBetanoHistoryTab) || await findBetanoTab();
  if (!source || source.id === undefined) throw new Error("Abre a página principal do Betano numa tab aberta.");
  const restoreUrl = source.url || null;
  const origin = (() => {
    try { return new URL(source.url || "https://www.betano.pt").origin; } catch (_) { return "https://www.betano.pt"; }
  })();
  // Keep the same tab so Betano's tab-scoped sessionStorage/auth state is
  // preserved. The settled view initializes the API context required by the
  // settled-history endpoint; open bets are still fetched separately below.
  const historyTab = await chrome.tabs.update(source.id, {
    url: settledHistoryUrl(origin),
  });
  if (!historyTab || historyTab.id === undefined) throw new Error("Não foi possível abrir o histórico do Betano.");
  await waitForTabComplete(historyTab.id);
  return { tab: historyTab, restoreUrl, created: true };
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
    chrome.tabs.sendMessage(tabId, {
      type: "BETANO_FETCH_PAGE",
      requestId,
      params,
      tokens: betanoSessionTokens,
    })
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
    result: selection.result || null,
  })));
}

function needsUpdate(existing, incoming, accountId) {
  // Cashouts são sempre reenviados. Versões antigas do mapper guardavam
  // FullCashout como POR_LIQUIDAR; forçar o PUT garante a correção mesmo que
  // a comparação local esteja a olhar para dados normalizados/stale.
  // Uma conta escolhida também "preenche" apostas antigas ainda sem conta.
  return (Boolean(accountId) && !existing.account_id) ||
    incoming?.metadata?.isCashout === true ||
    existing.status !== incoming.status ||
    Number(existing.stake) !== Number(incoming.stake) ||
    Number(existing.odd) !== Number(incoming.odd) ||
    Number(existing.final_return) !== Number(incoming.finalReturn) ||
    Number(existing.net_profit) !== Number(incoming.netProfit) ||
    Boolean(existing.is_freebet) !== Boolean(incoming.isFreebet) ||
    String(existing.freebet_type || "") !== String(incoming.freebetType || "") ||
    selectionsSignature(existing.selections) !== selectionsSignature(incoming.selections);
}

function betPayload(bet, accountId) {
  return {
    type: bet.type,
    status: bet.status,
    stake: bet.stake,
    odd: bet.odd,
    isFreebet: bet.isFreebet,
    freebetType: bet.freebetType,
    potentialReturn: bet.potentialReturn,
    finalReturn: bet.finalReturn,
    netProfit: bet.netProfit,
    bookmaker: bet.bookmaker,
    accountId: accountId || null,
    dateTime: bet.dateTime,
    notes: bet.notes,
    origin: bet.origin,
    selections: bet.selections,
    comment: bet.comment,
    tags: bet.tags,
    metadata: bet.metadata,
  };
}

async function postBulk(bets, cfg, accountId) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.bettrackrToken}` },
    body: JSON.stringify({ bets: bets.map((bet) => betPayload(bet, accountId)) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `BetTrackr respondeu ${res.status} ao importar.`);
  return Array.isArray(data.bets) ? data.bets.length : bets.length;
}

async function updateBet(existing, incoming, cfg, accountId) {
  // Uma aposta já associada a uma conta mantém-na; só as "sem conta" herdam
  // a conta escolhida para esta importação.
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/${encodeURIComponent(existing.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.bettrackrToken}` },
    body: JSON.stringify(betPayload(incoming, existing.account_id || accountId)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `BetTrackr respondeu ${res.status} ao atualizar.`);
}

async function persistMapped(mapped, unsupported, source, cfg, accountId) {
  const existing = await fetchExistingBets(cfg);
  const fresh = [];
  const updates = [];
  let skipped = 0;
  for (const bet of mapped) {
    const key = importKey(bet);
    const old = key && existing.get(key);
    if (!old) fresh.push(bet);
    else if (needsUpdate(old, bet, accountId)) updates.push({ old, bet });
    else skipped++;
  }

  let imported = 0;
  const chunkSize = 500;
  for (let i = 0; i < fresh.length; i += chunkSize) {
    imported += await postBulk(fresh.slice(i, i + chunkSize), cfg, accountId);
    progress(`A importar ${source}: ${Math.min(i + chunkSize, fresh.length)}/${fresh.length}…`);
  }
  let updated = 0;
  for (const pair of updates) {
    await updateBet(pair.old, pair.bet, cfg, accountId);
    updated++;
    progress(`A atualizar ${source}: ${updated}/${updates.length}…`);
  }
  const cashouts = mapped.filter((bet) => bet?.metadata?.isCashout === true).length;
  return { fetched: mapped.length, imported, updated, skipped, unsupported, cashouts };
}

async function runBetclicImport(cfg, accountId) {
  if (!cfg.betclicToken) throw new Error("Sessão Betclic não detetada.");
  progress("A obter apostas do Betclic…");
  const mapped = await fetchBetclicBetsForImport(cfg);
  return persistMapped(mapped, 0, "Betclic", cfg, accountId);
}

async function runBetanoImport(cfg, accountId, opts = {}) {
  const ensured = await ensureBetanoHistoryTab(opts);
  if (!ensured) return { skipped: true }; // auto-import sem histórico aberto
  const { tab, restoreUrl, created } = ensured;
  try {
    if (!betanoSessionTokens) await waitForBetanoTokens();
    progress("A obter apostas do Betano…");
    const { open, settled } = await fetchBetanoBets(tab.id);
    const byRef = new Map();
    for (const bet of settled) byRef.set(betanoRef(bet), bet);
    for (const bet of open) if (!byRef.has(betanoRef(bet))) byRef.set(betanoRef(bet), bet);
    byRef.delete(null);
    const mapped = mapBetanoBets([...byRef.values()]);
    return persistMapped(mapped.bets, mapped.unsupported, "Betano", cfg, accountId);
  } finally {
    if (created && tab.id !== undefined && restoreUrl) {
      await chrome.tabs.update(tab.id, { url: restoreUrl }).catch(() => {});
    }
  }
}

async function runImportSources(source, cfg, accountIds, opts = {}) {
  if (!cfg.bettrackrToken) throw new Error("Sem sessão BetTrackr. Abre a app e inicia sessão.");
  const sources = source === "all" ? ["betclic", "betano"] : [source];
  const chosenAccounts = accountIds && typeof accountIds === "object" ? accountIds : {};
  const results = {};
  for (const current of sources) {
    const accountId = typeof chosenAccounts[current] === "string" && chosenAccounts[current]
      ? chosenAccounts[current]
      : null;
    try {
      results[current] = current === "betano"
        ? { ok: true, ...(await runBetanoImport(cfg, accountId, opts)) }
        : { ok: true, ...(await runBetclicImport(cfg, accountId)) };
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
    for (const key of ["fetched", "imported", "updated", "skipped", "unsupported", "cashouts"]) sum[key] += result[key] || 0;
    return sum;
  }, { fetched: 0, imported: 0, updated: 0, skipped: 0, unsupported: 0, cashouts: 0 });
  return { ok: true, sourceResults: results, ...totals };
}

async function runImport(source, sessionSnapshot, accountIds, opts = {}) {
  const cfg = await configForImport(sessionSnapshot);
  return runAfterBettrackrVerification({
    token: cfg.bettrackrToken,
    baseUrl: cfg.bettrackrBase,
    expectedUserId: cfg.bettrackrUserId,
  }, async (identity) => {
    await chrome.storage.local.set({ bettrackrUserId: identity.userId });
    return runImportSources(source, cfg, accountIds, opts);
  });
}

async function extensionStatus() {
  const [stored, tabs] = await Promise.all([
    chrome.storage.local.get(["betclicToken", "bettrackrToken", "bettrackrBase", "bettrackrUser", "autoImport"]),
    chrome.tabs.query({ url: ["https://www.betano.pt/*", "https://betano.pt/*"] }),
  ]);
  return {
    betclic: Boolean(stored.betclicToken),
    // A Betano tab enables the action. The page bridge reports a useful
    // authentication error if the user is not logged in or needs a reload.
    betano: tabs.length > 0,
    bettrackr: Boolean(stored.bettrackrToken),
    bettrackrBase: stored.bettrackrBase || DEFAULT_BETTRACKR_BASE,
    bettrackrUser: stored.bettrackrUser || null,
    autoImport: stored.autoImport === true,
  };
}

// ============================================================
// Login BetTrackr direto na extensão (E3). Deixa a extensão funcionar sem o
// site do BetTrackr aberto. Guardamos APENAS o JWT devolvido (expira em 7
// dias) — nunca a password. HTTPS via host_permissions.
// ============================================================
async function bettrackrLogin(email, password, base) {
  const origin = base || DEFAULT_BETTRACKR_BASE;
  const res = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Não foi possível iniciar sessão no BetTrackr.");
  }
  await chrome.storage.local.set({
    bettrackrToken: data.token,
    bettrackrBase: origin,
    bettrackrUser: data.user && data.user.username ? String(data.user.username) : null,
  });
  return { ok: true, user: data.user || null };
}

async function bettrackrLogout() {
  await chrome.storage.local.remove(["bettrackrToken", "bettrackrUser"]);
  return { ok: true };
}

// ============================================================
// Auto-import (E3) — opt-in, desligado por defeito. Disparado pela captura do
// token de uma casa (Betclic guarda o token; Betano envia BETANO_SESSION).
// Debounce por casa para não repetir a cada navegação/refresh.
// ============================================================
const AUTO_IMPORT_DEBOUNCE_MS = 10 * 60 * 1000; // 10 min por casa
let autoImportRunning = false;

async function flashBadge(text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color });
    await chrome.action.setBadgeText({ text });
    setTimeout(() => { chrome.action.setBadgeText({ text: "" }).catch(() => {}); }, 8000);
  } catch (_) {}
}

async function maybeAutoImport(source) {
  const stored = await chrome.storage.local.get([
    "autoImport", "bettrackrToken", "importAccountChoices", "autoImportLast",
  ]);
  if (stored.autoImport !== true || !stored.bettrackrToken) return;

  const now = Date.now();
  const last = stored.autoImportLast && typeof stored.autoImportLast === "object" ? stored.autoImportLast : {};
  if (last[source] && now - last[source] < AUTO_IMPORT_DEBOUNCE_MS) return;
  if (autoImportRunning) return;
  autoImportRunning = true;
  // Marca já o timestamp para evitar corridas entre gatilhos próximos.
  await chrome.storage.local.set({ autoImportLast: { ...last, [source]: now } });

  const accountIds = stored.importAccountChoices && typeof stored.importAccountChoices === "object"
    ? stored.importAccountChoices
    : {};
  try {
    // Sem snapshot da app: o auto-import é disparado pela sessão da casa, por
    // isso a sessão BetTrackr vem de uma tab aberta ou do storage.
    const result = await runImport(source, null, accountIds, { auto: true });
    const changed = (result.imported || 0) + (result.updated || 0);
    if (changed > 0) await flashBadge(String(changed), "#16a34a");
  } catch (_) {
    await flashBadge("!", "#dc2626");
  } finally {
    autoImportRunning = false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "BETANO_SESSION") {
    const tokens = msg.tokens;
    if (tokens && tokens.token1 && tokens.token2) {
      betanoSessionTokens = {
        token1: String(tokens.token1),
        token2: String(tokens.token2),
        seontoken: tokens.seontoken ? String(tokens.seontoken) : "",
        apiOrigin: tokens.apiOrigin === "https://betano.pt" || tokens.apiOrigin === "https://www.betano.pt"
          ? tokens.apiOrigin
          : null,
      };
      for (const waiter of betanoTokenWaiters) {
        clearTimeout(waiter.timer);
        waiter.resolve();
      }
      betanoTokenWaiters.clear();
      // Sessão Betano capturada -> tenta auto-import (se ligado e com histórico
      // já aberto; caso contrário salta sem sequestrar o separador).
      maybeAutoImport("betano");
    }
    return false;
  }
  if (msg && msg.type === "AUTO_IMPORT_HINT") {
    // Enviado pelos content scripts das casas quando capturam um token novo.
    const source = msg.source === "betclic" || msg.source === "betano" ? msg.source : null;
    if (source) maybeAutoImport(source);
    return false;
  }
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
    runImport(source, msg.bettrackrSession, msg.accountIds)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "LOGIN") {
    bettrackrLogin(String(msg.email || ""), String(msg.password || ""), msg.base)
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "LOGOUT") {
    bettrackrLogout()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  if (msg && msg.type === "SET_AUTO_IMPORT") {
    chrome.storage.local.set({ autoImport: msg.enabled === true })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error && error.message || error) }));
    return true;
  }
  return false;
});

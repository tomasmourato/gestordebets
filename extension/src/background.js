// background.js — service worker (ES module). Orquestra a importação:
// 1. usa o token capturado do Betclic para paginar /me/bets/ended e /ongoing
// 2. mapeia as apostas para o modelo do BetTrackr
// 3. deduplica contra as apostas já importadas (metadata.ref)
// 4. envia as novas para POST /api/bets/bulk
//
// Os fetch partem do service worker com host_permissions, por isso não estão
// sujeitos ao CORS das páginas — conseguem ler os headers (X-Total-Count) e o
// corpo de begmedia e do BetTrackr.

import { mapBets, betclicRef } from "./mapper.js";

const PAGE_SIZE = 20;
const DEFAULT_BETTRACKR_BASE = "https://gestordebets.vercel.app";

function progress(text) {
  chrome.runtime.sendMessage({ type: "PROGRESS", text }).catch(() => {});
}

async function getConfig() {
  const s = await chrome.storage.local.get([
    "betclicToken",
    "betclicApiBase",
    "bettrackrToken",
    "bettrackrBase",
  ]);
  return {
    betclicToken: s.betclicToken || null,
    betclicApiBase: s.betclicApiBase || "https://betting.begmedia.pt",
    bettrackrToken: s.bettrackrToken || null,
    bettrackrBase: s.bettrackrBase || DEFAULT_BETTRACKR_BASE,
  };
}

// Pagina um dos endpoints de apostas do Betclic até esgotar X-Total-Count.
async function fetchBetclicBets(kind, cfg) {
  const out = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url =
      `${cfg.betclicApiBase}/api/v2/me/bets/${kind}` +
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
      throw new Error(
        "Sessão Betclic expirada. Abre betclic.pt, entra e recarrega a página das tuas apostas."
      );
    }
    if (!res.ok) {
      throw new Error(`Betclic respondeu ${res.status} ao obter apostas (${kind}).`);
    }

    const totalHeader = Number(res.headers.get("X-Total-Count"));
    if (Number.isFinite(totalHeader)) total = totalHeader;

    const data = await res.json().catch(() => ({}));
    const bets = Array.isArray(data.bets) ? data.bets : [];
    out.push(...bets);

    progress(`A ler apostas do Betclic (${kind}): ${out.length}${Number.isFinite(total) ? "/" + total : ""}…`);

    if (bets.length === 0) break; // proteção contra loop infinito
    offset += PAGE_SIZE;
    if (offset > 5000) break; // limite de segurança
  }

  return out;
}

// Lê as apostas já existentes no BetTrackr para não duplicar.
async function fetchExistingRefs(cfg) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets`, {
    headers: { Authorization: `Bearer ${cfg.bettrackrToken}` },
  });
  if (res.status === 401) {
    throw new Error("Sessão BetTrackr expirada. Abre a app e inicia sessão novamente.");
  }
  if (!res.ok) {
    throw new Error(`BetTrackr respondeu ${res.status} ao listar apostas.`);
  }
  const data = await res.json().catch(() => ({}));
  const refs = new Set();
  for (const b of data.bets || []) {
    const ref = b && b.metadata && b.metadata.ref;
    if (ref) refs.add(String(ref));
  }
  return refs;
}

async function postBulk(bets, cfg) {
  const res = await fetch(`${cfg.bettrackrBase}/api/bets/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.bettrackrToken}`,
    },
    body: JSON.stringify({ bets }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `BetTrackr respondeu ${res.status} ao importar.`);
  }
  return Array.isArray(data.bets) ? data.bets.length : bets.length;
}

async function runImport() {
  const cfg = await getConfig();

  if (!cfg.betclicToken) {
    throw new Error("Token do Betclic ainda não capturado. Abre betclic.pt e vai a 'As minhas apostas'.");
  }
  if (!cfg.bettrackrToken) {
    throw new Error("Sem sessão BetTrackr. Abre a app e inicia sessão pelo menos uma vez.");
  }

  progress("A obter apostas do Betclic…");
  const [ended, ongoing] = await Promise.all([
    fetchBetclicBets("ended", cfg),
    fetchBetclicBets("ongoing", cfg),
  ]);

  // Uma mesma bet_reference pode aparecer em ambos os endpoints numa transição;
  // mantemos a versão 'ended' (liquidada) por ser a definitiva.
  const byRef = new Map();
  for (const b of ongoing) byRef.set(betclicRef(b), b);
  for (const b of ended) byRef.set(betclicRef(b), b); // ended sobrepõe ongoing
  byRef.delete(null);

  const mapped = mapBets([...byRef.values()]);

  progress("A verificar duplicados…");
  const existing = await fetchExistingRefs(cfg);
  const fresh = mapped.filter((b) => b.metadata.ref && !existing.has(String(b.metadata.ref)));

  if (fresh.length === 0) {
    return { ok: true, fetched: mapped.length, imported: 0, skipped: mapped.length };
  }

  progress(`A importar ${fresh.length} novas apostas…`);
  let imported = 0;
  const CHUNK = 500;
  for (let i = 0; i < fresh.length; i += CHUNK) {
    imported += await postBulk(fresh.slice(i, i + CHUNK), cfg);
  }

  return { ok: true, fetched: mapped.length, imported, skipped: mapped.length - fresh.length };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "IMPORT") {
    runImport()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: String((err && err.message) || err) }));
    return true; // resposta assíncrona
  }
  return false;
});

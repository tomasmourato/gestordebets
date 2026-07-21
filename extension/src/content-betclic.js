// content-betclic.js — corre no ISOLATED world de betclic.pt. Recebe o token
// capturado pelo inject.js (MAIN world) via postMessage e guarda-o no
// armazenamento da extensão para o service worker o usar.

// ------------------------------------------------------------
// Username da conta Betclic a partir do estado SSR embebido no documento.
// O betclic.pt injeta a resposta do /me no HTML inicial (transfer-state do
// Angular), algo como ...,"username":"ronkzinho","identity":{...}. É a fonte
// mais fiável (sem fetch, sem CORS). Lemos assim que o DOM está pronto — antes
// da hidratação poder remover o script de estado.
// ------------------------------------------------------------
// Sessão betclic ativa? A betclic mostra um link para /login ("Aceder") apenas
// quando não há sessão. O BC-TOKEN existe também para visitantes (anónimo) e o
// CacheServiceLogin persiste após logout, por isso o link /login é o sinal
// fiável. (Chamado após DOMContentLoaded, com o cabeçalho já renderizado.)
function betclicLoggedIn() {
  try { return !document.querySelector('a[href*="/login"]'); } catch (_) { return true; }
}

function extractBetclicUsername() {
  const specific = /"username"\s*:\s*"([^"\\]{1,64})"\s*,\s*"identity"/;
  const generic = /"username"\s*:\s*"([^"\\]{1,64})"/;

  // 1) CacheServiceLogin: username da sessão ATUAL (runtime) — atualiza logo no
  //    login, sem navegar. É a fonte preferida.
  try {
    const raw = window.localStorage.getItem("CacheServiceLogin");
    if (raw) {
      const v = JSON.parse(raw);
      if (v && typeof v.value === "string" && v.value.trim()) return v.value.trim();
    }
  } catch (_) {}

  // 2) Estado SSR embebido (congelado no load) — fallback.
  try {
    const scripts = document.querySelectorAll('script[type="application/json"], script[id*="state"]');
    for (const s of scripts) {
      const m = (s.textContent || "").match(specific) || (s.textContent || "").match(generic);
      if (m) return m[1];
    }
    const html = document.documentElement ? document.documentElement.innerHTML : "";
    const m = html.match(specific) || html.match(generic);
    if (m) return m[1];
  } catch (_) {}
  return null;
}

// Guarda contra "Extension context invalidated": ao recarregar a extensão, o
// content script antigo perde o contexto e qualquer chamada chrome.* atira.
function extensionAlive() {
  try { return Boolean(chrome.runtime && chrome.runtime.id); } catch (_) { return false; }
}

function captureBetclicUsername() {
  if (!extensionAlive()) return;
  try {
    // Sem sessão -> limpa o username em cache para o popup selecionar "sem conta".
    if (!betclicLoggedIn()) {
      chrome.storage.local.remove("betclicUsername");
      return;
    }
    const username = extractBetclicUsername();
    if (username) chrome.storage.local.set({ betclicUsername: username });
  } catch (_) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", captureBetclicUsername, { once: true });
} else {
  captureBetclicUsername();
}
// Rede de segurança: o bundle pode preencher/remover o estado um pouco depois.
setTimeout(captureBetclicUsername, 1500);

window.addEventListener("message", (event) => {
  // Só aceitamos mensagens desta própria janela e com o nosso marcador.
  if (event.source !== window) return;
  // Extensão recarregada -> contexto inválido; sair evita "Extension context
  // invalidated" ao tocar em chrome.*.
  if (!extensionAlive()) return;
  const data = event.data;
  if (!data || data.source !== "bettrackr-betclic-bridge") return;

  try {
    // Username captado passivamente de um /me que a página fez -> guarda para o
    // popup pré-selecionar a conta e o import encaminhar automaticamente.
    if (data.identity) {
      chrome.storage.local.set({ betclicUsername: String(data.identity) });
      return;
    }

    if (!data.token) return;

    chrome.storage.local.set({
      betclicToken: data.token,
      betclicApiBase: data.apiBase || "https://betting.begmedia.pt",
      betclicCapturedAt: Date.now(),
    }, () => {
      // Token novo capturado -> pede ao service worker para tentar auto-import
      // (só corre se o utilizador tiver ligado a opção; caso contrário é ignorado).
      try { chrome.runtime.sendMessage({ type: "AUTO_IMPORT_HINT", source: "betclic" }).catch(() => {}); } catch (_) {}
    });
  } catch (_) {}
});

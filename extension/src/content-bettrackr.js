// content-bettrackr.js — corre no site do BetTrackr. Faz duas coisas:
//
// 1. Lê o token JWT que o app guarda em localStorage ("gestordebets_token") e a
//    origem atual, para o service worker poder chamar /api/bets/bulk.
// 2. Serve de ponte entre a página e a extensão: anuncia que a extensão está
//    presente e deixa o app disparar a importação com um botão (sem precisar do
//    ID da extensão nem de a publicar).

(function () {
  const KEY = "gestordebets_token";
  const APP = "bettrackr-app"; // mensagens vindas da página
  const EXT = "bettrackr-ext"; // mensagens enviadas pela extensão
  const version = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || "0";

  // --- token sync ---
  function syncToken() {
    try {
      const token = localStorage.getItem(KEY);
      if (token) {
        chrome.storage.local.set({ bettrackrToken: token, bettrackrBase: location.origin });
      } else {
        chrome.storage.local.remove("bettrackrToken");
      }
    } catch (_) {}
  }

  syncToken();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) syncToken();
  });

  // --- ponte página <-> extensão ---
  function toPage(payload) {
    window.postMessage({ source: EXT, ...payload }, location.origin);
  }

  // Anuncia a presença assim que o content script carrega (o app pode já estar à
  // escuta) e responde a PING para quem carregar depois.
  toPage({ type: "PONG", version });

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== APP) return;

    if (data.type === "PING") {
      toPage({ type: "PONG", version });
      return;
    }

    if (data.type === "IMPORT") {
      chrome.runtime.sendMessage({ type: "IMPORT" }, (result) => {
        if (chrome.runtime.lastError) {
          toPage({ type: "RESULT", ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        toPage({ type: "RESULT", ...(result || { ok: false, error: "Sem resposta da extensão." }) });
      });
    }
  });

  // Reencaminha o progresso emitido pelo service worker durante a importação.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "PROGRESS") toPage({ type: "PROGRESS", text: msg.text });
  });
})();

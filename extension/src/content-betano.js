// Isolated-world bridge for Betano. It forwards page-context API calls to the
// service worker without exposing cookies or request tokens to storage.
(function () {
  const MARK = "bettrackr-betano-bridge";

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== MARK) return;

    if (data.type === "SESSION") {
      // Do not use chrome.storage.session here: Chrome content scripts do not
      // expose that area by default. The service worker keeps the short-lived
      // API tokens in memory and the popup detects Betano tabs directly.
      chrome.runtime.sendMessage({ type: "BETANO_SESSION", tokens: data.tokens }).catch(() => {});
    }
    if (data.type === "FETCH_RESULT") {
      chrome.runtime.sendMessage({
        type: "BETANO_PAGE_RESULT",
        requestId: data.requestId,
        ok: data.ok,
        status: data.status,
        payload: data.payload,
        error: data.error,
      }).catch(() => {});
    }
    if (data.type === "IDENTITY") {
      // Identidade lida pelo inject-betano.js no MAIN world (o content script
      // isolado não vê variáveis JS nem faz o fetch com os cookies da página):
      // username=customerCode (/api/balance), customerId/email de initial_state.
      // Guardamos para o service worker encaminhar imports mesmo sem uma tab
      // aberta na altura do import (mesmo padrão do content-betclic.js).
      if (!extensionAlive()) return;
      try {
        if (data.loggedIn === false) {
          chrome.storage.local.remove(["betanoUsername", "betanoIdentity"]);
          return;
        }
        // Preferimos o username (customerCode); caímos para customerId/email só
        // quando o /api/balance ainda não respondeu.
        const primary = data.username || data.customerId || data.email;
        if (primary) {
          chrome.storage.local.set({
            betanoUsername: String(primary),
            betanoIdentity: {
              username: data.username || null,
              customerId: data.customerId || null,
              email: data.email || null,
            },
          });
        }
      } catch (_) {}
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "BETANO_FETCH_PAGE") return;
    window.postMessage({
      source: MARK,
      type: "FETCH_PAGE",
      requestId: message.requestId,
      params: message.params,
      tokens: message.tokens,
    }, location.origin);
  });

  // Guarda contra "Extension context invalidated": ao recarregar a extensão o
  // content script antigo perde o contexto e qualquer chamada chrome.* atira.
  function extensionAlive() {
    try { return Boolean(chrome.runtime && chrome.runtime.id); } catch (_) { return false; }
  }
})();

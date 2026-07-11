// inject.js — corre no MAIN world de betclic.pt (mesma execução que o código
// da própria página) e a partir de document_start, para conseguir interceptar
// os pedidos que a página faz à API begmedia.
//
// Não lê passwords nem nada digitado: apenas captura o header Authorization que
// a página já envia para betting.begmedia.pt, para o reutilizar na importação.
// O token é reenviado para o content script (ISOLATED world) via postMessage.

(function () {
  const MARK = "bettrackr-betclic-bridge";
  let lastToken = null;

  function report(token, url) {
    if (!token || token === lastToken) return;
    lastToken = token;
    let apiBase = "https://betting.begmedia.pt";
    try {
      apiBase = new URL(url, location.href).origin;
    } catch (_) {}
    window.postMessage({ source: MARK, token, apiBase }, location.origin);
  }

  // Só captamos a partir do pedido de apostas em si (/me/bets): garante que o
  // token e o host (betting/apif.begmedia.pt — o Betclic alterna entre eles)
  // vêm da API certa, e não dos hosts de analytics/sync (.begmedia.com).
  function looksLikeBetsApi(url) {
    return typeof url === "string" && url.includes("begmedia") && url.includes("/me/bets");
  }

  // --- fetch ---
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      const url = typeof input === "string" ? input : input && input.url;
      let auth = null;
      if (init && init.headers) auth = new Headers(init.headers).get("Authorization");
      if (!auth && input && input.headers && typeof input.headers.get === "function") {
        auth = input.headers.get("Authorization");
      }
      if (looksLikeBetsApi(url) && auth && auth.startsWith("Bearer ")) {
        report(auth.slice(7), url);
      }
    } catch (_) {}
    return originalFetch.apply(this, arguments);
  };

  // --- XMLHttpRequest ---
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__btkUrl = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
    try {
      if (
        key &&
        key.toLowerCase() === "authorization" &&
        typeof value === "string" &&
        value.startsWith("Bearer ") &&
        looksLikeBetsApi(String(this.__btkUrl))
      ) {
        report(value.slice(7), this.__btkUrl);
      }
    } catch (_) {}
    return originalSetHeader.apply(this, arguments);
  };
})();

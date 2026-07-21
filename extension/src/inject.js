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

  // O x-bg-fingerprint acompanha todos os pedidos begmedia da app. O endpoint
  // de identidade (/api/v2/me) pode exigi-lo, por isso guardamo-lo na window
  // (MAIN world partilhado) para o probe de identidade o reutilizar.
  function rememberFingerprint(headers) {
    try {
      const fp = headers && typeof headers.get === "function" ? headers.get("X-Bg-Fingerprint") : null;
      if (fp) window.__btkBetclicFingerprint = fp;
    } catch (_) {}
  }

  // /api/v2/me (e NÃO /api/v2/me/bets/...) é o endpoint de identidade.
  function looksLikeIdentityApi(url) {
    return typeof url === "string" && url.includes("begmedia") && /\/api\/v\d+\/me(\?|#|$)/.test(url);
  }

  // Lê passivamente o username da RESPOSTA de um /me que a própria página faz —
  // o pedido mais fiável possível (Origin/cookies/token todos corretos). Envia
  // o username para o content script guardar; nada sensível é lido.
  function sniffIdentity(url, promise) {
    if (!looksLikeIdentityApi(url) || !promise || typeof promise.then !== "function") return;
    promise.then((res) => {
      try {
        res.clone().json().then((data) => {
          const username = data && typeof data.username === "string" ? data.username.trim() : "";
          if (username) window.postMessage({ source: MARK, identity: username }, location.origin);
        }).catch(() => {});
      } catch (_) {}
    }).catch(() => {});
  }

  // --- fetch ---
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let url;
    try {
      url = typeof input === "string" ? input : input && input.url;
      let headers = null;
      if (init && init.headers) headers = new Headers(init.headers);
      else if (input && input.headers && typeof input.headers.get === "function") headers = input.headers;
      if (headers && typeof url === "string" && url.includes("begmedia")) {
        rememberFingerprint(headers);
        const auth = headers.get("Authorization");
        if (looksLikeBetsApi(url) && auth && auth.startsWith("Bearer ")) {
          report(auth.slice(7), url);
        }
      }
    } catch (_) {}
    const promise = originalFetch.apply(this, arguments);
    try { sniffIdentity(url, promise); } catch (_) {}
    return promise;
  };

  // --- XMLHttpRequest ---
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__btkUrl = url;
    // Se a página pedir /me por XHR, lê o username da resposta (passivo/fiável).
    if (looksLikeIdentityApi(String(url))) {
      try {
        this.addEventListener("load", function () {
          try {
            const data = JSON.parse(this.responseText);
            const username = data && typeof data.username === "string" ? data.username.trim() : "";
            if (username) window.postMessage({ source: MARK, identity: username }, location.origin);
          } catch (_) {}
        });
      } catch (_) {}
    }
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
    try {
      const lower = key && key.toLowerCase();
      if (lower === "x-bg-fingerprint" && typeof value === "string" && value) {
        window.__btkBetclicFingerprint = value;
      }
      if (
        lower === "authorization" &&
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

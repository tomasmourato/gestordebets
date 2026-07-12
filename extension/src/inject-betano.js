// Runs in Betano's MAIN world. It keeps the short-lived request tokens in
// memory and executes import requests with the page's own authenticated
// cookies. Tokens and cookies never enter extension storage.
(function () {
  const MARK = "bettrackr-betano-bridge";
  const HISTORY_PATH = "/myaccount/api/ma/bet/bet-history-v3";
  let requestTokens = {};

  function isBetanoRequest(url) {
    try {
      const parsed = new URL(url, location.href);
      // Capture from any same-origin request. Betano can render the history
      // in a separate browser popup/iframe while the main page owns the
      // session headers needed for the import.
      return parsed.origin === location.origin;
    } catch (_) {
      return false;
    }
  }

  function headersToObject(headers) {
    const result = {};
    try {
      new Headers(headers || {}).forEach((value, key) => {
        const normalized = key.toLowerCase();
        if (normalized === "token1" || normalized === "token2" || normalized === "seontoken") {
          result[normalized] = value;
        }
      });
    } catch (_) {}
    return result;
  }

  function rememberHeaders(headers, url) {
    if (!isBetanoRequest(url)) return;
    const captured = headersToObject(headers);
    if (captured.token1) requestTokens.token1 = captured.token1;
    if (captured.token2) requestTokens.token2 = captured.token2;
    if (captured.seontoken !== undefined) requestTokens.seontoken = captured.seontoken;
    if (requestTokens.token1 && requestTokens.token2) {
      window.postMessage({
        source: MARK,
        type: "SESSION",
        // These values remain in page/extension memory only. They are never
        // written to chrome.storage or included in the repository.
        tokens: { ...requestTokens },
      }, location.origin);
    }
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      const url = typeof input === "string" ? input : input && input.url;
      rememberHeaders(init && init.headers, url);
      if (input && input.headers && typeof input.headers.get === "function") {
        rememberHeaders(input.headers, url);
      }
    } catch (_) {}
    return originalFetch.apply(this, arguments);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__btkBetanoUrl = url;
    return originalOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
    try {
      if (key && typeof value === "string") {
        const headers = {};
        headers[key] = value;
        rememberHeaders(headers, this.__btkBetanoUrl);
      }
    } catch (_) {}
    return originalSetHeader.apply(this, arguments);
  };

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== MARK || data.type !== "FETCH_PAGE") return;

    const requestId = data.requestId;
    try {
      if (data.tokens && data.tokens.token1 && data.tokens.token2) {
        requestTokens = {
          token1: String(data.tokens.token1),
          token2: String(data.tokens.token2),
          seontoken: data.tokens.seontoken ? String(data.tokens.seontoken) : "",
        };
      }
      if (!requestTokens.token1 || !requestTokens.token2) {
        throw new Error("Sessão Betano ainda não detetada. Abre ou recarrega betano.pt.");
      }
      const params = data.params || {};
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
      }
      const url = `${location.origin}${HISTORY_PATH}?${query}`;
      const response = await originalFetch(url, {
        credentials: "include",
        headers: {
          Accept: "application/json, text/plain, */*",
          token1: requestTokens.token1,
          token2: requestTokens.token2,
          seontoken: requestTokens.seontoken || "",
        },
      });
      const text = await response.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch (_) {}
      window.postMessage({
        source: MARK,
        type: "FETCH_RESULT",
        requestId,
        ok: response.ok,
        status: response.status,
        payload,
      }, location.origin);
    } catch (error) {
      window.postMessage({
        source: MARK,
        type: "FETCH_RESULT",
        requestId,
        ok: false,
        status: 0,
        error: String(error && error.message || error),
      }, location.origin);
    }
  });
})();

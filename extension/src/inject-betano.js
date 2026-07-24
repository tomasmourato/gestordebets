// Runs in Betano's MAIN world. It keeps the short-lived request tokens in
// memory and executes import requests with the page's own authenticated
// cookies. Tokens and cookies never enter extension storage.
(function () {
  const MARK = "bettrackr-betano-bridge";
  const HISTORY_PATH = "/myaccount/api/ma/bet/bet-history-v3";
  const BETANO_ORIGINS = new Set(["https://www.betano.pt", "https://betano.pt"]);
  let requestTokens = { apiOrigin: location.origin };

  function isBetanoRequest(url) {
    try {
      const parsed = new URL(url, location.href);
      // Capture from either Betano hostname. Betano can render the history in
      // a separate browser popup/iframe while the main page owns the session.
      return BETANO_ORIGINS.has(parsed.origin);
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
    try { requestTokens.apiOrigin = new URL(url, location.href).origin; } catch (_) {}
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

  // ---- Identidade da conta --------------------------------------------------
  // A Betano TEM um username/handle real — o customerCode (ex.: "ronkzinho") —
  // mas ele NÃO está no estado embebido (window["initial_state"] só tem
  // customerId + email). A única fonte é GET /api/balance -> data.customerCode,
  // obtido só com os cookies da sessão. O customerId (initial_state /
  // sessiontimer) e o email ficam como identificadores secundários. Fundimos os
  // campos num só estado e reencaminhamos para o content-betano.js guardar; o
  // username, uma vez lido, nunca é rebaixado por uma leitura só de customerId.
  const identity = { username: null, customerId: null, email: null };
  let lastIdentityKey = null;

  function emitIdentity(loggedIn) {
    if (loggedIn === false) {
      if (lastIdentityKey === "OUT") return;
      lastIdentityKey = "OUT";
      identity.username = identity.customerId = identity.email = null;
      window.postMessage({
        source: MARK, type: "IDENTITY", loggedIn: false,
        username: null, customerId: null, email: null,
      }, location.origin);
      return;
    }
    const key = `${identity.username || ""}|${identity.customerId || ""}|${identity.email || ""}`;
    if (key === "||" || key === lastIdentityKey) return; // sem identidade / repetida
    lastIdentityKey = key;
    window.postMessage({
      source: MARK, type: "IDENTITY", loggedIn: true,
      username: identity.username, customerId: identity.customerId, email: identity.email,
    }, location.origin);
  }

  // Funde campos novos no estado. O username (customerCode) uma vez definido não
  // é rebaixado por uma leitura posterior sem username.
  function updateIdentity(patch) {
    if (patch.loggedIn === false) { emitIdentity(false); return; }
    let changed = false;
    for (const k of ["username", "customerId", "email"]) {
      const v = patch[k];
      if (v && String(v) !== identity[k]) { identity[k] = String(v); changed = true; }
    }
    if (changed) emitIdentity(true);
  }

  function readInitialStateIdentity() {
    try {
      const user = window["initial_state"] && window["initial_state"].user;
      if (!user) return false;
      if (user.isLoggedIn === false) { updateIdentity({ loggedIn: false }); return true; }
      const info = user.info || {};
      const patch = {};
      if (info.customerId != null) patch.customerId = String(info.customerId);
      if (typeof info.email === "string") patch.email = info.email;
      if (Object.keys(patch).length) { updateIdentity(patch); return true; }
      return false;
    } catch (_) { return false; }
  }
  // O username real (customerCode) só vem de /api/balance. Fetch FRESCO (cookies)
  // => apanha a conta atual mesmo após trocar de conta sem recarregar. Usa o
  // fetch ORIGINAL (definido mais abaixo); só é chamada depois disso.
  function fetchUsernameFromBalance() {
    try {
      originalFetch("/api/balance?_=" + Date.now(), {
        credentials: "include",
        headers: { Accept: "application/json, text/plain, */*" },
      }).then((r) => {
        if (r && (r.status === 401 || r.status === 403)) { updateIdentity({ loggedIn: false }); return ""; }
        return r && r.ok ? r.text() : "";
      }).then((t) => {
        const m = t && t.match(/"customerCode"\s*:\s*"([^"\\]{1,64})"/);
        if (m) updateIdentity({ username: m[1] });
      }).catch(() => {});
    } catch (_) {}
  }
  // customerId de reserva, para quando o initial_state já não existe.
  function fetchCustomerIdFromApi() {
    try {
      originalFetch("/api/user/sessiontimer/status", {
        credentials: "include",
        headers: { Accept: "application/json, text/plain, */*" },
      }).then((r) => (r && r.ok ? r.text() : "")).then((t) => {
        const m = t && t.match(/"customerId"\s*:\s*(\d{3,})/);
        if (m) updateIdentity({ customerId: m[1] });
      }).catch(() => {});
    } catch (_) {}
  }

  // Tap às respostas /api/balance (customerCode = username) e /api/user/*
  // (customerId): trazem a identidade em runtime, por isso apanham a troca de
  // conta mesmo sem recarregar. O email NÃO é extraído daqui (evita apanhar o
  // email mascarado que a Betano devolve em alguns payloads); vem do
  // initial_state.
  function maybeCaptureIdentityFromResponse(url, response) {
    try {
      const p = new URL(url, location.href).pathname;
      if (!/^\/api\/(user\/|balance)/.test(p)) return;
      response.clone().text().then((t) => {
        if (!t) return;
        const cc = t.match(/"customerCode"\s*:\s*"([^"\\]{1,64})"/);
        if (cc) updateIdentity({ username: cc[1] });
        const cid = t.match(/"customerId"\s*:\s*(\d{3,})/);
        if (cid) updateIdentity({ customerId: cid[1] });
      }).catch(() => {});
    } catch (_) {}
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let url;
    try {
      url = typeof input === "string" ? input : input && input.url;
      rememberHeaders(init && init.headers, url);
      if (input && input.headers && typeof input.headers.get === "function") {
        rememberHeaders(input.headers, url);
      }
    } catch (_) {}
    const promise = originalFetch.apply(this, arguments);
    // Handler lateral: lê uma cópia da resposta sem consumir a original.
    try { if (url) promise.then((r) => { maybeCaptureIdentityFromResponse(url, r); return r; }, () => {}); } catch (_) {}
    return promise;
  };

  // Deteção da identidade: estado embebido (customerId/email, instantâneo) +
  // /api/balance (username real). Repetimos umas vezes porque a sessão/cookies
  // podem não estar prontos no primeiro instante do load; paramos assim que
  // houver username.
  let identityTries = 0;
  (function detectIdentity() {
    if (!identity.username) {
      readInitialStateIdentity();          // customerId/email (secundários)
      fetchUsernameFromBalance();          // customerCode = username (primário)
      if (!identity.customerId) fetchCustomerIdFromApi();
    }
    if (++identityTries < 5) setTimeout(detectIdentity, 1500); // ~7.5s
  })();

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
          apiOrigin: BETANO_ORIGINS.has(data.tokens.apiOrigin) ? data.tokens.apiOrigin : location.origin,
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
      const apiOrigin = BETANO_ORIGINS.has(requestTokens.apiOrigin) ? requestTokens.apiOrigin : location.origin;
      const url = `${apiOrigin}${HISTORY_PATH}?${query}`;
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

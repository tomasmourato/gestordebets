// Isolated-world bridge for Betano. It forwards page-context API calls to the
// service worker without exposing cookies or request tokens to storage.
(function () {
  const MARK = "bettrackr-betano-bridge";

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== MARK) return;

    if (data.type === "SESSION") {
      chrome.storage.session.set({ betanoSessionDetectedAt: Date.now() }).catch(() => {});
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
})();

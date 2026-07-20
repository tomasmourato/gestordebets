// content-bettrackr.js — corre no site do BetTrackr. Faz duas coisas:
//
// 1. Lê a sessão atual que a app guarda em localStorage e a origem atual, para
//    o service worker validar o utilizador antes de chamar /api/bets/bulk.
// 2. Serve de ponte entre a página e a extensão: anuncia que a extensão está
//    presente e deixa o app disparar a importação com um botão (sem precisar do
//    ID da extensão nem de a publicar).

(function () {
  // Guarda contra dupla injeção (declaração no manifest + reinjeção do
  // background após update): dois listeners duplicariam a importação.
  if (window.__bettrackrBridgeLoaded) return;
  window.__bettrackrBridgeLoaded = true;

  const KEY = "gestordebets_token";
  const USER_KEY = "gestordebets_user";
  const APP = "bettrackr-app"; // mensagens vindas da página
  const EXT = "bettrackr-ext"; // mensagens enviadas pela extensão
  const version = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || "0";

  // --- session sync ---
  function currentSession() {
    try {
      const token = localStorage.getItem(KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const user = storedUser ? JSON.parse(storedUser) : null;
      const expectedUserId = typeof user?.id === "string" ? user.id.trim() : "";
      if (!token) return null;
      return { token, baseUrl: location.origin, expectedUserId };
    } catch (_) {
      return null;
    }
  }

  async function syncSession() {
    const session = currentSession();
    if (session) {
      await chrome.storage.local.set({
        bettrackrToken: session.token,
        bettrackrBase: session.baseUrl,
        bettrackrUserId: session.expectedUserId || null,
      });
    } else {
      await chrome.storage.local.remove(["bettrackrToken", "bettrackrUserId"]);
    }
    return session;
  }

  syncSession().catch(() => {});
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === USER_KEY || e.key === null) syncSession().catch(() => {});
  });

  // --- ponte página <-> extensão ---
  function toPage(payload) {
    window.postMessage({ source: EXT, ...payload }, location.origin);
  }

  // Anuncia a presença assim que o content script carrega (o app pode já estar à
  // escuta) e responde a PING para quem carregar depois.
  toPage({ type: "PONG", version });

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== APP) return;

    if (data.type === "PING") {
      toPage({ type: "PONG", version });
      return;
    }

    if (data.type === "IMPORT") {
      const session = await syncSession().catch(() => null);
      if (!session?.token) {
        toPage({ type: "RESULT", ok: false, error: "Sem sessão BetTrackr. Inicia sessão novamente na app." });
        return;
      }
      if (!session.expectedUserId) {
        toPage({ type: "RESULT", ok: false, error: "Não foi possível identificar o utilizador atual. Termina sessão e volta a entrar." });
        return;
      }
      // The website action imports every bookmaker detected by the extension.
      // The popup can still request a single source explicitly. accountIds
      // maps each source ("betclic"/"betano") to the BetTrackr account the
      // bets should be imported into (optional).
      chrome.runtime.sendMessage({
        type: "IMPORT",
        source: data.sourceBookmakers || "all",
        accountIds: data.accountIds || null,
        bettrackrSession: session,
      }, (result) => {
        if (chrome.runtime.lastError) {
          toPage({ type: "RESULT", ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        toPage({ type: "RESULT", ...(result || { ok: false, error: "Sem resposta da extensão." }) });
      });
    }
  });

  // Reencaminha o progresso emitido pelo service worker durante a importação.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "GET_BETTRACKR_SESSION") {
      syncSession()
        .then((session) => sendResponse({ session }))
        .catch(() => sendResponse({ session: null }));
      return true;
    }
    if (msg && msg.type === "PROGRESS") toPage({ type: "PROGRESS", text: msg.text });
    return false;
  });
})();

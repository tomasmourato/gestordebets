// content-betclic.js — corre no ISOLATED world de betclic.pt. Recebe o token
// capturado pelo inject.js (MAIN world) via postMessage e guarda-o no
// armazenamento da extensão para o service worker o usar.

window.addEventListener("message", (event) => {
  // Só aceitamos mensagens desta própria janela e com o nosso marcador.
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== "bettrackr-betclic-bridge" || !data.token) return;

  chrome.storage.local.set({
    betclicToken: data.token,
    betclicApiBase: data.apiBase || "https://betting.begmedia.pt",
    betclicCapturedAt: Date.now(),
  }, () => {
    // Token novo capturado -> pede ao service worker para tentar auto-import
    // (só corre se o utilizador tiver ligado a opção; caso contrário é ignorado).
    chrome.runtime.sendMessage({ type: "AUTO_IMPORT_HINT", source: "betclic" }).catch(() => {});
  });
});

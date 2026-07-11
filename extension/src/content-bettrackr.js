// content-bettrackr.js — corre no site do BetTrackr. Lê o token JWT que o app
// guarda em localStorage ("gestordebets_token") e a origem atual, para o
// service worker poder chamar /api/bets/bulk sem o utilizador colar tokens.
// Também deteta o logout (token removido).

(function () {
  const KEY = "gestordebets_token";

  function sync() {
    try {
      const token = localStorage.getItem(KEY);
      if (token) {
        chrome.storage.local.set({ bettrackrToken: token, bettrackrBase: location.origin });
      } else {
        chrome.storage.local.remove("bettrackrToken");
      }
    } catch (_) {}
  }

  sync();
  // Reage a login/logout noutra aba do mesmo browser.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) sync();
  });
})();

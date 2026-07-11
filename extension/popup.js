// popup.js — mostra o estado das duas sessões e dispara a importação.

const dotBetclic = document.getElementById("dot-betclic");
const txtBetclic = document.getElementById("txt-betclic");
const dotBettrackr = document.getElementById("dot-bettrackr");
const txtBettrackr = document.getElementById("txt-bettrackr");
const importBtn = document.getElementById("import");
const msg = document.getElementById("msg");

function setMsg(text, kind) {
  msg.textContent = text || "";
  msg.className = "msg" + (kind ? " " + kind : "");
}

async function refreshStatus() {
  const s = await chrome.storage.local.get(["betclicToken", "bettrackrToken", "bettrackrBase"]);

  const hasBetclic = !!s.betclicToken;
  dotBetclic.className = "dot " + (hasBetclic ? "ok" : "bad");
  txtBetclic.textContent = hasBetclic
    ? "Betclic: sessão detetada"
    : "Betclic: abre 'As minhas apostas'";

  const hasBettrackr = !!s.bettrackrToken;
  dotBettrackr.className = "dot " + (hasBettrackr ? "ok" : "bad");
  txtBettrackr.textContent = hasBettrackr
    ? "BetTrackr: sessão detetada"
    : "BetTrackr: inicia sessão na app";

  importBtn.disabled = !(hasBetclic && hasBettrackr);
  return hasBetclic && hasBettrackr;
}

// Mensagens de progresso vindas do service worker.
chrome.runtime.onMessage.addListener((m) => {
  if (m && m.type === "PROGRESS") setMsg(m.text, null);
});

importBtn.addEventListener("click", async () => {
  importBtn.disabled = true;
  setMsg("A importar…", null);
  try {
    const result = await chrome.runtime.sendMessage({ type: "IMPORT" });
    if (!result || !result.ok) {
      setMsg(result?.error || "Falha na importação.", "error");
    } else if (result.imported === 0) {
      setMsg(`Nada novo para importar (${result.skipped} já existiam).`, "success");
    } else {
      setMsg(
        `${result.imported} apostas importadas` +
          (result.skipped ? ` · ${result.skipped} já existiam.` : "."),
        "success"
      );
    }
  } catch (err) {
    setMsg(String((err && err.message) || err), "error");
  } finally {
    await refreshStatus();
  }
});

refreshStatus();

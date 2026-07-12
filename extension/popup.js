// Popup for independent bookmaker imports and combined imports.
const dotBetclic = document.getElementById("dot-betclic");
const txtBetclic = document.getElementById("txt-betclic");
const dotBetano = document.getElementById("dot-betano");
const txtBetano = document.getElementById("txt-betano");
const dotBettrackr = document.getElementById("dot-bettrackr");
const txtBettrackr = document.getElementById("txt-bettrackr");
const buttons = {
  betclic: document.getElementById("import-betclic"),
  betano: document.getElementById("import-betano"),
  all: document.getElementById("import-all"),
};
const msg = document.getElementById("msg");

function setMsg(text, kind) {
  msg.textContent = text || "";
  msg.className = "msg" + (kind ? ` ${kind}` : "");
}

function setStatus(dot, text, ready, readyText, waitingText) {
  dot.className = `dot ${ready ? "ok" : "bad"}`;
  text.textContent = ready ? readyText : waitingText;
}

async function refreshStatus() {
  const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  setStatus(dotBetclic, txtBetclic, status.betclic, "Betclic: sessão detetada", "Betclic: abre 'As minhas apostas'");
  setStatus(dotBetano, txtBetano, status.betano, "Betano: página detetada", "Betano: abre betano.pt");
  setStatus(dotBettrackr, txtBettrackr, status.bettrackr, "BetTrackr: sessão detetada", "BetTrackr: inicia sessão na app");
  buttons.betclic.disabled = !(status.betclic && status.bettrackr);
  buttons.betano.disabled = !(status.betano && status.bettrackr);
  buttons.all.disabled = !(status.bettrackr && (status.betclic || status.betano));
  return status;
}

function formatSource(name, result) {
  if (!result || !result.ok) return `${name}: ${result?.error || "indisponível"}`;
  return `${name}: ${result.imported || 0} importadas, ${result.updated || 0} atualizadas` +
    (result.skipped ? `, ${result.skipped} já existentes` : "") +
    (result.unsupported ? `, ${result.unsupported} ignoradas` : "");
}

async function importSource(source) {
  Object.values(buttons).forEach((button) => { button.disabled = true; });
  setMsg("A importar…", null);
  try {
    const result = await chrome.runtime.sendMessage({ type: "IMPORT", source });
    if (!result || !result.ok) {
      setMsg(result?.error || "Falha na importação.", "error");
    } else {
      const sourceResults = result.sourceResults || { [source]: result };
      const lines = Object.entries(sourceResults).map(([name, item]) => formatSource(name, item));
      setMsg(lines.join(" · ") || `${result.imported || 0} apostas importadas.`, "success");
    }
  } catch (error) {
    setMsg(String(error && error.message || error), "error");
  } finally {
    await refreshStatus();
  }
}

for (const [source, button] of Object.entries(buttons)) {
  button.addEventListener("click", () => importSource(source));
}

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "PROGRESS") setMsg(message.text, null);
});

refreshStatus().catch((error) => setMsg(String(error && error.message || error), "error"));

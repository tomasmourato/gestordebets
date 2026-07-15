// Popup for independent bookmaker imports and combined imports.
// When the user has accounts registered in the app, a select per bookmaker
// asks which account the bets are being imported into.
const BOOKIES = [
  { key: "betclic", label: "Betclic" },
  { key: "betano", label: "Betano" },
];
const accountsBox = document.getElementById("accounts");
const accountChoices = {}; // key -> accountId escolhido ("" = sem conta)

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

// Carrega as contas do utilizador na app e mostra um select por casa.
// Sem contas (ou sem sessão), a caixa fica escondida e importa-se "sem conta".
async function loadAccounts() {
  try {
    const stored = await chrome.storage.local.get(["bettrackrToken", "bettrackrBase", "importAccountChoices"]);
    if (!stored.bettrackrToken) return;
    const base = stored.bettrackrBase || "https://gestordebets.vercel.app";
    const saved = stored.importAccountChoices && typeof stored.importAccountChoices === "object"
      ? stored.importAccountChoices
      : {};

    const res = await fetch(`${base}/api/accounts`, {
      headers: { Authorization: `Bearer ${stored.bettrackrToken}` },
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const accounts = Array.isArray(data.accounts) ? data.accounts : [];

    accountsBox.innerHTML = "";
    let anyShown = false;
    for (const { key, label } of BOOKIES) {
      const options = accounts.filter((account) => account.bookmaker === label);
      if (options.length === 0) continue;
      anyShown = true;

      const caption = document.createElement("label");
      caption.textContent = `Conta ${label}`;
      caption.htmlFor = `account-${key}`;
      const select = document.createElement("select");
      select.id = `account-${key}`;

      const none = document.createElement("option");
      none.value = "";
      none.textContent = "Sem conta";
      select.appendChild(none);
      for (const account of options) {
        const option = document.createElement("option");
        option.value = String(account.id);
        option.textContent = String(account.label);
        select.appendChild(option);
      }

      const remembered = typeof saved[key] === "string" ? saved[key] : "";
      if (remembered && options.some((account) => String(account.id) === remembered)) {
        select.value = remembered;
        accountChoices[key] = remembered;
      }

      select.addEventListener("change", () => {
        accountChoices[key] = select.value;
        const next = { ...saved, [key]: select.value };
        chrome.storage.local.set({ importAccountChoices: next });
        saved[key] = select.value;
      });

      accountsBox.appendChild(caption);
      accountsBox.appendChild(select);
    }
    accountsBox.hidden = !anyShown;
  } catch (_) {
    // API indisponível -> importa sem conta, como antes.
  }
}

function selectedAccountIds() {
  const ids = {};
  for (const { key } of BOOKIES) {
    if (accountChoices[key]) ids[key] = accountChoices[key];
  }
  return ids;
}

function formatSource(name, result) {
  if (!result || !result.ok) return `${name}: ${result?.error || "indisponível"}`;
  return `${name}: ${result.imported || 0} importadas, ${result.updated || 0} atualizadas` +
    (result.skipped ? `, ${result.skipped} já existentes` : "") +
    (result.cashouts ? `, ${result.cashouts} cashout detetado${result.cashouts === 1 ? "" : "s"}` : "") +
    (result.unsupported ? `, ${result.unsupported} ignoradas` : "");
}

async function importSource(source) {
  Object.values(buttons).forEach((button) => { button.disabled = true; });
  setMsg("A importar…", null);
  try {
    const result = await chrome.runtime.sendMessage({ type: "IMPORT", source, accountIds: selectedAccountIds() });
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
loadAccounts();

// Popup for independent bookmaker imports and combined imports.
// When the user has accounts registered in the app, a select per bookmaker
// asks which account the bets are being imported into.
const BOOKIES = [
  { key: "betclic", label: "Betclic" },
  { key: "betano", label: "Betano" },
  { key: "solverde", label: "Solverde" },
];
const accountsBox = document.getElementById("accounts");
const accountChoices = {}; // key -> accountId escolhido ("" = sem conta)
const accountSelects = {}; // key -> <select> (para pré-selecionar por username)
const accountOptionsByKey = {}; // key -> contas dessa casa
const accountHints = {}; // key -> <div> de dica (username detetado)

const dotBetclic = document.getElementById("dot-betclic");
const txtBetclic = document.getElementById("txt-betclic");
const dotBetano = document.getElementById("dot-betano");
const txtBetano = document.getElementById("txt-betano");
const dotSolverde = document.getElementById("dot-solverde");
const txtSolverde = document.getElementById("txt-solverde");
const dotBettrackr = document.getElementById("dot-bettrackr");
const txtBettrackr = document.getElementById("txt-bettrackr");
const buttons = {
  betclic: document.getElementById("import-betclic"),
  betano: document.getElementById("import-betano"),
  solverde: document.getElementById("import-solverde"),
  all: document.getElementById("import-all"),
};
const msg = document.getElementById("msg");

// Casas ativas escolhidas no site (via GET_STATUS). Por defeito, todas — só é
// restringido quando o servidor devolve uma seleção. Partilhado entre o estado
// (linhas/botões) e a construção dos dropdowns de conta.
let enabledBookies = BOOKIES.map((b) => b.key);
const statusRows = {
  betclic: dotBetclic.parentElement,
  betano: dotBetano.parentElement,
  solverde: dotSolverde.parentElement,
};

// Esconde as linhas de estado e os botões das casas que o utilizador não ativou.
function applyEnabledVisibility() {
  for (const { key } of BOOKIES) {
    const on = enabledBookies.includes(key);
    if (statusRows[key]) statusRows[key].hidden = !on;
    if (buttons[key]) buttons[key].hidden = !on;
  }
}

// Login / conta BetTrackr
const loginForm = document.getElementById("login");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const accountBox = document.getElementById("account-box");
const accountUser = document.getElementById("account-user");
const logoutBtn = document.getElementById("logout-btn");
const autoImportToggle = document.getElementById("auto-import");
const updateOnlyToggle = document.getElementById("update-only");

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
  if (Array.isArray(status.enabledBookmakers)) {
    enabledBookies = BOOKIES.map((b) => b.key).filter((k) => status.enabledBookmakers.includes(k));
  }
  applyEnabledVisibility();
  setStatus(dotBetclic, txtBetclic, status.betclic, "Betclic: sessão detetada", "Betclic: abre 'As minhas apostas'");
  setStatus(dotBetano, txtBetano, status.betano, "Betano: página detetada", "Betano: abre betano.pt");
  setStatus(dotSolverde, txtSolverde, status.solverde, "Solverde: sessão detetada", "Solverde: inicia sessão em solverde.pt");
  setStatus(dotBettrackr, txtBettrackr, status.bettrackr, "BetTrackr: sessão detetada", "BetTrackr: inicia sessão aqui");
  buttons.betclic.disabled = !(status.betclic && status.bettrackr);
  buttons.betano.disabled = !(status.betano && status.bettrackr);
  buttons.solverde.disabled = !(status.solverde && status.bettrackr);
  // "Importar tudo" só conta as casas ativas com sessão detetada.
  const anyEnabledReady = enabledBookies.some((key) => status[key]);
  buttons.all.disabled = !(status.bettrackr && anyEnabledReady);

  // Login vs. sessão iniciada.
  loginForm.hidden = status.bettrackr === true;
  accountBox.hidden = status.bettrackr !== true;
  if (status.bettrackr) {
    accountUser.textContent = status.bettrackrUser ? `Sessão: ${status.bettrackrUser}` : "Sessão iniciada";
    autoImportToggle.checked = status.autoImport === true;
    updateOnlyToggle.checked = status.updateOnly === true;
  }
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
      if (!enabledBookies.includes(key)) continue; // casa desativada no site
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
        // Mostra o username (quando definido) para deixar claro para que conta
        // real vão as apostas — a mesma associação que a deteção automática usa.
        option.textContent = account.username
          ? `${account.label} · @${account.username}`
          : String(account.label);
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

      // Dica com o username detetado na sessão da casa (preenchida depois).
      const hint = document.createElement("div");
      hint.id = `hint-${key}`;
      hint.style.cssText = "font-size:10px;margin:-2px 0 6px;min-height:12px;color:#9aa4b2;";
      hint.hidden = true;

      accountsBox.appendChild(caption);
      accountsBox.appendChild(select);
      accountsBox.appendChild(hint);

      accountSelects[key] = select;
      accountOptionsByKey[key] = options;
      accountHints[key] = hint;
    }
    accountsBox.hidden = !anyShown;
    if (anyShown) applyDetectedUsernames(saved);
  } catch (_) {
    // API indisponível -> importa sem conta, como antes.
  }
}

// Encontra a conta correspondente a uma identidade detetada {username, customerId,
// email}. O username (handle, ex.: customerCode "ronkzinho") bate certo com o
// campo username da conta OU com o label; o customerId/email só batem certo com o
// campo username EXPLÍCITO (nunca com o label) — o email só associa se o
// utilizador o tiver posto na conta. Mesma regra do background.
function matchAccountByUsername(options, identity) {
  const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());
  const id = identity && typeof identity === "object" ? identity : { username: identity };
  const handle = norm(id.username);
  const explicit = [handle, norm(id.customerId), norm(id.email)].filter(Boolean);
  if (explicit.length === 0) return null;
  return (
    options.find((a) => a.username && explicit.includes(norm(a.username))) ||
    (handle ? options.find((a) => norm(a.label) === handle) : null) ||
    null
  );
}

// Pergunta ao service worker qual o username com sessão iniciada em cada casa e,
// quando bate certo com uma conta, pré-seleciona-a no dropdown (o import segue
// a seleção). Também mostra o username detetado para o utilizador o poder
// registar na conta quando ainda não há correspondência.
async function applyDetectedUsernames(saved) {
  let detected;
  try {
    detected = await chrome.runtime.sendMessage({ type: "DETECT_USERNAMES" });
  } catch (_) {
    return;
  }
  if (!detected || typeof detected !== "object") return;

  for (const { key } of BOOKIES) {
    const info = detected[key];
    // Compat.: aceita tanto o formato novo ({username,error}) como string simples.
    const username = info && typeof info === "object" ? info.username : info;
    const error = info && typeof info === "object" ? info.error : null;
    const loggedIn = info && typeof info === "object" ? info.loggedIn : undefined;
    // Identificadores extra além do username (a Betano expõe customerId + email).
    const email = info && typeof info === "object" ? info.email : null;
    const customerId = info && typeof info === "object" ? info.customerId : null;
    const identity = { username, customerId, email };
    const select = accountSelects[key];
    const hint = accountHints[key];
    const options = accountOptionsByKey[key] || [];
    if (!select || !hint) continue;

    if (!username) {
      if (loggedIn === false) {
        // Sessão terminada -> força "sem conta" (não deixa a escolha memorizada).
        select.value = "";
        accountChoices[key] = "";
        const next = { ...(saved || {}), [key]: "" };
        chrome.storage.local.set({ importAccountChoices: next });
        if (saved) saved[key] = "";
        hint.hidden = false;
        hint.style.color = "#9aa4b2";
        hint.textContent = "Sem sessão iniciada — sem conta";
      } else if (error) {
        // Não conseguimos detetar (ex.: sem tab betclic aberta) — mostra o motivo,
        // mas NÃO mexe na seleção (não sabemos se está com ou sem sessão).
        hint.hidden = false;
        hint.style.color = "#9aa4b2";
        hint.textContent = `Deteção de conta indisponível (${error})`;
      } else {
        hint.hidden = true;
        hint.textContent = "";
      }
      continue;
    }

    const match = matchAccountByUsername(options, identity);
    hint.hidden = false;
    if (match) {
      // Pré-seleciona e persiste — o import vai para a conta certa mesmo que o
      // utilizador não toque em nada.
      select.value = String(match.id);
      accountChoices[key] = String(match.id);
      const next = { ...(saved || {}), [key]: String(match.id) };
      chrome.storage.local.set({ importAccountChoices: next });
      if (saved) saved[key] = String(match.id);
      hint.style.color = "#34d399";
      hint.textContent = `✓ Sessão @${username} → conta associada automaticamente`;
    } else {
      // Sugere o username (handle) para o utilizador pôr no campo username da
      // conta; o email é alternativa (só associa se posto no campo username).
      const emailHint = email && email !== username ? ` (ou o email "${email}")` : "";
      hint.style.color = "#f59e0b";
      hint.textContent = `Sessão @${username} detetada — põe "${username}" no username da conta${emailHint} para associar automaticamente`;
    }
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
    (result.ignoredNew ? `, ${result.ignoredNew} novas ignoradas` : "") +
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

// --- Login / logout / auto-import ---
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) { setMsg("Preenche o email e a password.", "error"); return; }
  loginBtn.disabled = true;
  setMsg("A iniciar sessão…", null);
  try {
    const result = await chrome.runtime.sendMessage({ type: "LOGIN", email, password });
    if (!result || !result.ok) {
      setMsg(result?.error || "Falha ao iniciar sessão.", "error");
    } else {
      loginPassword.value = "";
      setMsg("Sessão iniciada.", "success");
      await refreshStatus();
      loadAccounts();
    }
  } catch (error) {
    setMsg(String(error && error.message || error), "error");
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  accountsBox.hidden = true;
  accountsBox.innerHTML = "";
  setMsg("Sessão terminada.", null);
  await refreshStatus();
});

autoImportToggle.addEventListener("change", async () => {
  await chrome.runtime.sendMessage({ type: "SET_AUTO_IMPORT", enabled: autoImportToggle.checked });
  setMsg(autoImportToggle.checked ? "Importação automática ligada." : "Importação automática desligada.", null);
});

updateOnlyToggle.addEventListener("change", async () => {
  await chrome.runtime.sendMessage({ type: "SET_UPDATE_ONLY", enabled: updateOnlyToggle.checked });
  setMsg(
    updateOnlyToggle.checked
      ? "Só atualizar existentes: as próximas importações não criam apostas novas."
      : "Modo normal: as importações voltam a criar apostas novas.",
    null
  );
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "PROGRESS") setMsg(message.text, null);
});

// Estado primeiro (define as casas ativas), depois as contas — assim os
// dropdowns já respeitam a seleção do site.
refreshStatus()
  .then(() => loadAccounts())
  .catch((error) => setMsg(String(error && error.message || error), "error"));

// Marcador de build visível — confirma que o Chrome carregou o código novo
// (o load de extensões unpacked em WSL fica muitas vezes com o worker antigo).
try {
  const mark = document.createElement("div");
  mark.textContent = "build: update-only-1";
  mark.style.cssText = "font-size:9px;color:#667085;text-align:center;padding:3px 0;opacity:.65;";
  document.body.appendChild(mark);
} catch (_) {}

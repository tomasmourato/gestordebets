// Autenticação e wrapper de fetch para as rotas protegidas da API.

const TOKEN_KEY = "gestordebets_token";
const USER_KEY = "gestordebets_user";

interface StoredUser {
  id: string;
  username: string;
  email: string;
}

// Lançado quando o backend responde 401 (token inválido/expirado).
// Permite às camadas superiores distinguir uma sessão expirada de outros erros.
export class SessionExpiredError extends Error {}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function saveUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ------------------------------------------------------------
// Registo
// ------------------------------------------------------------
export async function register(username: string, email: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao registar.");
  saveToken(data.token);
  saveUser(data.user);
  return data.user;
}

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------
export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao autenticar.");
  saveToken(data.token);
  saveUser(data.user);
  return data.user;
}

export function logout() {
  clearToken();
  localStorage.removeItem(USER_KEY);
}

// ------------------------------------------------------------
// Wrapper de fetch que injeta automaticamente o header Authorization.
// Usa isto para TODAS as chamadas a rotas protegidas (/api/bets, etc.)
// ------------------------------------------------------------
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Token inválido ou expirado -> força novo login
    clearToken();
    localStorage.removeItem(USER_KEY);
    throw new SessionExpiredError("Sessão expirada. Por favor inicia sessão novamente.");
  }

  return res;
}

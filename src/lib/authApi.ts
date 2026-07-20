// Autenticação e wrapper de fetch para as rotas protegidas da API.

import { apiUrl } from "./apiBase";

const TOKEN_KEY = "gestordebets_token";
const USER_KEY = "gestordebets_user";

export interface StoredUser {
  id: string;
  username: string;
  email: string;
}

// Lançado quando o backend responde 401 (token inválido/expirado).
// Permite às camadas superiores distinguir uma sessão expirada de outros erros.
export class SessionExpiredError extends Error {}

/**
 * Lê o corpo da resposta como JSON sem rebentar quando ele não é JSON.
 * Proxies e plataformas (Vercel, nginx) respondem com páginas HTML/texto em
 * erros de infraestrutura; chamar res.json() diretamente nesses casos
 * produzia erros ilegíveis como "Unexpected token 'A' ... is not valid JSON".
 */
export async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/** Mensagem de erro a partir da resposta, com fallback legível por status. */
function errorFrom(data: any, res: Response, fallback: string): Error {
  return new Error(data?.error || `${fallback} (HTTP ${res.status})`);
}

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
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // JSON corrompido no storage — trata como sessão sem utilizador em cache.
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function restoreBrowserSession(): Promise<StoredUser | null> {
  if (!getToken()) return null;
  const res = await authFetch("/api/auth/me");
  const data = await parseJsonResponse(res);
  if (!res.ok || !data?.user) return null;
  saveUser(data.user);
  return data.user;
}

// ------------------------------------------------------------
// Registo
// ------------------------------------------------------------
export async function register(username: string, email: string, password: string) {
  const res = await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw errorFrom(data, res, "Erro ao registar");
  saveToken(data.token);
  saveUser(data.user);
  return data.user;
}

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------
export async function login(email: string, password: string) {
  const res = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw errorFrom(data, res, "Erro ao autenticar");
  saveToken(data.token);
  saveUser(data.user);
  return data.user;
}

export function logout() {
  clearToken();
  localStorage.removeItem(USER_KEY);
  void fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "same-origin" }).catch(() => undefined);
}

// ------------------------------------------------------------
// Perfil completo do utilizador autenticado (inclui created_at).
// Usado pelo painel de conta; atualiza também a cache local.
// ------------------------------------------------------------
export interface CurrentUser extends StoredUser {
  created_at?: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await authFetch("/api/auth/me");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw errorFrom(data, res, "Erro ao obter o utilizador");
  const user = data.user as CurrentUser;
  saveUser({ id: user.id, username: user.username, email: user.email });
  return user;
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

  // Caminhos relativos ("/api/...") são prefixados com a base da plataforma
  // (na app nativa a API vive noutra origem; na web fica relativo).
  const target = url.startsWith("/") ? apiUrl(url) : url;
  // credentials same-origin: na web o cookie de sessão do SSR tem de seguir no
  // pedido para o servidor conseguir render o documento já autenticado.
  const res = await fetch(target, { ...options, headers, credentials: "same-origin" });

  if (res.status === 401) {
    // Token inválido ou expirado -> força novo login
    clearToken();
    localStorage.removeItem(USER_KEY);
    throw new SessionExpiredError("Sessão expirada. Por favor inicia sessão novamente.");
  }

  return res;
}

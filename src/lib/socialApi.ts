// src/lib/socialApi.ts
// Camada de API para a funcionalidade social (amizades). Fala com as rotas
// /api/social protegidas por JWT via authFetch.

import { authFetch, parseJsonResponse } from "./authApi";
import { mapBetFromApi } from "./betsApi";
import { Bet, Friend, FriendRequest, UserSearchResult } from "../types";

// ------------------------------------------------------------
// Procura utilizadores por username (mínimo 2 caracteres).
// ------------------------------------------------------------
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const res = await authFetch(`/api/social/search?q=${encodeURIComponent(query)}`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao procurar utilizadores.");
  return data.users as UserSearchResult[];
}

// ------------------------------------------------------------
// Lista de amigos aceites.
// ------------------------------------------------------------
export async function listFriends(): Promise<Friend[]> {
  const res = await authFetch("/api/social/friends");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter os amigos.");
  return data.friends as Friend[];
}

// ------------------------------------------------------------
// Pedidos pendentes (recebidos e enviados).
// ------------------------------------------------------------
export async function listRequests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
  const res = await authFetch("/api/social/requests");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter os pedidos.");
  return { incoming: data.incoming ?? [], outgoing: data.outgoing ?? [] };
}

// ------------------------------------------------------------
// Envia um pedido de amizade por username. Devolve o novo estado.
// ------------------------------------------------------------
export async function sendFriendRequest(username: string): Promise<string> {
  const res = await authFetch("/api/social/requests", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao enviar o pedido.");
  return data.status as string;
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const res = await authFetch(`/api/social/requests/${requestId}/accept`, { method: "POST" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao aceitar o pedido.");
}

// Recusa (recebido) ou cancela (enviado) um pedido pendente.
export async function removeFriendRequest(requestId: string): Promise<void> {
  const res = await authFetch(`/api/social/requests/${requestId}`, { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao remover o pedido.");
}

export async function removeFriend(userId: string): Promise<void> {
  const res = await authFetch(`/api/social/friends/${userId}`, { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao remover a amizade.");
}

// ------------------------------------------------------------
// Apostas de um amigo (só devolvidas pelo servidor se forem amigos).
// Reutiliza mapBetFromApi para o mesmo modelo Bet do resto da app.
// ------------------------------------------------------------
export async function fetchFriendBets(userId: string): Promise<{ friend: Friend; bets: Bet[] }> {
  const res = await authFetch(`/api/social/friends/${userId}/bets`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter as apostas do amigo.");
  return {
    friend: data.friend as Friend,
    bets: (data.bets as any[]).map(mapBetFromApi),
  };
}

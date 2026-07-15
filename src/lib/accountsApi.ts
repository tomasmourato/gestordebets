// src/lib/accountsApi.ts
// Camada de API para as contas por casa de apostas (/api/accounts).
// Segue o mesmo padrão de betsApi: fala com o servidor via authFetch e
// traduz snake_case -> camelCase.

import { authFetch, parseJsonResponse } from "./authApi";
import { BookieAccount } from "../types";

type ApiAccountRow = Record<string, any>;

function mapAccountFromApi(row: ApiAccountRow): BookieAccount {
  return {
    id: String(row.id),
    bookmaker: String(row.bookmaker ?? ""),
    label: String(row.label ?? ""),
    createdAt: row.created_at ?? undefined,
  };
}

export async function fetchAccounts(): Promise<BookieAccount[]> {
  const res = await authFetch("/api/accounts");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter as contas.");
  return (data.accounts as ApiAccountRow[]).map(mapAccountFromApi);
}

export async function createAccount(bookmaker: string, label: string): Promise<BookieAccount> {
  const res = await authFetch("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ bookmaker, label }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao criar a conta.");
  return mapAccountFromApi(data.account);
}

export async function renameAccount(id: string, label: string): Promise<BookieAccount> {
  const res = await authFetch(`/api/accounts/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ label }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao renomear a conta.");
  return mapAccountFromApi(data.account);
}

export async function deleteAccount(id: string): Promise<void> {
  const res = await authFetch(`/api/accounts/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao apagar a conta.");
}

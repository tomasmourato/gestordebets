// src/lib/settingsApi.ts
// Camada de API para as definições do utilizador (/api/settings).
// Por agora só gere as "casas ativas" — quais das casas suportadas
// (betclic/betano/solverde) o utilizador quer usar. A extensão lê o mesmo
// endpoint para só mostrar/importar dessas casas.

import { authFetch, parseJsonResponse } from "./authApi";

// Casas suportadas pela app (chaves minúsculas, ordem canónica). Espelha o
// SUPPORTED_BOOKMAKERS do servidor; serve de fallback quando /api/settings ainda
// não respondeu (ou o servidor não foi reiniciado com a rota nova).
export const SUPPORTED_BOOKMAKERS = ["betclic", "betano", "solverde"] as const;

export interface UserSettings {
  // Casas ativas já resolvidas pelo servidor (NULL na BD -> todas as suportadas).
  enabledBookmakers: string[];
  // Todas as casas que a app suporta, em ordem canónica.
  supportedBookmakers: string[];
}

function normalizeSettings(data: any): UserSettings {
  return {
    enabledBookmakers: Array.isArray(data.enabledBookmakers) ? data.enabledBookmakers : [],
    supportedBookmakers: Array.isArray(data.supportedBookmakers) ? data.supportedBookmakers : [],
  };
}

export async function fetchSettings(): Promise<UserSettings> {
  const res = await authFetch("/api/settings");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao obter as definições.");
  return normalizeSettings(data);
}

export async function updateEnabledBookmakers(enabledBookmakers: string[]): Promise<UserSettings> {
  const res = await authFetch("/api/settings", {
    method: "PUT",
    body: JSON.stringify({ enabledBookmakers }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Erro ao guardar as definições.");
  return normalizeSettings(data);
}

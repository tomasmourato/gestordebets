// src/lib/apiBase.ts
// Base URL da API. Na web os caminhos relativos ("/api/...") funcionam porque
// o frontend e a API partilham a origem. Na app nativa (Capacitor) os assets
// são servidos localmente (https://localhost), por isso as chamadas têm de
// apontar explicitamente para o servidor.
//
// Prioridade: VITE_API_BASE_URL (definida no build) > produção quando corre
// dentro do Capacitor > relativo (web).

const PRODUCTION_API = "https://gestordebets.vercel.app";

/** True quando a app corre dentro da shell nativa do Capacitor. */
export function isNativeApp(): boolean {
  try {
    return Boolean((window as any).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const API_BASE: string = configured
  ? configured.replace(/\/+$/, "")
  : isNativeApp()
    ? PRODUCTION_API
    : "";

/** Prefixa um caminho da API ("/api/...") com a base correta para a plataforma. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

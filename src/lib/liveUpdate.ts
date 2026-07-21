// src/lib/liveUpdate.ts
// Live update da app nativa (Capacitor), self-hosted na Vercel — sem serviços
// pagos. No arranque, a app compara a versão do bundle instalado com
// /app-version.json (gerado a cada deploy por scripts/bundle-app.mjs); se for
// diferente, descarrega /app-bundle.zip e agenda-o para o PRÓXIMO arranque
// (zero interrupção — nada recarrega debaixo dos dedos do utilizador).
//
// Segurança/rollback: notifyAppReady() confirma que o bundle atual arranca;
// se um bundle novo nunca o chamar, o plugin reverte sozinho para o anterior.
// Na web isto é um no-op — a Vercel já atualiza a web a cada deploy.

import { apiUrl, isNativeApp } from "./apiBase";

// Evita re-descarregar um bundle que já ficou agendado para o próximo arranque.
const STAGED_KEY = "gestordebets_staged_bundle";

/** Versão do bundle instalado ("builtin" = o embutido no APK; null na web). */
export async function getBundleVersion(): Promise<string | null> {
  if (!isNativeApp()) return null;
  try {
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const current = await CapacitorUpdater.current();
    return current?.bundle?.version || "builtin";
  } catch {
    return null;
  }
}

export async function initLiveUpdate(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    // Import dinâmico: o plugin só existe (e só interessa) no runtime nativo.
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");

    // Confirma que este bundle arrancou bem (senão o plugin faz rollback).
    await CapacitorUpdater.notifyAppReady();

    const res = await fetch(apiUrl("/app-version.json"), { cache: "no-store" });
    if (!res.ok) return;
    const remote = (await res.json()) as { version?: string };
    if (!remote?.version) return;

    const current = await CapacitorUpdater.current();
    const currentVersion = current?.bundle?.version || "builtin";
    if (remote.version === currentVersion) {
      localStorage.removeItem(STAGED_KEY);
      return;
    }
    if (localStorage.getItem(STAGED_KEY) === remote.version) return; // já agendado

    const bundle = await CapacitorUpdater.download({
      url: apiUrl("/app-bundle.zip"),
      version: remote.version,
    });
    // Aplica no próximo arranque; o atual continua intacto.
    await CapacitorUpdater.next({ id: bundle.id });
    localStorage.setItem(STAGED_KEY, remote.version);
    console.log(`[liveUpdate] versão ${remote.version} descarregada; aplica no próximo arranque.`);
  } catch (err) {
    // Offline, servidor indisponível, zip corrompido… — a app continua com o
    // bundle atual e tenta outra vez no próximo arranque.
    console.warn("[liveUpdate] ignorado:", err);
  }
}

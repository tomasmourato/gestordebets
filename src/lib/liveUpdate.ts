// src/lib/liveUpdate.ts
// Live update da app nativa (Capacitor), self-hosted na Vercel — sem serviços
// pagos. No arranque, a app compara-se com /app-version.json (gerado a cada
// deploy por scripts/bundle-app.mjs); se o remoto for MAIS RECENTE, descarrega
// /app-bundle.zip e agenda-o para o PRÓXIMO arranque (zero interrupção — nada
// recarrega debaixo dos dedos do utilizador).
//
// NUNCA FAZER DOWNGRADE: a comparação é por `buildTime` (instante do build,
// embutido em cada bundle como __BUILD_TIME__), não por igualdade de versão.
// Antes comparava-se só por igualdade e a versão era o SHA do commit: um APK
// acabado de instalar reporta "builtin", que nunca é igual ao SHA remoto, por
// isso descarregava SEMPRE o bundle de produção — mesmo sendo mais antigo que
// o APK. Resultado: a app arrancava bem à primeira e depois ficava presa no
// splash (o bundle antigo não tinha o código que o esconde). Se o remoto não
// declarar buildTime, assumimos que não é mais recente e não mexemos.
//
// Segurança/rollback: notifyAppReady() confirma que o bundle atual arranca;
// se um bundle novo nunca o chamar, o plugin reverte sozinho para o anterior.
// Na web isto é um no-op — a Vercel já atualiza a web a cada deploy.

import { apiUrl, isNativeApp } from "./apiBase";

// Instante do build deste bundle, injetado pelo vite (ver vite.config.ts).
declare const __BUILD_TIME__: number;

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
    const remote = (await res.json()) as { version?: string; buildTime?: number };
    if (!remote?.version) return;

    const current = await CapacitorUpdater.current();
    const currentVersion = current?.bundle?.version || "builtin";
    if (remote.version === currentVersion) {
      localStorage.removeItem(STAGED_KEY);
      return;
    }

    // Só aplica se for comprovadamente mais recente que ESTE bundle. Um deploy
    // sem buildTime (ou mais antigo que o APK) é ignorado — nunca downgrade.
    if (typeof remote.buildTime !== "number" || remote.buildTime <= __BUILD_TIME__) {
      console.log("[liveUpdate] remoto não é mais recente que o bundle atual — ignorado.");
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

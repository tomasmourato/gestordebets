// src/lib/splash.ts
// Esconde o splash nativo (launchAutoHide: false em capacitor.config.ts).
// TEM de ser chamado no arranque (main.tsx), incondicionalmente: qualquer
// ecrã pode ser o primeiro (login, galeria, app), e se ninguém esconder o
// splash a app fica presa nele para sempre. Na web é um no-op.

import { isNativeApp } from "./apiBase";

export async function hideSplashScreen(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Pequeno atraso para o primeiro frame do React já estar pintado.
    await new Promise((r) => setTimeout(r, 120));
    await SplashScreen.hide();
  } catch {
    /* plugin indisponível — nada a esconder. */
  }
}

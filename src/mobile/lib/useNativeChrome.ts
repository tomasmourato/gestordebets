// src/mobile/lib/useNativeChrome.ts
// Integração com o "chrome" nativo do Android (status bar, splash, botão
// voltar). Todos os efeitos são no-op na web (guardados por isNativeApp) e
// importam os plugins dinamicamente, para não entrarem no bundle web.

import { useEffect } from "react";
import { isNativeApp } from "../../lib/apiBase";

const THEME_COLOR_DARK = "#09090b"; // zinc-950
const THEME_COLOR_LIGHT = "#ffffff";

/** Atualiza a meta theme-color (system bars da PWA e cor de referência). */
function setThemeColorMeta(isDark: boolean) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
}

/**
 * Configura o status bar em edge-to-edge e sincroniza o estilo dos ícones
 * com o tema. Esconde o splash após o primeiro paint da app.
 */
export function useNativeChrome(isDark: boolean): void {
  // Meta theme-color acompanha o tema (também vale na web/PWA).
  useEffect(() => {
    setThemeColorMeta(isDark);
  }, [isDark]);

  // Edge-to-edge + estilo dos ícones do status bar.
  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;

    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        // Overlay: o WebView desenha por baixo do status bar (edge-to-edge);
        // o conteúdo compensa com as safe areas (pt-safe).
        await StatusBar.setOverlaysWebView({ overlay: true });
        // Style.Dark = ícones claros (para fundo escuro); Style.Light = ícones
        // escuros (para fundo claro).
        await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      } catch {
        /* plugin indisponível — sem status bar nativo. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDark]);

  // Nota: o splash é escondido no arranque em main.tsx (src/lib/splash.ts),
  // não aqui — o primeiro ecrã pode ser o login, que vive fora dos shells.
}

/**
 * Liga o botão "voltar" do Android ao callback `onBack`. O callback decide o
 * que fazer (fechar sheet via backStack, navegar, ou sair). No-op na web.
 */
export function useAndroidBackButton(onBack: () => void): void {
  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => onBack());
        remove = () => listener.remove();
      } catch {
        /* sem plugin App — sem botão voltar. */
      }
    })();

    return () => {
      remove?.();
    };
  }, [onBack]);
}

/** Sai da app nativa (usado no double-back-to-exit). No-op na web. */
export async function exitNativeApp(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { App } = await import("@capacitor/app");
    await App.exitApp();
  } catch {
    /* no-op */
  }
}

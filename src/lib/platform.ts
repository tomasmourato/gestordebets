// src/lib/platform.ts
// Decide qual o shell a renderizar: a UI mobile (nativa-feel) ou a UI
// desktop. A UI mobile ativa quando corremos dentro do Capacitor (app
// Android) ou num viewport pequeno (PWA/browser), espelhando o breakpoint
// `md:` (768px) do Tailwind já usado em App.tsx.
//
// Override para testar no browser: `?ui=mobile` ou `?ui=desktop`. A escolha
// fica persistida em localStorage para sobreviver à navegação SPA (que muda
// o pathname sem a query string).

import { useEffect, useState } from "react";
import { isNativeApp } from "./apiBase";

const UI_OVERRIDE_KEY = "g_ui_mode";
const MOBILE_QUERY = "(max-width: 767px)";

type UiOverride = "mobile" | "desktop" | null;

/** Lê o override de `?ui=`, persistindo-o; devolve o valor efetivo. */
function readOverride(): UiOverride {
  if (typeof window === "undefined") return null;
  try {
    const param = new URLSearchParams(window.location.search).get("ui");
    if (param === "mobile" || param === "desktop") {
      localStorage.setItem(UI_OVERRIDE_KEY, param);
      return param;
    }
    const stored = localStorage.getItem(UI_OVERRIDE_KEY);
    if (stored === "mobile" || stored === "desktop") return stored;
  } catch {
    /* localStorage/URL indisponível — sem override. */
  }
  return null;
}

/** Cálculo síncrono (sem hooks) — útil fora de componentes. */
export function shouldUseMobileUI(): boolean {
  const override = readOverride();
  if (override) return override === "mobile";
  if (isNativeApp()) return true;
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Hook reativo: reavalia quando o viewport cruza o breakpoint (redimensionar
 * o browser, rodar o dispositivo). Um override fixa o resultado.
 */
export function useMobileUI(): boolean {
  const [mobile, setMobile] = useState<boolean>(shouldUseMobileUI);

  useEffect(() => {
    // Um override (query/localStorage) tem prioridade e não reage ao viewport.
    if (readOverride()) return;
    if (isNativeApp()) return;

    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(shouldUseMobileUI());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return mobile;
}

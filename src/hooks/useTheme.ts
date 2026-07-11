// src/hooks/useTheme.ts
// Resolve a preferência de tema ("light" | "dark" | "system") para um
// booleano e aplica/remove a classe .dark no <html>. O mesmo cálculo é
// feito por um script inline no index.html, para evitar o flash de tema
// claro antes do React montar.

import { useEffect, useState } from "react";
import { ThemeMode } from "../types";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

export function useTheme(theme: ThemeMode): boolean {
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  // Acompanha mudanças na definição do sistema operativo enquanto a app
  // está aberta (só tem efeito quando theme === "system").
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "system" ? systemDark : theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    // Faz com que scrollbars, inputs nativos e form controls sigam o tema.
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  return isDark;
}

// src/hooks/usePreferences.ts
// Preferências gerais da aplicação. Este é um dos poucos dados que
// continua a ser guardado em localStorage (chave "g_prefs").

import { useState } from "react";
import { Preferences } from "../types";

const PREFS_KEY = "g_prefs";

const DEFAULT_PREFERENCES: Preferences = {
  currency: "€",
  defaultBookmaker: "Betano",
  defaultStake: 10,
  theme: "system",
  language: "pt",
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch {
    // Ignora JSON inválido e usa os valores por omissão.
  }
  return DEFAULT_PREFERENCES;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => loadPreferences());

  const updatePreferences = (prefs: Preferences) => {
    setPreferences(prefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  };

  return { preferences, updatePreferences };
}

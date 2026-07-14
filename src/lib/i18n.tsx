// src/lib/i18n.tsx
// i18n leve, sem dependências: um dicionário de chaves semânticas por idioma,
// um Provider que recebe o idioma das preferências, e o hook useI18n().
//
// Estado: a INFRAESTRUTURA está completa e o SHELL da app (navegação, rodapé,
// cartão de idioma) está traduzido. As restantes strings dos separadores ainda
// estão em português fixo — basta trocá-las por t("chave") e acrescentar a
// entrada ao dicionário para as cobrir. É incremental e não quebra nada.

import React, { createContext, useContext } from "react";
import { Language } from "../types";

export type { Language };

type Entry = { pt: string; en: string };

const DICT: Record<string, Entry> = {
  // Navegação / shell
  "nav.overview": { pt: "Visão Geral", en: "Overview" },
  "nav.bets": { pt: "Meus Boletins", en: "My Bets" },
  "nav.import": { pt: "Importar com IA", en: "AI Import" },
  "nav.social": { pt: "Social", en: "Social" },
  "nav.settings": { pt: "Configurações", en: "Settings" },
  "nav.logout": { pt: "Sair", en: "Log out" },
  "nav.install": { pt: "Instalar", en: "Install" },
  "footer.panel": { pt: "Painel", en: "Dashboard" },
  "footer.bets": { pt: "Boletins", en: "Bets" },
  "footer.ai": { pt: "IA", en: "AI" },
  "footer.social": { pt: "Social", en: "Social" },
  "footer.settings": { pt: "Ajustes", en: "Settings" },
  "app.loadingBets": { pt: "A carregar apostas…", en: "Loading bets…" },
  "app.brandTagline": { pt: "Gestão de Apostas", en: "Bet Management" },

  // Painel lateral de conta
  "account.title": { pt: "A minha conta", en: "My account" },
  "account.open": { pt: "Abrir painel de conta", en: "Open account panel" },
  "account.close": { pt: "Fechar painel de conta", en: "Close account panel" },
  "account.username": { pt: "Username", en: "Username" },
  "account.email": { pt: "Email", en: "Email" },
  "account.userId": { pt: "ID de utilizador", en: "User ID" },
  "account.memberSince": { pt: "Membro desde", en: "Member since" },
  "account.copyId": { pt: "Copiar ID", en: "Copy ID" },
  "account.copied": { pt: "Copiado!", en: "Copied!" },
  "account.logout": { pt: "Terminar sessão", en: "Log out" },
  "account.logoutHint": {
    pt: "Termina a sessão neste dispositivo. As tuas apostas ficam guardadas na conta.",
    en: "Signs you out on this device. Your bets stay saved in your account.",
  },
  "account.loadError": {
    pt: "Não foi possível atualizar os dados da conta.",
    en: "Could not refresh the account details.",
  },

  // Configurações — cartão de idioma
  "settings.language.title": { pt: "Idioma", en: "Language" },
  "settings.language.desc": {
    pt: "Escolhe o idioma da aplicação.",
    en: "Choose the application language.",
  },
  "lang.pt": { pt: "Português", en: "Portuguese" },
  "lang.en": { pt: "Inglês", en: "English" },
};

interface I18nValue {
  lang: Language;
  t: (key: string) => string;
}

export function translate(lang: Language, key: string): string {
  return DICT[key]?.[lang] ?? key;
}

const I18nContext = createContext<I18nValue>({ lang: "pt", t: (k) => k });

export function I18nProvider({ lang, children }: { lang: Language; children: React.ReactNode }) {
  const t = (key: string) => translate(lang, key);
  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

// Navegação e contrato de shell partilhados entre o shell desktop
// (src/DesktopApp.tsx) e o shell mobile (src/mobile/MobileApp.tsx). Manter
// os separadores e os caminhos aqui garante que os dois layouts nunca
// divergem. O App.tsx é apenas um switch de plataforma que injeta o mesmo
// ShellProps em qualquer um dos shells.

import React from "react";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Settings as SettingsIcon,
  Users,
  Lightbulb,
} from "lucide-react";

import type { Bet, Preferences, BookieAccount, AuditLog } from "./types";
import type { DashboardBetsFilters } from "./components/Dashboard";
import type { getStoredUser } from "./lib/authApi";

export type AppTab =
  | "DASHBOARD"
  | "BETS"
  | "IMPORT"
  | "INSIGHTS"
  | "SOCIAL"
  | "SETTINGS";

export const TAB_PATHS: Record<AppTab, string> = {
  DASHBOARD: "/dashboard",
  BETS: "/bets",
  IMPORT: "/import",
  INSIGHTS: "/insights",
  SOCIAL: "/social",
  SETTINGS: "/settings",
};

export const tabFromPath = (pathname: string): AppTab => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const matchingTab = (Object.entries(TAB_PATHS) as Array<[AppTab, string]>)
    .find(([, path]) => path === normalizedPath)?.[0];

  return matchingTab || "DASHBOARD";
};

export interface NavItem {
  tab: AppTab;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  navKey: string;
  footerKey: string;
}

// Navegação única para a sidebar (desktop) e a tab bar (mobile), para os
// separadores nunca divergirem entre layouts.
export const NAV_ITEMS: NavItem[] = [
  { tab: "DASHBOARD", icon: LayoutDashboard, navKey: "nav.overview", footerKey: "footer.panel" },
  { tab: "BETS", icon: Layers, navKey: "nav.bets", footerKey: "footer.bets" },
  { tab: "IMPORT", icon: Sparkles, navKey: "nav.import", footerKey: "footer.ai" },
  { tab: "INSIGHTS", icon: Lightbulb, navKey: "nav.insights", footerKey: "footer.insights" },
  { tab: "SOCIAL", icon: Users, navKey: "nav.social", footerKey: "footer.social" },
  { tab: "SETTINGS", icon: SettingsIcon, navKey: "nav.settings", footerKey: "footer.settings" },
];

export type StoredUser = ReturnType<typeof getStoredUser>;

// Contrato partilhado: tudo o que um shell precisa de renderizar a app. O
// App.tsx é dono do estado (hooks) e dos handlers; os shells são só a
// apresentação. Ambos os shells recebem exatamente este objeto.
export interface ShellProps {
  // Navegação
  activeTab: AppTab;
  navigateToTab: (tab: AppTab) => void;
  navigateToFilteredBets: (filters: DashboardBetsFilters) => void;

  // Conta / sessão
  currentUser: StoredUser;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  onLogout: () => void;
  onSessionExpired: () => void;

  // Preferências / tema / i18n
  preferences: Preferences;
  onUpdatePreferences: (prefs: Preferences) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  t: (key: string) => string;

  // Estado de rede
  isOnline: boolean;

  // Apostas
  bets: Bet[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  onRefresh: () => Promise<void>;
  onAddBet: (bet: Bet) => Promise<void>;
  onUpdateBet: (bet: Bet) => Promise<void>;
  onDeleteBet: (id: string) => Promise<void>;
  onDuplicateBets: (bets: Bet[]) => Promise<void>;
  onImportCSV: (bets: Bet[]) => Promise<void>;
  onClearData: () => Promise<void>;
  onResetDemoData: () => Promise<void>;

  // Contas por casa de apostas
  accounts: BookieAccount[];
  accountsError: string | null;
  clearAccountsError: () => void;
  onAddAccount: (bookmaker: string, label: string) => Promise<BookieAccount | null>;
  onRenameAccount: (id: string, label: string) => Promise<BookieAccount | null>;
  onDeleteAccount: (id: string) => Promise<boolean>;

  // Auditoria
  auditLogs: AuditLog[];
}

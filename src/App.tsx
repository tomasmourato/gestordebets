import React, { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Settings as SettingsIcon,
  Users,
  Moon,
  Sun,
  X,
  Lightbulb
} from "lucide-react";

import { Bet, Preferences } from "./types";
import { INITIAL_BETS, safeNum } from "./utils";

import type { DashboardBetsFilters } from "./components/Dashboard";
import AuthPage from "./components/AuthPage";
import AccountPanel from "./components/AccountPanel";

// Todos os separadores carregam sob demanda (React.lazy): o shell (e o ecrã
// de login) pinta sem descarregar/parsear o Recharts (~390KB) nem o resto.
// No WebView Android (app nativa) isto corta o arranque de forma percetível.
const Dashboard = lazy(() => import("./components/Dashboard"));
const BetsManager = lazy(() => import("./components/BetsManager"));
const ScreenshotImporter = lazy(() => import("./components/ScreenshotImporter"));
const Settings = lazy(() => import("./components/Settings"));
const Social = lazy(() => import("./components/Social"));
const AIInsights = lazy(() => import("./components/AIInsights"));
import { isAuthenticated, logout, getStoredUser } from "./lib/authApi";
import { usePreferences } from "./hooks/usePreferences";
import { useTheme } from "./hooks/useTheme";
import { useAuditLog } from "./hooks/useAuditLog";
import { useBets } from "./hooks/useBets";
import { useAccounts } from "./hooks/useAccounts";
import { I18nProvider, translate } from "./lib/i18n";

type AppTab = "DASHBOARD" | "BETS" | "IMPORT" | "INSIGHTS" | "SOCIAL" | "SETTINGS";

const TAB_PATHS: Record<AppTab, string> = {
  DASHBOARD: "/dashboard",
  BETS: "/bets",
  IMPORT: "/import",
  INSIGHTS: "/insights",
  SOCIAL: "/social",
  SETTINGS: "/settings"
};

const tabFromPath = (pathname: string): AppTab => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const matchingTab = (Object.entries(TAB_PATHS) as Array<[AppTab, string]>)
    .find(([, path]) => path === normalizedPath)?.[0];

  return matchingTab || "DASHBOARD";
};

// Marca da app: o mesmo SVG do ícone instalável (assets/logo.svg, copiado
// para public/favicon.svg por scripts/gen-icons.mjs), para a identidade ser
// igual dentro e fora da app.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="shrink-0 select-none"
    />
  );
}

// Navegação única para a sidebar (desktop) e a tab bar (mobile), para os
// separadores nunca divergirem entre layouts.
const NAV_ITEMS: Array<{ tab: AppTab; icon: React.ComponentType<{ size?: number | string; className?: string }>; navKey: string; footerKey: string }> = [
  { tab: "DASHBOARD", icon: LayoutDashboard, navKey: "nav.overview", footerKey: "footer.panel" },
  { tab: "BETS", icon: Layers, navKey: "nav.bets", footerKey: "footer.bets" },
  { tab: "IMPORT", icon: Sparkles, navKey: "nav.import", footerKey: "footer.ai" },
  { tab: "INSIGHTS", icon: Lightbulb, navKey: "nav.insights", footerKey: "footer.insights" },
  { tab: "SOCIAL", icon: Users, navKey: "nav.social", footerKey: "footer.social" },
  { tab: "SETTINGS", icon: SettingsIcon, navKey: "nav.settings", footerKey: "footer.settings" }
];

export default function App() {

  // Autenticação: gate de login/registo antes de mostrar a app
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Cada área tem um URL próprio e continua a navegar como SPA.
  const [activeTab, setActiveTab] = useState<AppTab>(() => tabFromPath(window.location.pathname));

  // Painel lateral de conta (detalhes do utilizador + terminar sessão).
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const navigateToTab = (tab: AppTab) => {
    const nextPath = TAB_PATHS[tab];
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({ tab }, "", nextPath);
    }
    setActiveTab(tab);
  };

  const navigateToFilteredBets = (filters: DashboardBetsFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const nextPath = `/bets?${params.toString()}`;
    window.history.pushState({ tab: "BETS" }, "", nextPath);
    setActiveTab("BETS");
  };

  // Preferências (armazenamento local) e auditoria (em memória)
  const { preferences, updatePreferences } = usePreferences();
  const { auditLogs, addLog } = useAuditLog();

  // Tradução do shell (i18n). O resto da app usa <I18nProvider> + useI18n().
  const t = (key: string) => translate(preferences.language, key);

  // Aplica o tema ao <html> e devolve o tema efetivo (resolve "system")
  const isDark = useTheme(preferences.theme);

  // Sessão expirada -> termina a sessão e volta ao ecrã de login
  const handleSessionExpired = () => {
    logout();
    setCurrentUser(null);
    setAuthed(false);
  };

  // Apostas: PostgreSQL é a única fonte de verdade
  const {
    bets,
    isLoading,
    error,
    clearError,
    addBet,
    importBets,
    editBet,
    removeBet,
    clearAllBets,
    replaceAllBets
  } = useBets(authed, handleSessionExpired);

  // Contas por casa de apostas (partilhadas por Configurações, filtros e extensão)
  const {
    accounts,
    error: accountsError,
    clearError: clearAccountsError,
    addAccount,
    editAccount: renameAccount,
    removeAccount,
  } = useAccounts(authed, handleSessionExpired);

  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const syncTabWithUrl = () => setActiveTab(tabFromPath(window.location.pathname));

    // Normaliza a página inicial e URLs desconhecidos para a visão geral.
    const currentTab = tabFromPath(window.location.pathname);
    if (window.location.pathname !== TAB_PATHS[currentTab]) {
      window.history.replaceState({ tab: currentTab }, "", TAB_PATHS[currentTab]);
    }

    window.addEventListener("popstate", syncTabWithUrl);
    return () => window.removeEventListener("popstate", syncTabWithUrl);
  }, []);

  // ----------------------------------------------------
  // BET OPERATIONS (server-first: cada handler é um wrapper fino)
  // ----------------------------------------------------

  const handleAddBet = async (newBet: Bet) => {
    const created = await addBet(newBet);
    if (created) {
      addLog(
        "ADICIONAR_APOSTA",
        `Aposta no evento "${created.selections[0]?.event || "Múltipla"}" registada com stake de ${created.stake}${preferences.currency}.`
      );
    }
  };

  const handleUpdateBet = async (updatedBet: Bet) => {
    const updated = await editBet(updatedBet);
    if (updated) {
      addLog(
        "ATUALIZAR_APOSTA",
        `Aposta #${updated.id.substring(0, 8)} editada e recalculada (Lucro: ${updated.netProfit}${preferences.currency}).`
      );
    }
  };

  const handleDeleteBet = async (id: string) => {
    const betToDelete = bets.find(b => b.id === id);
    if (!betToDelete) return;

    const ok = await removeBet(id);
    if (ok) {
      addLog(
        "REMOVER_APOSTA",
        `Aposta no evento "${betToDelete.selections[0]?.event || "Múltipla"}" apagada com sucesso.`
      );
    }
  };

  const handleDuplicateBets = async (duplicatedBets: Bet[]) => {
    const created = await importBets(duplicatedBets);
    if (created) {
      addLog(
        "DUPLICAR_APOSTAS",
        `${created.length} ${created.length === 1 ? "aposta duplicada" : "apostas duplicadas"} com sucesso.`
      );
    }
  };

  // ----------------------------------------------------
  // PREFERENCES & GENERAL OPERATIONS
  // ----------------------------------------------------

  const handleUpdatePreferences = (updatedPrefs: Preferences) => {
    updatePreferences(updatedPrefs);
    addLog("PREFERENCIAS", "Preferências gerais da aplicação atualizadas.");
  };

  // Alterna entre claro/escuro a partir do tema efetivo, mesmo que a
  // preferência atual seja "system".
  const handleToggleTheme = () => {
    updatePreferences({ ...preferences, theme: isDark ? "light" : "dark" });
  };

  const handleClearData = async () => {
    const ok = await clearAllBets();
    if (ok) {
      addLog("LIMPAR_DADOS", "Dados removidos da base de dados.");
    }
  };

  const handleResetDemoData = async () => {
    const created = await replaceAllBets(INITIAL_BETS);
    if (created) {
      addLog("REPOR_DADOS", "Dados de demonstração originais repostos com sucesso.");
    }
  };

  const handleImportCSV = async (importedBets: Bet[]) => {
    if (importedBets.length === 0) {
      addLog("IMPORTACAO", "Nenhum boletim de aposta importado (lista vazia).");
      return;
    }

    // Filtra duplicados de importações CSV contra as apostas atuais.
    // Com a BD como fonte de verdade, só as apostas genuinamente novas
    // são enviadas para o servidor (sem merge/sort no cliente).
    const uniqueNewBets = importedBets.filter(ib => {
      if (ib.origin === "CSV") {
        const isDuplicate = bets.some(eb =>
          eb.dateTime === ib.dateTime &&
          Math.abs(safeNum(eb.stake) - safeNum(ib.stake)) < 0.01 &&
          Math.abs(safeNum(eb.odd) - safeNum(ib.odd)) < 0.01 &&
          eb.selections[0]?.event === ib.selections[0]?.event
        );
        return !isDuplicate;
      }
      return true;
    });

    if (uniqueNewBets.length === 0) {
      addLog("IMPORTACAO", "Nenhum novo boletim importado (todos já existiam).");
      return;
    }

    const created = await importBets(uniqueNewBets);
    if (created) {
      addLog("IMPORTACAO", `Sincronizados ${created.length} novos boletins de aposta via importação de ficheiro.`);
    }
  };

  // Logout: termina a sessão e volta a mostrar o ecrã de login
  const handleLogout = () => {
    setIsAccountOpen(false);
    logout();
    setCurrentUser(null);
    setAuthed(false);
  };

  // Gate de autenticação: enquanto não houver sessão válida, mostra só o AuthPage
  if (!authed) {
    return (
      <AuthPage
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setAuthed(true);
        }}
      />
    );
  }

  const activeNavItem = NAV_ITEMS.find(item => item.tab === activeTab);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-emerald-500/90 selection:text-zinc-950" id="main-container">

      {/* Sidebar (desktop) — navegação fixa à esquerda, estilo terminal */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-56 flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">

        {/* Marca */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-zinc-200 dark:border-zinc-800/80">
          <BrandMark size={30} />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight font-display">BetTrackr</h1>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-widest truncate">{t("app.brandTagline")}</p>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-mono">Menu</p>
          {NAV_ITEMS.map(({ tab, icon: Icon, navKey }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => navigateToTab(tab)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-xs font-semibold transition-colors cursor-pointer border-l-2 ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/8 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={15} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"} />
                {t(navKey)}
              </button>
            );
          })}
        </nav>

        {/* Rodapé da sidebar: estado de ligação */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
            <span className={isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </aside>

      {/* Coluna principal (com margem para a sidebar no desktop) */}
      <div className="md:pl-56 flex flex-col min-h-screen">

        {/* Topbar — título da secção + ações rápidas */}
        <header className="sticky top-0 z-40 h-14 md:h-12 shrink-0 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">

            {/* Mobile: marca | Desktop: título da secção ativa */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="md:hidden"><BrandMark size={28} /></span>
              <h1 className="md:hidden text-sm font-bold tracking-tight font-display">BetTrackr</h1>
              <h2 className="hidden md:block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                {activeNavItem ? t(activeNavItem.navKey) : ""}
              </h2>
            </div>

            <div className="flex items-center gap-2">

              {/* Estado de ligação (mobile — no desktop vive na sidebar) */}
              <span className={`md:hidden w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} title={isOnline ? "Online" : "Offline"}></span>

              {/* Alternar tema */}
              <button
                onClick={handleToggleTheme}
                title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
                aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
                className="flex items-center justify-center w-8 h-8 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Conta — abre o painel lateral com os detalhes e o logout */}
              <button
                onClick={() => setIsAccountOpen(true)}
                title={currentUser ? `${t("account.title")} (${currentUser.username})` : t("account.title")}
                aria-label={t("account.open")}
                className="flex items-center gap-2 pl-1 pr-1 sm:pr-2.5 h-8 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <span className="w-6 h-6 rounded-sm bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px] uppercase font-mono">
                  {currentUser?.username?.slice(0, 2) || "?"}
                </span>
                <span className="hidden sm:inline max-w-[9rem] truncate">{currentUser?.username}</span>
              </button>

            </div>
          </div>
        </header>

        {/* Corpo principal */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-5 pb-24 md:pb-6">

          {/* Global error banner */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 text-xs font-medium">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="p-1 rounded-sm text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400 dark:text-zinc-500 text-xs gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t("app.loadingBets")}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-24 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      A carregar…
                    </div>
                  }
                >
                {activeTab === "DASHBOARD" && (
                  <Dashboard
                    bets={bets}
                    currency={preferences.currency}
                    isDark={isDark}
                    onOpenBets={navigateToFilteredBets}
                    accounts={accounts}
                  />
                )}
                {activeTab === "BETS" && (
                  <BetsManager
                    bets={bets}
                    currency={preferences.currency}
                    onAddBet={handleAddBet}
                    onAddBets={handleDuplicateBets}
                    onUpdateBet={handleUpdateBet}
                    onDeleteBet={handleDeleteBet}
                    accounts={accounts}
                  />
                )}
                {activeTab === "IMPORT" && (
                  <ScreenshotImporter
                    currency={preferences.currency}
                    onAddBet={handleAddBet}
                  />
                )}
                {activeTab === "INSIGHTS" && (
                  <AIInsights onSessionExpired={handleSessionExpired} />
                )}
                {activeTab === "SOCIAL" && (
                  <Social currency={preferences.currency} isDark={isDark} />
                )}
                {activeTab === "SETTINGS" && (
                  <I18nProvider lang={preferences.language}>
                    <Settings
                      preferences={preferences}
                      auditLogs={auditLogs}
                      bets={bets}
                      currency={preferences.currency}
                      onUpdatePreferences={handleUpdatePreferences}
                      onClearData={handleClearData}
                      onResetDemoData={handleResetDemoData}
                      onImportCSV={handleImportCSV}
                      accounts={accounts}
                      accountsError={accountsError}
                      clearAccountsError={clearAccountsError}
                      onAddAccount={addAccount}
                      onRenameAccount={renameAccount}
                      onDeleteAccount={removeAccount}
                    />
                  </I18nProvider>
                )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Tab bar (mobile) — indicador de secção ativa na margem superior */}
        <footer className="md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800/80 fixed bottom-0 inset-x-0 z-40">
          <div className="grid grid-cols-6 h-16 text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
            {NAV_ITEMS.map(({ tab, icon: Icon, footerKey }) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => navigateToTab(tab)}
                  className={`relative flex flex-col items-center justify-center gap-1 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && <span className="absolute top-0 inset-x-3 h-0.5 rounded-b bg-emerald-500"></span>}
                  <Icon size={18} />
                  <span>{t(footerKey)}</span>
                </button>
              );
            })}
          </div>
        </footer>

      </div>

      {/* Painel lateral de conta */}
      <AccountPanel
        open={isAccountOpen}
        user={currentUser}
        language={preferences.language}
        t={t}
        onClose={() => setIsAccountOpen(false)}
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
      />

    </div>
  );
}

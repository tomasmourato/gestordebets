import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  Layers,
  Sparkles,
  Settings as SettingsIcon,
  Users,
  Moon,
  Sun,
  X,
  LogOut
} from "lucide-react";

import { Bet, Preferences } from "./types";
import { INITIAL_BETS, safeNum } from "./utils";

import Dashboard, { DashboardBetsFilters } from "./components/Dashboard";
import BetsManager from "./components/BetsManager";
import ScreenshotImporter from "./components/ScreenshotImporter";
import Settings from "./components/Settings";
import Social from "./components/Social";
import AuthPage from "./components/AuthPage";
import { isAuthenticated, logout, getStoredUser } from "./lib/authApi";
import { usePreferences } from "./hooks/usePreferences";
import { useTheme } from "./hooks/useTheme";
import { useAuditLog } from "./hooks/useAuditLog";
import { useBets } from "./hooks/useBets";
import { I18nProvider, translate } from "./lib/i18n";

type AppTab = "DASHBOARD" | "BETS" | "IMPORT" | "SOCIAL" | "SETTINGS";

const TAB_PATHS: Record<AppTab, string> = {
  DASHBOARD: "/dashboard",
  BETS: "/bets",
  IMPORT: "/import",
  SOCIAL: "/social",
  SETTINGS: "/settings"
};

const tabFromPath = (pathname: string): AppTab => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const matchingTab = (Object.entries(TAB_PATHS) as Array<[AppTab, string]>)
    .find(([, path]) => path === normalizedPath)?.[0];

  return matchingTab || "DASHBOARD";
};

export default function App() {

  // Autenticação: gate de login/registo antes de mostrar a app
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Cada área tem um URL próprio e continua a navegar como SPA.
  const [activeTab, setActiveTab] = useState<AppTab>(() => tabFromPath(window.location.pathname));

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white border-t-4 border-indigo-600" id="main-container">

      {/* Top Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded shadow-xs">
              <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight font-display">BetTrackr</h1>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t("app.brandTagline")}</p>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <button
              onClick={() => navigateToTab("DASHBOARD")}
              className={`px-3.5 py-2 rounded transition-colors ${activeTab === "DASHBOARD" ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {t("nav.overview")}
            </button>
            <button
              onClick={() => navigateToTab("BETS")}
              className={`px-3.5 py-2 rounded transition-colors ${activeTab === "BETS" ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {t("nav.bets")}
            </button>
            <button
              onClick={() => navigateToTab("IMPORT")}
              className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1 ${activeTab === "IMPORT" ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <Sparkles size={13} className="text-amber-500 animate-pulse" /> {t("nav.import")}
            </button>
            <button
              onClick={() => navigateToTab("SOCIAL")}
              className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1 ${activeTab === "SOCIAL" ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <Users size={13} /> {t("nav.social")}
            </button>
            <button
              onClick={() => navigateToTab("SETTINGS")}
              className={`px-3.5 py-2 rounded transition-colors ${activeTab === "SETTINGS" ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {t("nav.settings")}
            </button>
          </nav>

          {/* Connection Status & Theme Toggle */}
          <div className="flex items-center gap-2">

            {/* Online Status */}
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">Optimized</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-600 dark:text-rose-400 font-medium hidden sm:inline">Offline Mode</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
              aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
              className="flex items-center justify-center p-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title={currentUser ? `Sair (${currentUser.username})` : "Sair"}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </button>

          </div>

        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

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
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-xs gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
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
              {activeTab === "DASHBOARD" && (
                <Dashboard
                  bets={bets}
                  currency={preferences.currency}
                  isDark={isDark}
                  onOpenBets={navigateToFilteredBets}
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
                />
              )}
              {activeTab === "IMPORT" && (
                <ScreenshotImporter
                  currency={preferences.currency}
                  onAddBet={handleAddBet}
                />
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
                  />
                </I18nProvider>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Mobile Footer Tab Bar */}
      <footer className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-40 shrink-0 shadow-lg">
        <div className="grid grid-cols-5 h-16 text-[9px] font-bold text-slate-400 dark:text-slate-500">
          <button
            onClick={() => navigateToTab("DASHBOARD")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "DASHBOARD" ? "text-indigo-600 dark:text-indigo-400" : ""}`}
          >
            <TrendingUp size={18} />
            <span>{t("footer.panel")}</span>
          </button>
          <button
            onClick={() => navigateToTab("BETS")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "BETS" ? "text-indigo-600 dark:text-indigo-400" : ""}`}
          >
            <Layers size={18} />
            <span>{t("footer.bets")}</span>
          </button>
          <button
            onClick={() => navigateToTab("IMPORT")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "IMPORT" ? "text-indigo-600 dark:text-indigo-400" : ""}`}
          >
            <Sparkles size={18} className="text-amber-500 animate-pulse" />
            <span>{t("footer.ai")}</span>
          </button>
          <button
            onClick={() => navigateToTab("SOCIAL")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "SOCIAL" ? "text-indigo-600 dark:text-indigo-400" : ""}`}
          >
            <Users size={18} />
            <span>{t("footer.social")}</span>
          </button>
          <button
            onClick={() => navigateToTab("SETTINGS")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "SETTINGS" ? "text-indigo-600 dark:text-indigo-400" : ""}`}
          >
            <SettingsIcon size={18} />
            <span>{t("footer.settings")}</span>
          </button>
        </div>
      </footer>

    </div>
  );
}

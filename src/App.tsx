import { useState, useEffect, Suspense, lazy } from "react";

import { Bet, Preferences } from "./types";
import { INITIAL_BETS, safeNum } from "./utils";

import type { DashboardBetsFilters } from "./components/Dashboard";
import type { AppTab, ShellProps } from "./navigation";
import { TAB_PATHS, tabFromPath } from "./navigation";
import AuthPage from "./components/AuthPage";
import { isAuthenticated, logout, getStoredUser } from "./lib/authApi";
import { usePreferences } from "./hooks/usePreferences";
import { useTheme } from "./hooks/useTheme";
import { useAuditLog } from "./hooks/useAuditLog";
import { useBets } from "./hooks/useBets";
import { useAccounts } from "./hooks/useAccounts";
import { translate } from "./lib/i18n";
import { useMobileUI } from "./lib/platform";

// Os dois shells carregam sob demanda: cada plataforma só descarrega o seu
// próprio código de UI. A lógica (estado + handlers) vive toda aqui.
const DesktopApp = lazy(() => import("./DesktopApp"));
const MobileApp = lazy(() => import("./mobile/MobileApp"));
// Dev-only: galeria de primitivos mobile (?gallery=1). Removida na Fase 5.
const Gallery = lazy(() => import("./mobile/ui/Gallery"));

export default function App() {

  // Galeria de desenvolvimento dos primitivos, fora do gate de autenticação.
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gallery") === "1") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" />}>
        <Gallery />
      </Suspense>
    );
  }


  // Autenticação: gate de login/registo antes de mostrar a app
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Escolhe o shell (desktop vs mobile nativa-feel).
  const isMobileUI = useMobileUI();

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
    refresh: refreshBets,
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

  // Contrato partilhado injetado no shell escolhido.
  const shellProps: ShellProps = {
    activeTab,
    navigateToTab,
    navigateToFilteredBets,
    currentUser,
    isAccountOpen,
    setIsAccountOpen,
    onLogout: handleLogout,
    onSessionExpired: handleSessionExpired,
    preferences,
    onUpdatePreferences: handleUpdatePreferences,
    isDark,
    onToggleTheme: handleToggleTheme,
    t,
    isOnline,
    bets,
    isLoading,
    error,
    clearError,
    onRefresh: refreshBets,
    onAddBet: handleAddBet,
    onUpdateBet: handleUpdateBet,
    onDeleteBet: handleDeleteBet,
    onDuplicateBets: handleDuplicateBets,
    onImportCSV: handleImportCSV,
    onClearData: handleClearData,
    onResetDemoData: handleResetDemoData,
    accounts,
    accountsError,
    clearAccountsError,
    onAddAccount: addAccount,
    onRenameAccount: renameAccount,
    onDeleteAccount: removeAccount,
    auditLogs,
  };

  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" />}>
      {isMobileUI ? <MobileApp {...shellProps} /> : <DesktopApp {...shellProps} />}
    </Suspense>
  );
}

import { useState, useEffect, Suspense, lazy } from "react";

import { Bet, Preferences } from "./types";
import { INITIAL_BETS, safeNum } from "./utils";

import type { DashboardBetsFilters } from "./components/Dashboard";
import type { AppTab, ShellProps } from "./navigation";
import { TAB_PATHS, tabFromPath } from "./navigation";
import { serializeFilters } from "./lib/filterParams";
import AuthPage from "./components/AuthPage";
import { isAuthenticated, logout, getStoredUser, restoreBrowserSession } from "./lib/authApi";
import { usePreferences, DEFAULT_PREFERENCES } from "./hooks/usePreferences";
import { useTheme } from "./hooks/useTheme";
import { useAuditLog } from "./hooks/useAuditLog";
import { useBets } from "./hooks/useBets";
import { useAccounts } from "./hooks/useAccounts";
import { translate } from "./lib/i18n";
import { useMobileUI } from "./lib/platform";
import type { InitialAppData } from "./initialData";

// Os dois shells carregam sob demanda: cada plataforma só descarrega o seu
// próprio código de UI. A lógica (estado + handlers) vive toda aqui.
const DesktopApp = lazy(() => import("./DesktopApp"));
const MobileApp = lazy(() => import("./mobile/MobileApp"));
// Dev-only: galeria de primitivos mobile (?gallery=1). Removida na Fase 5.
const Gallery = lazy(() => import("./mobile/ui/Gallery"));

interface AppProps {
  initialData?: InitialAppData;
}

export default function App({ initialData }: AppProps) {

  // Galeria de desenvolvimento dos primitivos, fora do gate de autenticação.
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gallery") === "1") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" />}>
        <Gallery />
      </Suspense>
    );
  }


  // Autenticação: gate de login/registo antes de mostrar a app
  const [authed, setAuthed] = useState<boolean>(() =>
    initialData ? initialData.authenticated : isAuthenticated()
  );
  const [currentUser, setCurrentUser] = useState(() =>
    initialData ? initialData.user : getStoredUser()
  );

  // Escolhe o shell (desktop vs mobile nativa-feel).
  const isMobileUIRaw = useMobileUI();

  // Cada área tem um URL próprio e continua a navegar como SPA.
  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    tabFromPath(initialData?.pathname ?? window.location.pathname)
  );
  const [locationSearch, setLocationSearch] = useState(() =>
    initialData?.search ?? window.location.search
  );
  const [routeAnimationsReady, setRouteAnimationsReady] = useState(false);

  // Painel lateral de conta (detalhes do utilizador + terminar sessão).
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const navigateToTab = (tab: AppTab) => {
    const nextPath = TAB_PATHS[tab];
    const isSameTab = tab === activeTab;
    const hadFilters = Boolean(window.location.search);

    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({ tab }, "", nextPath);
    }
    setActiveTab(tab);
    setLocationSearch("");

    // Clicar no separador já ativo limpa os filtros. Como a página não é
    // remontada, não chega mudar `initialSearch` (só é lido no arranque) — o
    // popstate é o mesmo canal que o back/forward usa para reaplicar o URL.
    if (isSameTab && hadFilters) {
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const navigateToFilteredBets = (filters: DashboardBetsFilters) => {
    // Serializado pelo mesmo helper que o histórico usa: o URL do drill-down
    // fica igual ao que a página produziria sozinha, por isso ao montar não há
    // divergência (nem uma entrada de histórico extra para a corrigir).
    const search = serializeFilters({
      status: filters.status,
      bookmaker: filters.bookmaker ?? "ALL",
      account: filters.account ?? "ALL",
      sport: filters.sport ?? "ALL",
      type: filters.type ?? "ALL",
      money: filters.money ?? "ALL",
      timeframe: {
        timeframe: filters.timeframe ?? "ALL",
        startDate: filters.dateFrom ?? "",
        endDate: filters.dateTo ?? "",
      },
    });
    window.history.pushState({ tab: "BETS" }, "", `${TAB_PATHS.BETS}${search}`);
    setActiveTab("BETS");
    setLocationSearch(search);
  };

  // Preferências (armazenamento local) e auditoria (em memória)
  const { preferences, updatePreferences } = usePreferences(
    initialData ? DEFAULT_PREFERENCES : undefined
  );
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
    ignoreBet,
    removeBet,
    clearAllBets,
    replaceAllBets
  } = useBets(
    authed,
    handleSessionExpired,
    initialData?.authenticated ? initialData.bets : undefined
  );

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
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  // One-time migration for sessions created before the SSR cookie existed.
  // A valid local bearer token is verified by /me, which also sets the cookie
  // used by the next document request.
  useEffect(() => {
    if (!initialData || initialData.authenticated || !isAuthenticated()) return;
    let cancelled = false;
    restoreBrowserSession()
      .then((user) => {
        if (!cancelled && user) {
          setCurrentUser(user);
          setAuthed(true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  useEffect(() => {
    setRouteAnimationsReady(true);
  }, []);

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
    const syncTabWithUrl = () => {
      setActiveTab(tabFromPath(window.location.pathname));
      setLocationSearch(window.location.search);
    };

    // Normaliza a página inicial e URLs desconhecidos para a visão geral.
    // A query string é preservada: agora descreve os filtros e um link
    // partilhado tipo "/bets/?status=GANHA" não pode perdê-los ao normalizar.
    const currentTab = tabFromPath(window.location.pathname);
    if (window.location.pathname !== TAB_PATHS[currentTab]) {
      window.history.replaceState(
        { tab: currentTab },
        "",
        `${TAB_PATHS[currentTab]}${window.location.search}`
      );
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

  const handleIgnoreBet = async (id: string, ignored: boolean, comment?: string | null) => {
    const updated = await ignoreBet(id, ignored, comment);
    if (updated) {
      addLog(
        ignored ? "IGNORAR_APOSTA" : "REPOR_APOSTA",
        `Aposta #${updated.id.substring(0, 8)} ${ignored ? "ignorada (excluída das estatísticas)" : "reposta nas estatísticas"}.`
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

  // O documento SSR é sempre renderizado com o shell desktop (o servidor não
  // conhece o viewport). Para a hidratação bater certo, o primeiro render no
  // cliente usa também o desktop quando há initialData; o shell certo entra
  // logo após montar (routeAnimationsReady vira true no primeiro effect).
  const isMobileUI = initialData && !routeAnimationsReady ? false : isMobileUIRaw;

  // Contrato partilhado injetado no shell escolhido.
  const shellProps: ShellProps = {
    activeTab,
    locationSearch,
    routeAnimationsReady,
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
    onIgnoreBet: handleIgnoreBet,
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


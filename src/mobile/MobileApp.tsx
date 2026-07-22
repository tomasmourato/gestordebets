import { Suspense, lazy, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, X } from "lucide-react";

import { BrandMark } from "../components/BrandMark";
import { NAV_ITEMS, type ShellProps, type AppTab } from "../navigation";
import { tapHaptic } from "../lib/haptics";
import { useNativeChrome, useAndroidBackButton, exitNativeApp } from "./lib/useNativeChrome";
import { runTopBackHandler } from "./lib/backStack";
import { ToastProvider, useToast, Pressable, PullToRefresh } from "./ui";
import { AccountSheet } from "./AccountSheet";

// Ecrãs: à medida que a Fase 4 avança, cada separador passa a apontar para o
// ecrã mobile dedicado (src/mobile/screens/*). Os que ainda não foram
// redesenhados continuam a usar o componente desktop dentro do shell mobile.
const MobileDashboard = lazy(() => import("./screens/MobileDashboard"));
const MobileBets = lazy(() => import("./screens/MobileBets"));
const MobileImport = lazy(() => import("./screens/MobileImport"));
const MobileSettings = lazy(() => import("./screens/MobileSettings"));
const MobileSocial = lazy(() => import("./screens/MobileSocial"));
const MobileInsights = lazy(() => import("./screens/MobileInsights"));

// Casca mobile real. Dentro do ToastProvider para os toasts (e o aviso de
// duplo-back) funcionarem em toda a árvore.
function MobileShell(props: ShellProps) {
  const {
    activeTab,
    navigateToTab,
    navigateToFilteredBets,
    currentUser,
    isAccountOpen,
    setIsAccountOpen,
    onLogout,
    onSessionExpired,
    preferences,
    onUpdatePreferences,
    isDark,
    onToggleTheme,
    t,
    isOnline,
    bets,
    isLoading,
    error,
    clearError,
    onRefresh,
    onAddBet,
    onUpdateBet,
    onIgnoreBet,
    onDeleteBet,
    onDuplicateBets,
    onImportCSV,
    onClearData,
    onResetDemoData,
    accounts,
    accountsError,
    clearAccountsError,
    onAddAccount,
    onRenameAccount,
    onDeleteAccount,
    auditLogs,
  } = props;

  const toast = useToast();
  const lastBackRef = useRef(0);

  // Status bar edge-to-edge + estilo por tema, e esconder o splash.
  useNativeChrome(isDark);

  // Botão "voltar" do Android: 1) fecha o que estiver sobreposto (sheets,
  // conta) via backStack; 2) volta ao Dashboard; 3) duplo toque em 2s sai.
  const handleBack = useCallback(() => {
    if (isAccountOpen) {
      setIsAccountOpen(false);
      return;
    }
    if (runTopBackHandler()) return;
    if (activeTab !== "DASHBOARD") {
      navigateToTab("DASHBOARD");
      return;
    }
    const now = Date.now();
    if (now - lastBackRef.current < 2000) {
      void exitNativeApp();
    } else {
      lastBackRef.current = now;
      toast.show("Toque outra vez para sair", "info");
    }
  }, [isAccountOpen, setIsAccountOpen, activeTab, navigateToTab, toast]);

  useAndroidBackButton(handleBack);

  const switchTab = (tab: AppTab) => {
    if (tab !== activeTab) void tapHaptic("light");
    navigateToTab(tab);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-emerald-500/90 selection:text-zinc-950">

      {/* Topbar */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur pt-safe">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size={28} />
            <h1 className="text-sm font-bold tracking-tight font-display">BetTrackr</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} title={isOnline ? "Online" : "Offline"}></span>
            <Pressable
              as="button"
              onClick={onToggleTheme}
              aria-label={isDark ? "Tema claro" : "Tema escuro"}
              className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-500 dark:text-zinc-400"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </Pressable>
            <Pressable
              as="button"
              onClick={() => setIsAccountOpen(true)}
              aria-label={t("account.open")}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase font-mono"
            >
              {currentUser?.username?.slice(0, 2) || "?"}
            </Pressable>
          </div>
        </div>
      </header>

      {/* Corpo */}
      <main className="w-full px-4 py-4 pb-[calc(5rem+var(--safe-bottom))]">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 text-xs font-medium">
            <span>{error}</span>
            <button onClick={clearError} className="p-1 rounded-full text-rose-500 cursor-pointer" title="Fechar">
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
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
                  <PullToRefresh onRefresh={onRefresh}>
                    <MobileDashboard bets={bets} currency={preferences.currency} isDark={isDark} accounts={accounts} onOpenBets={navigateToFilteredBets} />
                  </PullToRefresh>
                )}
                {activeTab === "BETS" && (
                  <PullToRefresh onRefresh={onRefresh}>
                    <MobileBets bets={bets} currency={preferences.currency} onAddBet={onAddBet} onAddBets={onDuplicateBets} onUpdateBet={onUpdateBet} onIgnoreBet={onIgnoreBet} onDeleteBet={onDeleteBet} accounts={accounts} />
                  </PullToRefresh>
                )}
                {activeTab === "IMPORT" && (
                  <MobileImport currency={preferences.currency} onAddBet={onAddBet} />
                )}
                {activeTab === "INSIGHTS" && <MobileInsights onSessionExpired={onSessionExpired} />}
                {activeTab === "SOCIAL" && <MobileSocial currency={preferences.currency} isDark={isDark} />}
                {activeTab === "SETTINGS" && (
                  <MobileSettings
                    preferences={preferences}
                    auditLogs={auditLogs}
                    bets={bets}
                    currency={preferences.currency}
                    onUpdatePreferences={onUpdatePreferences}
                    onClearData={onClearData}
                    onResetDemoData={onResetDemoData}
                    onImportCSV={onImportCSV}
                    accounts={accounts}
                    accountsError={accountsError}
                    clearAccountsError={clearAccountsError}
                    onAddAccount={onAddAccount}
                    onRenameAccount={onRenameAccount}
                    onDeleteAccount={onDeleteAccount}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Tab bar */}
      <nav className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800/80 fixed bottom-0 inset-x-0 z-40 pb-safe">
        <div className="grid grid-cols-6 h-16 text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
          {NAV_ITEMS.map(({ tab, icon: Icon, footerKey }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`relative flex flex-col items-center justify-center gap-1 active:bg-zinc-100 dark:active:bg-zinc-900 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.span layoutId="mobile-tab-indicator" className="absolute top-0 inset-x-3 h-0.5 rounded-b bg-emerald-500" />
                )}
                <Icon size={19} />
                <span>{t(footerKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AccountSheet
        open={isAccountOpen}
        user={currentUser}
        language={preferences.language}
        t={t}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onClose={() => setIsAccountOpen(false)}
        onLogout={onLogout}
        onSessionExpired={onSessionExpired}
      />
    </div>
  );
}

export default function MobileApp(props: ShellProps) {
  return (
    <ToastProvider>
      <MobileShell {...props} />
    </ToastProvider>
  );
}

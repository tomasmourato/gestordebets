import { Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, X } from "lucide-react";

import { BrandMark } from "./components/BrandMark";
import { NAV_ITEMS, type ShellProps } from "./navigation";
import AccountPanel from "./components/AccountPanel";
import { I18nProvider } from "./lib/i18n";

// Os separadores carregam sob demanda (React.lazy): o shell pinta sem
// descarregar/parsear o Recharts (~390KB) nem o resto.
const Dashboard = lazy(() => import("./components/Dashboard"));
const BetsManager = lazy(() => import("./components/BetsManager"));
const ScreenshotImporter = lazy(() => import("./components/ScreenshotImporter"));
const Settings = lazy(() => import("./components/Settings"));
const Social = lazy(() => import("./components/Social"));
const AIInsights = lazy(() => import("./components/AIInsights"));

// Shell desktop: navegação fixa à esquerda (sidebar) + topbar + tab bar de
// recurso em ecrãs estreitos. Toda a lógica vive no App.tsx; aqui só a
// apresentação, alimentada pelo ShellProps.
export default function DesktopApp({
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
  onAddBet,
  onUpdateBet,
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
}: ShellProps) {
  const activeNavItem = NAV_ITEMS.find((item) => item.tab === activeTab);

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
                onClick={onToggleTheme}
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
                    onAddBet={onAddBet}
                    onAddBets={onDuplicateBets}
                    onUpdateBet={onUpdateBet}
                    onDeleteBet={onDeleteBet}
                    accounts={accounts}
                  />
                )}
                {activeTab === "IMPORT" && (
                  <ScreenshotImporter
                    currency={preferences.currency}
                    onAddBet={onAddBet}
                  />
                )}
                {activeTab === "INSIGHTS" && (
                  <AIInsights onSessionExpired={onSessionExpired} />
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
        onLogout={onLogout}
        onSessionExpired={onSessionExpired}
      />

    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  Layers, 
  Award, 
  Sparkles, 
  Settings as SettingsIcon, 
  Check, 
  Wifi, 
  WifiOff, 
  Smartphone,
  CloudLightning,
  Coins,
  History,
  X
} from "lucide-react";

import { Bet, Preferences, AuditLog } from "./types";
import { INITIAL_BETS, safeNum } from "./utils";

import Dashboard from "./components/Dashboard";
import BetsManager from "./components/BetsManager";
import ScreenshotImporter from "./components/ScreenshotImporter";
import Settings from "./components/Settings";

export default function App() {
  
  // Tabs: 'DASHBOARD' | 'BETS' | 'IMPORT' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<string>("DASHBOARD");

  // Primary persistent states
  const [bets, setBets] = useState<Bet[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    currency: "€",
    defaultBookmaker: "Betano",
    defaultStake: 10
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Native PWA Install Flow emulation & Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPWAInstall, setShowPWAInstall] = useState(true);
  const [pwaInstallStatus, setPwaInstallStatus] = useState<"READY" | "INSTALLED" | "HIDDEN">("READY");
  const [syncStatus, setSyncStatus] = useState<"SYNCHRONIZED" | "PENDING">("SYNCHRONIZED");

  // Track online/offline status
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Simulate background syncing of pending operations if offline changes were made
      if (syncStatus === "PENDING") {
        setTimeout(() => {
          setSyncStatus("SYNCHRONIZED");
          addAuditLog("SINCRONIZAÇÃO", "Aplicações sincronizadas com a nuvem após restabelecimento de ligação.");
        }, 2000);
      }
    };
    const goOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [syncStatus]);

  // Initial state loader
  useEffect(() => {
    const savedBets = localStorage.getItem("g_bets");
    const savedPrefs = localStorage.getItem("g_prefs");
    const savedLogs = localStorage.getItem("g_logs");

    if (savedBets) {
      setBets(JSON.parse(savedBets));
    } else {
      setBets(INITIAL_BETS);
      localStorage.setItem("g_bets", JSON.stringify(INITIAL_BETS));
    }

    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    if (savedLogs) {
      setAuditLogs(JSON.parse(savedLogs));
    } else {
      const initialLogs: AuditLog[] = [
        {
          id: "log-1",
          timestamp: new Date().toISOString(),
          action: "SISTEMA",
          details: "Aplicação inicializada com dados de demonstração."
        }
      ];
      setAuditLogs(initialLogs);
      localStorage.setItem("g_logs", JSON.stringify(initialLogs));
    }
  }, []);

  // Save states helper
  const saveBetsToStorage = (updatedBets: Bet[]) => {
    setBets(updatedBets);
    localStorage.setItem("g_bets", JSON.stringify(updatedBets));
    if (!isOnline) {
      setSyncStatus("PENDING");
    }
  };

  // Add audit logs
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details
    };
    const updated = [newLog, ...auditLogs].slice(0, 50); // Keep last 50
    setAuditLogs(updated);
    localStorage.setItem("g_logs", JSON.stringify(updated));
  };

  // ----------------------------------------------------
  // BET OPERATIONS
  // ----------------------------------------------------
  
  const handleAddBet = (newBet: Bet) => {
    const updatedBets = [newBet, ...bets];
    saveBetsToStorage(updatedBets);

    addAuditLog(
      "ADICIONAR_APOSTA", 
      `Aposta no evento "${newBet.selections[0]?.event || "Múltipla"}" registada com stake de ${newBet.stake}${preferences.currency}.`
    );
  };

  const handleUpdateBet = (updatedBet: Bet) => {
    const updatedBets = bets.map(b => (b.id === updatedBet.id ? updatedBet : b));
    saveBetsToStorage(updatedBets);

    addAuditLog(
      "ATUALIZAR_APOSTA", 
      `Aposta #${updatedBet.id.substring(0, 8)} editada e recalculada (Lucro: ${updatedBet.netProfit}${preferences.currency}).`
    );
  };

  const handleDeleteBet = (id: string) => {
    const betToDelete = bets.find(b => b.id === id);
    if (!betToDelete) return;

    const updatedBets = bets.filter(b => b.id !== id);
    saveBetsToStorage(updatedBets);

    addAuditLog(
      "REMOVER_APOSTA", 
      `Aposta no evento "${betToDelete.selections[0]?.event || "Múltipla"}" apagada com sucesso.`
    );
  };

  // ----------------------------------------------------
  // PREFERENCES & GENERAL OPERATIONS
  // ----------------------------------------------------

  const handleUpdatePreferences = (updatedPrefs: Preferences) => {
    setPreferences(updatedPrefs);
    localStorage.setItem("g_prefs", JSON.stringify(updatedPrefs));
    addAuditLog("PREFERENCIAS", "Preferências gerais da aplicação atualizadas.");
  };

  const handleClearData = () => {
    saveBetsToStorage([]);
    addAuditLog("LIMPAR_DADOS", "Base de dados limpa na totalidade.");
  };

  const handleResetDemoData = () => {
    saveBetsToStorage(INITIAL_BETS);
    addAuditLog("REPOR_DADOS", "Dados de demonstração originais repostos com sucesso.");
  };

  const handleImportCSV = (importedBets: Bet[]) => {
    if (importedBets.length > 0) {
      const mergedMap = new Map<string, Bet>();
      
      // Populate map with existing bets
      bets.forEach(b => mergedMap.set(b.id, b));

      // Merge imported bets, filtering duplicates
      let addedCount = 0;
      importedBets.forEach(ib => {
        if (ib.origin === "CSV") {
          const isDuplicate = bets.some(eb => 
            eb.dateTime === ib.dateTime &&
            Math.abs(safeNum(eb.stake) - safeNum(ib.stake)) < 0.01 &&
            Math.abs(safeNum(eb.odd) - safeNum(ib.odd)) < 0.01 &&
            eb.selections[0]?.event === ib.selections[0]?.event
          );
          if (!isDuplicate) {
            mergedMap.set(ib.id, ib);
            addedCount++;
          }
        } else {
          mergedMap.set(ib.id, ib);
          addedCount++;
        }
      });

      const mergedList = Array.from(mergedMap.values());
      
      // Sort descending by date
      mergedList.sort((a, b) => {
        const timeA = a.dateTime ? new Date(a.dateTime.replace(/-/g, "/")).getTime() : 0;
        const timeB = b.dateTime ? new Date(b.dateTime.replace(/-/g, "/")).getTime() : 0;
        return timeB - timeA;
      });

      saveBetsToStorage(mergedList);
      addAuditLog("IMPORTACAO", `Sincronizados ${addedCount} novos boletins de aposta via importação de ficheiro.`);
    } else {
      addAuditLog("IMPORTACAO", `Nenhum boletim de aposta importado (lista vazia).`);
    }
  };

  // PWA Mock install
  const handleInstallPWA = () => {
    setPwaInstallStatus("INSTALLED");
    addAuditLog("PWA", "Aplicação instalada com sucesso no dispositivo do utilizador.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-600 selection:text-white border-t-4 border-indigo-600" id="main-container">
      
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded shadow-xs">
              <div className="w-3.5 h-3.5 bg-white rotate-45"></div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight font-display">BetTrackr</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Gestão de Apostas</p>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`px-3.5 py-2 rounded transition-colors ${activeTab === "DASHBOARD" ? "bg-indigo-50 text-indigo-700 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 hover:bg-slate-50"}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("BETS")}
              className={`px-3.5 py-2 rounded transition-colors ${activeTab === "BETS" ? "bg-indigo-50 text-indigo-700 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 hover:bg-slate-50"}`}
            >
              Meus Boletins
            </button>
            <button
              onClick={() => setActiveTab("IMPORT")}
              className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1 ${activeTab === "IMPORT" ? "bg-indigo-50 text-indigo-700 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 hover:bg-slate-50"}`}
            >
              <Sparkles size={13} className="text-amber-500 animate-pulse" /> Importar com IA
            </button>
            <button
              onClick={() => setActiveTab("SETTINGS")}
              className={`px-3.5 py-2 rounded transition-colors ${activeTab === "SETTINGS" ? "bg-indigo-50 text-indigo-700 border-l-2 md:border-l-0 md:border-b-2 border-indigo-600" : "hover:text-slate-800 hover:bg-slate-50"}`}
            >
              Configurações
            </button>
          </nav>

          {/* Connection Status & PWA Emulation Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Sync Queue Badge */}
            {syncStatus === "PENDING" && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                Modificações Locais
              </span>
            )}

            {/* Online Status */}
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-600 font-medium hidden sm:inline">Optimized</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-600 font-medium hidden sm:inline">Offline Mode</span>
              </div>
            )}

            {/* Install PWA Prompt Button */}
            {pwaInstallStatus === "READY" && showPWAInstall && (
              <button
                onClick={handleInstallPWA}
                className="hidden sm:flex items-center gap-1 px-4 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 transition-colors"
              >
                <Smartphone size={12} /> Instalar
              </button>
            )}
            
            {pwaInstallStatus === "INSTALLED" && (
              <span className="hidden sm:inline-block px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold">
                ✓ APP ATIVA
              </span>
            )}

          </div>

        </div>
      </header>

      {/* PWA Mobile Banner Warning */}
      {pwaInstallStatus === "READY" && showPWAInstall && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-3 sm:hidden shadow-md">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-indigo-400 shrink-0" />
            <p>Usa a app no teu ecrã inicial de forma offline e rápida!</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleInstallPWA}
              className="bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded font-bold"
            >
              Instalar
            </button>
            <button 
              onClick={() => setShowPWAInstall(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              />
            )}
            {activeTab === "BETS" && (
              <BetsManager 
                bets={bets} 
                currency={preferences.currency}
                onAddBet={handleAddBet}
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
            {activeTab === "SETTINGS" && (
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
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Footer Tab Bar */}
      <footer className="md:hidden bg-white border-t border-slate-100 sticky bottom-0 z-40 shrink-0 shadow-lg">
        <div className="grid grid-cols-4 h-16 text-[9px] font-bold text-slate-400">
          <button
            onClick={() => setActiveTab("DASHBOARD")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "DASHBOARD" ? "text-indigo-600" : ""}`}
          >
            <TrendingUp size={18} />
            <span>Painel</span>
          </button>
          <button
            onClick={() => setActiveTab("BETS")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "BETS" ? "text-indigo-600" : ""}`}
          >
            <Layers size={18} />
            <span>Boletins</span>
          </button>
          <button
            onClick={() => setActiveTab("IMPORT")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "IMPORT" ? "text-indigo-600" : ""}`}
          >
            <Sparkles size={18} className="text-amber-500 animate-pulse" />
            <span>IA</span>
          </button>
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`flex flex-col items-center justify-center gap-1 ${activeTab === "SETTINGS" ? "text-indigo-600" : ""}`}
          >
            <SettingsIcon size={18} />
            <span>Ajustes</span>
          </button>
        </div>
      </footer>

    </div>
  );
}

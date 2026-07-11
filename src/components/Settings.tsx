import React, { useState } from "react";
import { 
  Download, 
  Upload, 
  Trash2, 
  Settings as SettingsIcon, 
  RefreshCw, 
  FileSpreadsheet, 
  History, 
  AlertTriangle,
  Info,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { Preferences, AuditLog, Bet, BetStatus, Selection, BetType, ThemeMode } from "../types";
import { calculateBetReturnAndProfit, safeNum } from "../utils";
import BetclicImport from "./BetclicImport";

interface SettingsProps {
  preferences: Preferences;
  auditLogs: AuditLog[];
  bets: Bet[];
  currency: string;
  onUpdatePreferences: (prefs: Preferences) => void;
  onClearData: () => void;
  onResetDemoData: () => void;
  onImportCSV: (bets: Bet[]) => void;
}

export default function Settings({
  preferences,
  auditLogs,
  bets,
  currency,
  onUpdatePreferences,
  onClearData,
  onResetDemoData,
  onImportCSV
}: SettingsProps) {
  
  // Local preferences fields
  const [localCurrency, setLocalCurrency] = useState(preferences.currency);
  const [localBookmaker, setLocalBookmaker] = useState(preferences.defaultBookmaker);
  const [localStake, setLocalStake] = useState(preferences.defaultStake.toString());

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const stakeNum = parseFloat(localStake);
    if (isNaN(stakeNum) || stakeNum < 0) {
      setErrorMsg("Por favor insira uma stake padrão válida.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setErrorMsg(null);
    onUpdatePreferences({
      ...preferences,
      currency: localCurrency,
      defaultBookmaker: localBookmaker,
      defaultStake: stakeNum
    });

    setSuccessMsg("Preferências guardadas com sucesso!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // O tema aplica-se imediatamente (sem passar pelo botão "Guardar"), para
  // que o utilizador veja o efeito enquanto escolhe. Também evita que este
  // formulário reverta uma mudança feita pelo botão de tema no cabeçalho.
  const handleThemeChange = (theme: ThemeMode) => {
    onUpdatePreferences({ ...preferences, theme });
  };

  // Export Bets and Freebets to CSV
  const handleExportCSV = () => {
    let csvContent = "DATE;TIME;GAME;BET;STAKE;ODDS;STATUS;SPORT;BOOKIE;BETTYPE;COMMENT;TAGS\n";

    bets.forEach((b) => {
      // Split dateTime into DATE and TIME
      let dateVal = "";
      let timeVal = "";
      if (b.dateTime) {
        const parts = b.dateTime.split(" ");
        dateVal = parts[0] || "";
        timeVal = parts[1] || "";
      }

      // GAME
      const gameVal = b.selections.map(s => s.event).join(" + ");

      // BET
      const betVal = b.selections.map(s => s.choice).join(" + ");

      // STAKE
      const stakeVal = safeNum(b.stake).toFixed(2);

      // ODDS
      const oddsVal = safeNum(b.odd).toFixed(3);

      // STATUS
      let statusVal = "PENDING";
      if (b.status === "GANHA") statusVal = "WON";
      else if (b.status === "PERDIDA") statusVal = "LOST";
      else if (b.status === "ANULADA") statusVal = "VOID";
      else if (b.status === "MEIO_GANHA") statusVal = "WON";
      else if (b.status === "MEIO_PERDIDA") statusVal = "LOST";
      else if (b.status === "POR_LIQUIDAR") statusVal = "POR_LIQUIDAR";

      // SPORT
      let sportVal = b.selections.map(s => s.sport || "FUTEBOL").join(" + ");
      if (!sportVal || sportVal.trim() === "" || sportVal.includes("undefined")) {
        const textToTest = (gameVal + " " + betVal + " " + (b.notes || "")).toLowerCase();
        if (textToTest.includes("nba") || textToTest.includes("knicks") || textToTest.includes("celtics") || textToTest.includes("lakers") || textToTest.includes("spurs") || textToTest.includes("basket") || textToTest.includes("basquet")) {
          sportVal = "BASQUETEBOL";
        } else if (textToTest.includes("alcaraz") || textToTest.includes("zverev") || textToTest.includes("sinner") || textToTest.includes("nadal") || textToTest.includes("borges") || textToTest.includes("tenis") || textToTest.includes("ténis") || textToTest.includes("set")) {
          sportVal = "TÉNIS";
        } else if (textToTest.includes("futsal") || textToTest.includes("sporting cp - cartenga")) {
          sportVal = "FUTSAL";
        } else {
          sportVal = "FUTEBOL";
        }
      }

      // BOOKIE
      const bookieVal = b.bookmaker || "Outro";

      // BETTYPE
      let betTypeVal = b.type === "MULTIPLA" ? "Múltipla" : (b.selections[0]?.betType || b.selections[0]?.market || "Simples");
      if (b.type === "MULTIPLA" && b.selections.length > 1) {
        const subTypes = b.selections.map(s => s.betType || s.market || "Simples");
        betTypeVal = subTypes.join(" + ");
      }

      // COMMENT & TAGS
      const commentVal = b.comment || b.notes || "";
      const tagsVal = b.tags || "";

      // Helper to quote field
      const escapeField = (val: string) => {
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const dateField = dateVal;
      const timeField = timeVal;
      const gameField = escapeField(gameVal);
      const betField = escapeField(betVal);
      const stakeField = stakeVal;
      const oddsField = oddsVal;
      const statusField = statusVal;
      const sportField = sportVal;
      const bookieField = bookieVal;
      const betTypeField = betTypeVal;
      const commentField = escapeField(commentVal);
      const tagsField = escapeField(tagsVal);

      csvContent += `${dateField};${timeField};${gameField};${betField};${stakeField};${oddsField};${statusField};${sportField};${bookieField};${betTypeField};${commentField};${tagsField}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "apostas_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple helper to parse a CSV row handling double quotes correctly
  const parseCSVRow = (rowText: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => {
      let cleaned = val;
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      return cleaned.replace(/""/g, '"');
    });
  };

  // Import JSON / CSV (We'll provide JSON backup which is more comprehensive, but label it CSV/Backup as requested by prompt)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        // Let's check if it's JSON backup first (recommended for complex objects) or basic parsing
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          const parsed = JSON.parse(text);
          if (parsed.bets) {
            onImportCSV(parsed.bets);
            setSuccessMsg("Backup importado com sucesso!");
            setTimeout(() => setSuccessMsg(null), 4000);
          } else if (Array.isArray(parsed)) {
            // Assume just bets list
            onImportCSV(parsed);
            setSuccessMsg("Apostas importadas com sucesso!");
            setTimeout(() => setSuccessMsg(null), 4000);
          } else {
            throw new Error("Formato inválido.");
          }
        } else {
          // Fallback simple CSV parsing
          let cleanedText = text.replace(/^\uFEFF/, "");
          const lines = cleanedText.split(/\r?\n/).filter(line => line.trim() !== "");
          if (lines.length > 0) {
            const headerRow = parseCSVRow(lines[0]);
            const dateIdx = headerRow.findIndex(h => h.toUpperCase() === "DATE");
            const timeIdx = headerRow.findIndex(h => h.toUpperCase() === "TIME");
            const gameIdx = headerRow.findIndex(h => h.toUpperCase() === "GAME");
            const betIdx = headerRow.findIndex(h => h.toUpperCase() === "BET");
            const stakeIdx = headerRow.findIndex(h => h.toUpperCase() === "STAKE");
            const oddsIdx = headerRow.findIndex(h => h.toUpperCase() === "ODDS");
            const statusIdx = headerRow.findIndex(h => h.toUpperCase() === "STATUS");
            const sportIdx = headerRow.findIndex(h => h.toUpperCase() === "SPORT");
            const bookieIdx = headerRow.findIndex(h => h.toUpperCase() === "BOOKIE");
            const betTypeIdx = headerRow.findIndex(h => h.toUpperCase() === "BETTYPE");
            const commentIdx = headerRow.findIndex(h => h.toUpperCase() === "COMMENT");
            const tagsIdx = headerRow.findIndex(h => h.toUpperCase() === "TAGS");

            // Ensure basic columns exist
            if (dateIdx === -1 || gameIdx === -1 || stakeIdx === -1 || oddsIdx === -1) {
              throw new Error("Formato de CSV inválido. Colunas obrigatórias DATE, GAME, STAKE, ODDS não encontradas.");
            }

            const parsedBets: Bet[] = [];
            for (let i = 1; i < lines.length; i++) {
              const row = parseCSVRow(lines[i]);
              if (row.length < 4) continue; // Skip empty rows

              const dateVal = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : "";
              const timeVal = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : "00:00";
              const gameVal = gameIdx !== -1 && row[gameIdx] ? row[gameIdx] : "";
              const betVal = betIdx !== -1 && row[betIdx] ? row[betIdx] : "";
              
              // Clean stakes and odds from potentially using European comma decimal separator
              const rawStake = stakeIdx !== -1 && row[stakeIdx] ? row[stakeIdx] : "1.00";
              const stakeVal = parseFloat(rawStake.replace(",", "."));
              
              const rawOdds = oddsIdx !== -1 && row[oddsIdx] ? row[oddsIdx] : "1.00";
              const oddsVal = parseFloat(rawOdds.replace(",", "."));

              const statusRaw = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toUpperCase() : "PENDING";
              const sportVal = sportIdx !== -1 && row[sportIdx] ? row[sportIdx] : "FUTEBOL";
              const bookieVal = bookieIdx !== -1 && row[bookieIdx] ? row[bookieIdx] : "Outro";
              const betTypeVal = betTypeIdx !== -1 && row[betTypeIdx] ? row[betTypeIdx] : "Simples";
              const commentVal = commentIdx !== -1 && row[commentIdx] ? row[commentIdx] : "";
              const tagsVal = tagsIdx !== -1 && row[tagsIdx] ? row[tagsIdx] : "";

              // Map status
              let status: BetStatus = "POR_LIQUIDAR";
              if (statusRaw === "WON" || statusRaw === "GANHA") {
                status = "GANHA";
              } else if (statusRaw === "LOST" || statusRaw === "PERDIDA") {
                status = "PERDIDA";
              } else if (statusRaw === "VOID" || statusRaw === "ANULADA") {
                status = "ANULADA";
              } else if (statusRaw === "HALF_WON" || statusRaw === "MEIO_GANHA") {
                status = "MEIO_GANHA";
              } else if (statusRaw === "HALF_LOST" || statusRaw === "MEIO_PERDIDA") {
                status = "MEIO_PERDIDA";
              }

              // Detect freebet
              const combinedNotes = [commentVal, tagsVal].filter(Boolean).join(" | ");
              const isFreebet = combinedNotes.toLowerCase().includes("freebet") || 
                                combinedNotes.toLowerCase().includes("grátis") ||
                                combinedNotes.toLowerCase().includes("gratis");

              // Extract selections
              let games: string[] = [];
              if (gameVal.includes(" + ")) {
                games = gameVal.split(" + ").map(g => g.trim());
              } else if (gameVal.includes(";")) {
                games = gameVal.split(";").map(g => g.trim());
              } else if (gameVal.includes(",") && betTypeVal.toLowerCase().includes("múltipla")) {
                games = gameVal.split(",").map(g => g.trim());
              } else {
                games = [gameVal];
              }

              let bets: string[] = [];
              if (betVal.includes(" + ")) {
                bets = betVal.split(" + ").map(b => b.trim());
              } else if (betVal.includes(";")) {
                bets = betVal.split(";").map(b => b.trim());
              } else if (betVal.includes(",") && games.length > 1) {
                bets = betVal.split(",").map(b => b.trim());
              } else {
                bets = [betVal];
              }

              // Extract sport and betType components
              let sports: string[] = [];
              if (sportVal.includes(" + ")) {
                sports = sportVal.split(" + ").map(s => s.trim());
              } else {
                sports = [sportVal];
              }

              let subBetTypes: string[] = [];
              if (betTypeVal.includes(" + ")) {
                subBetTypes = betTypeVal.split(" + ").map(s => s.trim());
              } else {
                subBetTypes = [betTypeVal];
              }

              const selections: Selection[] = [];
              const betType: BetType = games.length > 1 ? "MULTIPLA" : "SIMPLES";
              const totalOdd = isNaN(oddsVal) ? 1.00 : oddsVal;

              for (let j = 0; j < games.length; j++) {
                const selEvent = games[j] || gameVal;
                const selChoice = bets[j] || betVal || "Resultado";
                const selOdd = games.length > 1 ? Number(Math.pow(totalOdd, 1 / games.length).toFixed(2)) : totalOdd;
                
                selections.push({
                  id: `sel_${Math.random().toString(36).substring(2, 9)}_${Date.now()}_${j}`,
                  event: selEvent,
                  market: subBetTypes[j] || betTypeVal || "Simples",
                  choice: selChoice,
                  odd: selOdd,
                  sport: sports[j] || sportVal || "FUTEBOL",
                  betType: subBetTypes[j] || betTypeVal || "Simples"
                });
              }

              const stakeNumVal = isNaN(stakeVal) ? 1.00 : stakeVal;

              const { potentialReturn, finalReturn, netProfit } = calculateBetReturnAndProfit(
                stakeNumVal,
                totalOdd,
                status,
                isFreebet
              );

              parsedBets.push({
                id: `csv_${Math.random().toString(36).substring(2, 9)}_${Date.now()}_${i}`,
                type: betType,
                status: status,
                selections: selections,
                stake: stakeNumVal,
                odd: totalOdd,
                isFreebet: isFreebet,
                potentialReturn: potentialReturn,
                finalReturn: finalReturn,
                netProfit: netProfit,
                bookmaker: bookieVal || "Outro",
                dateTime: timeVal ? `${dateVal} ${timeVal}` : `${dateVal} 00:00`,
                notes: combinedNotes || undefined,
                origin: "CSV",
                comment: commentVal || undefined,
                tags: tagsVal || undefined
              });
            }

            if (parsedBets.length > 0) {
              onImportCSV(parsedBets);
              setSuccessMsg(`${parsedBets.length} apostas importadas com sucesso!`);
              setTimeout(() => setSuccessMsg(null), 4000);
            } else {
              throw new Error("Nenhuma linha de aposta válida foi encontrada.");
            }
          } else {
            throw new Error("O ficheiro CSV está vazio.");
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao ler ficheiro de importação. Verifica se é um ficheiro válido.");
        setTimeout(() => setErrorMsg(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Full backup JSON export
  const handleExportBackup = () => {
    const backupData = {
      bets,
      preferences,
      version: "1.0",
      exportTime: new Date().toISOString()
    };

    const str = JSON.stringify(backupData, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_gestao_apostas_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="settings-tab">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Preferences & App Tuning */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Preferences form */}
          <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display flex items-center gap-2 mb-4">
              <SettingsIcon size={18} className="text-indigo-600 dark:text-indigo-400" /> Preferências Gerais
            </h4>

            <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 rounded-sm border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center gap-2 font-medium">
                  <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400 animate-pulse" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Currency */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Moeda / Símbolo</label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100"
                    value={localCurrency}
                    onChange={(e) => setLocalCurrency(e.target.value)}
                  >
                    <option value="€">Euro (€)</option>
                    <option value="$">Dólar ($)</option>
                    <option value="£">Libra (£)</option>
                    <option value="R$">Real (R$)</option>
                  </select>
                </div>

                {/* Default bookmaker */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Casa de Apostas Padrão</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100"
                    value={localBookmaker}
                    onChange={(e) => setLocalBookmaker(e.target.value)}
                  />
                </div>

                {/* Default stake */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Stake Padrão ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100 font-mono"
                    value={localStake}
                    onChange={(e) => setLocalStake(e.target.value)}
                  />
                </div>

                {/* Theme — aplica-se de imediato */}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Aspeto / Tema</label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 dark:text-slate-100"
                    value={preferences.theme}
                    onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                  >
                    <option value="system">Automático (Sistema)</option>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  Guardar Preferências
                </button>
              </div>

            </form>
          </div>

          {/* Importação do Betclic via extensão de browser */}
          <BetclicImport />

          {/* Backup, CSV and Data actions */}
          <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-indigo-600 dark:text-indigo-400" /> Cópia de Segurança, Importar e Exportar
            </h4>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Mantém os teus dados de apostas seguros. Descarrega backups completos em formato JSON ou exporta as tuas apostas para análise externa em folhas de cálculo Excel/CSV.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">

              {/* Exports */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-slate-700 dark:text-slate-200">Exportar Ficheiros</h5>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Exporta tabelas estruturadas compatíveis ou cópias completas.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-sm bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Descarregar CSV (.csv)
                  </button>
                  <button
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 rounded-sm bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/55 dark:border-indigo-900 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Descarregar Backup JSON
                  </button>
                </div>
              </div>

              {/* Imports */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-slate-700 dark:text-slate-200">Restaurar / Importar</h5>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Sincroniza e restaura backups antigos arrastando o teu ficheiro.</p>
                </div>
                <div>
                  <label className="px-3.5 py-2.5 rounded-sm bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
                    <Upload size={14} /> Escolher Ficheiro (.json, .csv)
                    <input
                      type="file"
                      // Além das extensões, inclui os MIME types que o Android/iOS
                      // atribuem a CSVs (text/comma-separated-values, vnd.ms-excel,
                      // text/plain…) — só com ".csv" o seletor de ficheiros do
                      // telemóvel mostra os CSVs acinzentados/impossíveis de escolher.
                      // O parser valida o conteúdo, por isso ser permissivo é seguro.
                      accept=".json,.csv,application/json,text/csv,text/comma-separated-values,application/csv,application/vnd.ms-excel,text/plain"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Dangerous Zone */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 text-xs uppercase tracking-wider">
                <AlertTriangle size={14} /> Zona de Risco
              </h5>

              <div className="flex flex-wrap items-center gap-3">
                {showConfirmClear ? (
                  <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-sm">
                    <span className="text-[11px] text-rose-800 dark:text-rose-200 font-medium">Tem a certeza absoluta?</span>
                    <button
                      onClick={() => {
                        onClearData();
                        setShowConfirmClear(false);
                        setSuccessMsg("Todos os dados foram eliminados com sucesso.");
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }}
                      className="px-2.5 py-1 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-sm cursor-pointer transition-colors"
                    >
                      Sim, Apagar Tudo
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2.5 py-1 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-sm cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="px-3.5 py-2 rounded-sm bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-semibold flex items-center gap-1 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Limpar Todos os Dados
                  </button>
                )}

                {showConfirmReset ? (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm">
                    <span className="text-[11px] text-slate-700 dark:text-slate-200 font-medium">Substituir dados atuais?</span>
                    <button
                      onClick={() => {
                        onResetDemoData();
                        setShowConfirmReset(false);
                        setSuccessMsg("Dados de demonstração originais repostos com sucesso.");
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }}
                      className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm cursor-pointer transition-colors"
                    >
                      Sim, Repor Demonstração
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2.5 py-1 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-sm cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="px-3.5 py-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold flex items-center gap-1 text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} /> Carregar Dados de Demonstração
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: Audit logs / Alterações */}
        <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-[520px]">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
              <History size={18} className="text-indigo-600 dark:text-indigo-400" /> Auditoria de Alterações
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Registo detalhado de operações efetuadas nesta sessão</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">{log.action}</span>
                  <span className="font-mono">{log.timestamp.split("T")[1].slice(0, 8)}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-normal">{log.details}</p>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-12">
                <Info className="text-slate-300 dark:text-slate-600 stroke-1 mb-1" size={28} />
                <p className="text-[11px]">Nenhuma atividade registada ainda.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

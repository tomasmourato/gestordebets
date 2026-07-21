import React, { useState, useEffect } from "react";
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
import { Preferences, AuditLog, Bet, BetStatus, BookieAccount, FreebetType, Selection, BetType, ThemeMode, Language } from "../types";
import { calculateBetReturnAndProfit, safeNum } from "../utils";
import { defaultFreebetTypeFor } from "../lib/bookmakers";
import BetclicImport from "./BetclicImport";
import BookieAccountsCard from "./BookieAccountsCard";
import EnabledBookmakersCard from "./EnabledBookmakersCard";
import { fetchSettings, updateEnabledBookmakers, SUPPORTED_BOOKMAKERS } from "../lib/settingsApi";
import { useI18n } from "../lib/i18n";
import { exportBetsCSV, exportBackupJSON, importBetsFromFile } from "../lib/dataTransfer";
import FilterDropdown from "./FilterDropdown";

interface SettingsProps {
  preferences: Preferences;
  auditLogs: AuditLog[];
  bets: Bet[];
  currency: string;
  onUpdatePreferences: (prefs: Preferences) => void;
  onClearData: () => void;
  onResetDemoData: () => void;
  onImportCSV: (bets: Bet[]) => void;
  // Contas por casa (geridas ao nível do App para partilhar com filtros/extensão)
  accounts: BookieAccount[];
  accountsError: string | null;
  clearAccountsError: () => void;
  onAddAccount: (bookmaker: string, label: string, username?: string | null) => Promise<BookieAccount | null>;
  onRenameAccount: (id: string, label: string, username?: string | null) => Promise<BookieAccount | null>;
  onDeleteAccount: (id: string) => Promise<boolean>;
}

export default function Settings({
  preferences,
  auditLogs,
  bets,
  currency,
  onUpdatePreferences,
  onClearData,
  onResetDemoData,
  onImportCSV,
  accounts,
  accountsError,
  clearAccountsError,
  onAddAccount,
  onRenameAccount,
  onDeleteAccount
}: SettingsProps) {

  const { t } = useI18n();

  // Local preferences fields
  const [localCurrency, setLocalCurrency] = useState(preferences.currency);
  const [localBookmaker, setLocalBookmaker] = useState(preferences.defaultBookmaker);
  const [localStake, setLocalStake] = useState(preferences.defaultStake.toString());

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Casas de apostas ativas (partilhadas com a extensão via /api/settings).
  // supported arranca com o fallback local para os checkboxes aparecerem já.
  const [supportedBookmakers, setSupportedBookmakers] = useState<string[]>([...SUPPORTED_BOOKMAKERS]);
  const [enabledBookmakers, setEnabledBookmakers] = useState<string[]>([]);
  const [bookmakersLoading, setBookmakersLoading] = useState(true);
  const [bookmakersSaving, setBookmakersSaving] = useState(false);
  const [bookmakersError, setBookmakersError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchSettings()
      .then((s) => {
        if (!alive) return;
        // Só substitui o fallback se o servidor devolver uma lista real.
        if (s.supportedBookmakers.length > 0) setSupportedBookmakers(s.supportedBookmakers);
        setEnabledBookmakers(s.enabledBookmakers);
      })
      .catch((err) => {
        if (!alive) return;
        setBookmakersError(err?.message || "Erro ao obter as definições.");
      })
      .finally(() => {
        if (alive) setBookmakersLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleToggleBookmaker = async (key: string, next: boolean) => {
    // A ordem não é observada (só se testa pertença), por isso não a canonizamos
    // aqui — o servidor devolve já a lista normalizada.
    const updated = next
      ? [...enabledBookmakers, key]
      : enabledBookmakers.filter((k) => k !== key);
    const previous = enabledBookmakers;
    setEnabledBookmakers(updated); // otimista
    setBookmakersSaving(true);
    setBookmakersError(null);
    try {
      const saved = await updateEnabledBookmakers(updated);
      setEnabledBookmakers(saved.enabledBookmakers);
    } catch (err) {
      setEnabledBookmakers(previous); // reverte
      setBookmakersError((err as Error)?.message || "Erro ao guardar as definições.");
    } finally {
      setBookmakersSaving(false);
    }
  };

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

  const handleLanguageChange = (language: Language) => {
    onUpdatePreferences({ ...preferences, language });
  };

  // Export/import de dados: lógica partilhada com a UI mobile em
  // src/lib/dataTransfer.ts (extraída daqui, semântica idêntica).
  const handleExportCSV = () => {
    exportBetsCSV(bets, accounts);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importBetsFromFile(file, accounts, onImportCSV)
      .then((message) => {
        setSuccessMsg(message);
        setTimeout(() => setSuccessMsg(null), 4000);
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setTimeout(() => setErrorMsg(null), 5000);
      });
  };

  // Full backup JSON export
  const handleExportBackup = () => {
    exportBackupJSON(bets, preferences);
  };

  return (
    <div className="space-y-6" id="settings-tab">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Preferences & App Tuning */}
        <div className="space-y-6 lg:col-span-2">

          {/* Escolha das casas de apostas ativas — primeiro, define o que aparece no resto */}
          <EnabledBookmakersCard
            supported={supportedBookmakers}
            enabled={enabledBookmakers}
            loading={bookmakersLoading}
            saving={bookmakersSaving}
            error={bookmakersError}
            onToggle={handleToggleBookmaker}
          />

          {/* Preferences form */}
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2 mb-4">
              <SettingsIcon size={18} className="text-emerald-600 dark:text-emerald-400" /> Preferências Gerais
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
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Moeda / Símbolo</label>
                  <FilterDropdown
                    value={localCurrency}
                    options={[
                      { value: "€", label: "Euro (€)" },
                      { value: "$", label: "Dólar ($)" },
                      { value: "£", label: "Libra (£)" },
                      { value: "R$", label: "Real (R$)" }
                    ]}
                    onChange={setLocalCurrency}
                    ariaLabel="Selecionar moeda"
                  />
                </div>

                {/* Default bookmaker */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Casa de Apostas Padrão</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100"
                    value={localBookmaker}
                    onChange={(e) => setLocalBookmaker(e.target.value)}
                  />
                </div>

                {/* Default stake */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Stake Padrão ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-zinc-800 dark:text-zinc-100 font-mono"
                    value={localStake}
                    onChange={(e) => setLocalStake(e.target.value)}
                  />
                </div>

                {/* Theme — aplica-se de imediato */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Aspeto / Tema</label>
                  <FilterDropdown
                    value={preferences.theme}
                    options={[
                      { value: "system", label: "Automático (Sistema)" },
                      { value: "light", label: "Claro" },
                      { value: "dark", label: "Escuro" }
                    ]}
                    onChange={handleThemeChange}
                    ariaLabel="Selecionar tema"
                  />
                </div>

                {/* Idioma — aplica-se de imediato (i18n) */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">{t("settings.language.title")}</label>
                  <FilterDropdown
                    value={preferences.language}
                    options={[
                      { value: "pt", label: t("lang.pt") },
                      { value: "en", label: t("lang.en") }
                    ]}
                    onChange={handleLanguageChange}
                    ariaLabel={t("settings.language.title")}
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  Guardar Preferências
                </button>
              </div>

            </form>
          </div>

          {/* Contas por casa de apostas */}
          <BookieAccountsCard
            accounts={accounts}
            bets={bets}
            error={accountsError}
            clearError={clearAccountsError}
            onAdd={onAddAccount}
            onRename={onRenameAccount}
            onDelete={onDeleteAccount}
          />

          {/* Importação via extensão de browser */}
          <BetclicImport accounts={accounts} enabledBookmakers={enabledBookmakers} />

          {/* Backup, CSV and Data actions */}
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" /> Cópia de Segurança, Importar e Exportar
            </h4>

            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Mantém os teus dados de apostas seguros. Descarrega backups completos em formato JSON ou exporta as tuas apostas para análise externa em folhas de cálculo Excel/CSV.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">

              {/* Exports */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-sm border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-zinc-700 dark:text-zinc-200">Exportar Ficheiros</h5>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Exporta tabelas estruturadas compatíveis ou cópias completas.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-sm bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Descarregar CSV (.csv)
                  </button>
                  <button
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 rounded-sm bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/55 dark:border-emerald-900 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Descarregar Backup JSON
                  </button>
                </div>
              </div>

              {/* Imports */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-sm border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between space-y-3">
                <div>
                  <h5 className="font-bold text-zinc-700 dark:text-zinc-200">Restaurar / Importar</h5>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Sincroniza e restaura backups antigos arrastando o teu ficheiro.</p>
                </div>
                <div>
                  <label className="px-3.5 py-2.5 rounded-sm bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-center transition-colors">
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
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
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
                      className="px-2.5 py-1 text-[10px] bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-medium rounded-sm cursor-pointer transition-colors"
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
                  <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm">
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-200 font-medium">Substituir dados atuais?</span>
                    <button
                      onClick={() => {
                        onResetDemoData();
                        setShowConfirmReset(false);
                        setSuccessMsg("Dados de demonstração originais repostos com sucesso.");
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }}
                      className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm cursor-pointer transition-colors"
                    >
                      Sim, Repor Demonstração
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2.5 py-1 text-[10px] bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-medium rounded-sm cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="px-3.5 py-2 rounded-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-semibold flex items-center gap-1 text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} /> Carregar Dados de Demonstração
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: Audit logs / Alterações */}
        <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 flex flex-col h-[520px]">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
              <History size={18} className="text-emerald-600 dark:text-emerald-400" /> Auditoria de Alterações
            </h4>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Registo detalhado de operações efetuadas nesta sessão</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-sm border border-zinc-200 dark:border-zinc-700 space-y-1 text-xs">
                <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{log.action}</span>
                  <span className="font-mono">{log.timestamp.split("T")[1].slice(0, 8)}</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 leading-normal">{log.details}</p>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 py-12">
                <Info className="text-zinc-300 dark:text-zinc-600 stroke-1 mb-1" size={28} />
                <p className="text-[11px]">Nenhuma atividade registada ainda.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

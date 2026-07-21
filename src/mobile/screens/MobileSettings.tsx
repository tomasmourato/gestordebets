// src/mobile/screens/MobileSettings.tsx
// Definições mobile em estilo "definições Android": listas agrupadas por
// secção (preferências, contas, dados, sobre, auditoria). Reutiliza a mesma
// lógica do desktop — dataTransfer.ts para CSV/backup e os handlers do
// ShellProps para o resto. Ações destrutivas confirmam em bottom sheet.

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  History,
  Wallet,
  Plus,
  Pencil,
  X,
  Info,
} from "lucide-react";
import { Preferences, AuditLog, Bet, BookieAccount, ThemeMode, Language } from "../../types";
import { AVAILABLE_BOOKMAKERS } from "../../utils";
import { exportBetsCSV, exportBackupJSON, importBetsFromFile } from "../../lib/dataTransfer";
import { getBundleVersion, initLiveUpdate } from "../../lib/liveUpdate";
import { isNativeApp } from "../../lib/apiBase";
import {
  SectionHeader,
  ListGroup,
  ListItem,
  MobileCard,
  BottomSheet,
  Pressable,
  ChipGroup,
  useToast,
} from "../ui";

interface MobileSettingsProps {
  preferences: Preferences;
  auditLogs: AuditLog[];
  bets: Bet[];
  currency: string;
  onUpdatePreferences: (prefs: Preferences) => void;
  onClearData: () => void | Promise<void>;
  onResetDemoData: () => void | Promise<void>;
  onImportCSV: (bets: Bet[]) => void;
  accounts: BookieAccount[];
  accountsError: string | null;
  clearAccountsError: () => void;
  onAddAccount: (bookmaker: string, label: string) => Promise<BookieAccount | null>;
  onRenameAccount: (id: string, label: string) => Promise<BookieAccount | null>;
  onDeleteAccount: (id: string) => Promise<boolean>;
}

const inputClasses =
  "w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500";

export default function MobileSettings({
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
  onDeleteAccount,
}: MobileSettingsProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferências locais (moeda/casa/stake gravam com "Guardar", como no desktop).
  const [localCurrency, setLocalCurrency] = useState(preferences.currency);
  const [localBookmaker, setLocalBookmaker] = useState(preferences.defaultBookmaker);
  const [localStake, setLocalStake] = useState(preferences.defaultStake.toString());

  // Sheets
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  // Gestão de contas (dentro da sheet).
  const [newAccountBookmaker, setNewAccountBookmaker] = useState(AVAILABLE_BOOKMAKERS[0] || "Betano");
  const [newAccountLabel, setNewAccountLabel] = useState("");
  const [renamingAccount, setRenamingAccount] = useState<BookieAccount | null>(null);
  const [renameLabel, setRenameLabel] = useState("");

  // Sobre / live update.
  const [bundleVersion, setBundleVersion] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    void getBundleVersion().then(setBundleVersion);
  }, []);

  useEffect(() => {
    if (accountsError) {
      toast.show(accountsError, "error");
      clearAccountsError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsError]);

  const savePreferences = () => {
    const stakeNum = parseFloat(localStake);
    if (isNaN(stakeNum) || stakeNum < 0) {
      toast.show("Stake padrão inválida.", "error");
      return;
    }
    onUpdatePreferences({
      ...preferences,
      currency: localCurrency,
      defaultBookmaker: localBookmaker,
      defaultStake: stakeNum,
    });
    toast.show("Preferências guardadas", "success");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importBetsFromFile(file, accounts, onImportCSV)
      .then((message) => toast.show(message, "success"))
      .catch((err: Error) => toast.show(err.message, "error"));
    e.target.value = "";
  };

  const handleAddAccount = async () => {
    const label = newAccountLabel.trim();
    if (!label) {
      toast.show("Dá um nome à conta.", "error");
      return;
    }
    const created = await onAddAccount(newAccountBookmaker, label);
    if (created) {
      setNewAccountLabel("");
      toast.show("Conta adicionada", "success");
    }
  };

  const handleRename = async () => {
    if (!renamingAccount) return;
    const label = renameLabel.trim();
    if (!label) return;
    const updated = await onRenameAccount(renamingAccount.id, label);
    if (updated) {
      setRenamingAccount(null);
      toast.show("Conta renomeada", "success");
    }
  };

  const checkUpdate = async () => {
    setCheckingUpdate(true);
    try {
      await initLiveUpdate();
      toast.show("Verificação concluída — aplica no próximo arranque se houver novidade.", "info");
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="space-y-1 pb-4">
      {/* Preferências gerais */}
      <SectionHeader>Preferências gerais</SectionHeader>
      <MobileCard className="space-y-4">
        <ChipGroup
          label="Moeda"
          options={[
            { value: "€", label: "Euro (€)" },
            { value: "$", label: "Dólar ($)" },
            { value: "£", label: "Libra (£)" },
            { value: "R$", label: "Real (R$)" },
          ]}
          value={localCurrency}
          onChange={setLocalCurrency}
        />
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Casa de apostas padrão
          </span>
          <input
            type="text"
            value={localBookmaker}
            onChange={(e) => setLocalBookmaker(e.target.value)}
            className={`mt-1 ${inputClasses}`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Stake padrão ({currency})
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={localStake}
            onChange={(e) => setLocalStake(e.target.value)}
            className={`mt-1 ${inputClasses}`}
          />
        </label>
        <Pressable
          as="button"
          onClick={savePreferences}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center"
        >
          Guardar preferências
        </Pressable>
      </MobileCard>

      {/* Aparência (aplica de imediato, como no desktop) */}
      <SectionHeader>Aparência</SectionHeader>
      <MobileCard className="space-y-4">
        <ChipGroup
          label="Tema"
          options={[
            { value: "light", label: "Claro" },
            { value: "dark", label: "Escuro" },
            { value: "system", label: "Sistema" },
          ]}
          value={preferences.theme}
          onChange={(v) => onUpdatePreferences({ ...preferences, theme: v as ThemeMode })}
        />
        <ChipGroup
          label="Idioma"
          options={[
            { value: "pt", label: "Português" },
            { value: "en", label: "English" },
          ]}
          value={preferences.language}
          onChange={(v) => onUpdatePreferences({ ...preferences, language: v as Language })}
        />
      </MobileCard>

      {/* Contas + auditoria */}
      <SectionHeader>Gestão</SectionHeader>
      <ListGroup>
        <ListItem
          icon={Wallet}
          title="Contas por casa de apostas"
          subtitle={`${accounts.length} ${accounts.length === 1 ? "conta" : "contas"}`}
          chevron
          onClick={() => setAccountsOpen(true)}
        />
        <ListItem
          icon={History}
          title="Registo de alterações"
          subtitle={`${auditLogs.length} ${auditLogs.length === 1 ? "registo" : "registos"} nesta sessão`}
          chevron
          onClick={() => setLogsOpen(true)}
        />
      </ListGroup>

      {/* Dados */}
      <SectionHeader>Dados</SectionHeader>
      <ListGroup>
        <ListItem
          icon={FileSpreadsheet}
          title="Exportar CSV"
          subtitle={bets.length === 0 ? "Sem apostas para exportar" : "Todas as apostas em formato CSV"}
          onClick={() => {
            if (bets.length === 0) return toast.show("Não há apostas para exportar.", "info");
            void exportBetsCSV(bets, accounts);
          }}
        />
        <ListItem
          icon={Download}
          title="Backup completo (JSON)"
          subtitle="Apostas + preferências"
          onClick={() => {
            if (bets.length === 0) return toast.show("Não há apostas para exportar.", "info");
            void exportBackupJSON(bets, preferences);
          }}
        />
        <ListItem icon={Upload} title="Importar ficheiro" subtitle="Backup JSON ou CSV" onClick={() => fileInputRef.current?.click()} />
      </ListGroup>
      <input ref={fileInputRef} type="file" accept=".csv,.json,text/csv,application/json" onChange={handleImportFile} className="hidden" />

      {/* Zona perigosa */}
      <SectionHeader>Zona perigosa</SectionHeader>
      <ListGroup>
        <ListItem icon={RefreshCw} title="Repor dados de demonstração" subtitle="Substitui tudo pelos dados de exemplo" onClick={() => setConfirmReset(true)} />
        <ListItem icon={Trash2} title="Apagar todos os dados" subtitle="Remove todas as apostas da base de dados" destructive onClick={() => setConfirmClear(true)} />
      </ListGroup>

      {/* Sobre */}
      <SectionHeader>Sobre</SectionHeader>
      <ListGroup>
        <ListItem
          icon={Info}
          title="Versão do frontend"
          trailing={bundleVersion ?? (isNativeApp() ? "…" : "web")}
        />
        {isNativeApp() && (
          <ListItem
            icon={RefreshCw}
            title={checkingUpdate ? "A verificar…" : "Verificar atualização"}
            subtitle="Procura um bundle novo no servidor"
            onClick={checkingUpdate ? undefined : () => void checkUpdate()}
          />
        )}
      </ListGroup>

      {/* Sheet: contas por casa */}
      <BottomSheet open={accountsOpen} onClose={() => setAccountsOpen(false)} title="Contas por casa de apostas">
        <div className="space-y-4 pb-2">
          {accounts.length > 0 ? (
            <ListGroup>
              {accounts.map((a) => (
                <ListItem
                  key={a.id}
                  title={a.label}
                  subtitle={a.bookmaker}
                  trailing={
                    <span className="flex items-center gap-1">
                      <Pressable
                        as="button"
                        onClick={() => {
                          setRenamingAccount(a);
                          setRenameLabel(a.label);
                        }}
                        aria-label={`Renomear ${a.label}`}
                        className="p-2 text-zinc-400"
                      >
                        <Pencil size={14} />
                      </Pressable>
                      <Pressable
                        as="button"
                        onClick={async () => {
                          const ok = await onDeleteAccount(a.id);
                          if (ok) toast.show("Conta apagada", "success");
                        }}
                        aria-label={`Apagar ${a.label}`}
                        className="p-2 text-rose-500"
                      >
                        <Trash2 size={14} />
                      </Pressable>
                    </span>
                  }
                />
              ))}
            </ListGroup>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">
              Ainda não tens contas registadas.
            </p>
          )}

          {renamingAccount ? (
            <MobileCard className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  Renomear “{renamingAccount.label}”
                </p>
                <Pressable as="button" onClick={() => setRenamingAccount(null)} aria-label="Cancelar" className="p-1 text-zinc-400">
                  <X size={14} />
                </Pressable>
              </div>
              <input
                type="text"
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
                className={inputClasses}
              />
              <Pressable as="button" onClick={handleRename} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center">
                Guardar nome
              </Pressable>
            </MobileCard>
          ) : (
            <MobileCard className="space-y-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Nova conta</p>
              <select
                value={newAccountBookmaker}
                onChange={(e) => setNewAccountBookmaker(e.target.value)}
                className={inputClasses}
              >
                {AVAILABLE_BOOKMAKERS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newAccountLabel}
                onChange={(e) => setNewAccountLabel(e.target.value)}
                placeholder="Etiqueta (ex.: Conta principal)"
                className={inputClasses}
              />
              <Pressable
                as="button"
                onClick={() => void handleAddAccount()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
              >
                <Plus size={14} /> Adicionar conta
              </Pressable>
            </MobileCard>
          )}
        </div>
      </BottomSheet>

      {/* Sheet: registo de alterações */}
      <BottomSheet open={logsOpen} onClose={() => setLogsOpen(false)} title="Registo de alterações">
        <div className="pb-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
              Sem alterações nesta sessão.
            </p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-zinc-100 dark:bg-zinc-800/60 px-3 py-2">
                  <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {log.action}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{log.details}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{log.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Confirmações destrutivas */}
      <BottomSheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Repor dados de demonstração?">
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            As tuas apostas atuais serão substituídas pelos dados de exemplo. Esta ação não pode ser desfeita.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable as="button" onClick={() => setConfirmReset(false)} className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              onClick={async () => {
                setConfirmReset(false);
                await onResetDemoData();
                toast.show("Dados de demonstração repostos", "success");
              }}
              className="py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold text-center"
            >
              Repor
            </Pressable>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={confirmClear} onClose={() => setConfirmClear(false)} title="Apagar todos os dados?">
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Todas as apostas serão removidas permanentemente da base de dados. Considera exportar um backup primeiro.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable as="button" onClick={() => setConfirmClear(false)} className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              onClick={async () => {
                setConfirmClear(false);
                await onClearData();
                toast.show("Dados apagados", "success");
              }}
              className="py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold text-center"
            >
              Apagar tudo
            </Pressable>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

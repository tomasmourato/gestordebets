import React, { useMemo, useState } from "react";
import { Puzzle, Download, RefreshCw, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useBetclicExtension } from "../hooks/useBetclicExtension";
import { BookieAccount } from "../types";
import { isNativeApp } from "../lib/apiBase";

// Casas suportadas pela extensão; a chave (minúsculas) é a usada pelo service
// worker da extensão para identificar cada fonte.
const EXTENSION_BOOKIES: Array<{ key: string; label: string }> = [
  { key: "betclic", label: "Betclic" },
  { key: "betano", label: "Betano" },
];

// Última conta escolhida por casa, para não ter de escolher sempre.
const ACCOUNT_CHOICE_KEY = "gestordebets_import_accounts";

function loadAccountChoices(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ACCOUNT_CHOICE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Quando (se) a extensão for publicada na Chrome Web Store, mete aqui o link e
// o botão de instalação passa a apontar para lá.
const WEBSTORE_URL: string | null = null;

// Zip só da extensão, gerado no build e servido pelo próprio app
// (scripts/zip-extension.mjs -> dist/bettrackr-extension.zip). O utilizador
// descarrega apenas a extensão, não o projeto todo.
const EXTENSION_DOWNLOAD_URL: string | null = "/bettrackr-extension.zip";

function importSummary(result: {
  imported?: number;
  updated?: number;
  skipped?: number;
  unsupported?: number;
  sourceResults?: Record<string, { ok: boolean; imported?: number; updated?: number; skipped?: number; unsupported?: number; error?: string }>;
}) {
  const labels: Record<string, string> = { betclic: "Betclic", betano: "Betano" };
  const sources = Object.entries(result.sourceResults || {});
  if (sources.length === 0) {
    return `${result.imported || 0} importadas${result.updated ? ` · ${result.updated} atualizadas` : ""}${result.skipped ? ` · ${result.skipped} já existentes` : ""}.`;
  }
  return sources.map(([source, item]) => {
    const label = labels[source] || source;
    if (!item.ok) return `${label}: ${item.error || "indisponível"}`;
    return `${label}: ${item.imported || 0} importadas${item.updated ? ` · ${item.updated} atualizadas` : ""}${item.skipped ? ` · ${item.skipped} já existentes` : ""}${item.unsupported ? ` · ${item.unsupported} ignoradas` : ""}`;
  }).join(" · ");
}

// Passos de instalação manual — reutilizados no estado "não instalada" e no
// bloco "reinstalar", para que as instruções estejam SEMPRE acessíveis no app.
function InstallSteps() {
  if (WEBSTORE_URL) {
    return (
      <a
        href={WEBSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
      >
        <Download size={14} /> Instalar da Chrome Web Store
      </a>
    );
  }

  return (
    <div className="space-y-3">
      {EXTENSION_DOWNLOAD_URL && (
        <a
          href={EXTENSION_DOWNLOAD_URL}
          download="bettrackr-extension.zip"
          className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <Download size={14} /> Descarregar extensão (.zip)
        </a>
      )}
      <ol className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5 list-decimal list-inside">
        <li>
          Descarrega e extrai o <code className="font-mono">.zip</code> — escolhe a pasta extraída que contém{" "}
          <code className="font-mono text-emerald-600 dark:text-emerald-300">manifest.json</code>.
        </li>
        <li>
          Abre <code className="font-mono text-emerald-600 dark:text-emerald-300">brave://extensions</code>{" "}
          (ou <code className="font-mono text-emerald-600 dark:text-emerald-300">chrome://extensions</code>).
        </li>
        <li>Ativa o <strong>Modo de programador</strong> (canto superior direito).</li>
        <li>
          Clica em <strong>Carregar expandida</strong> e escolhe a pasta{" "}
          <code className="font-mono">extension/</code>.
        </li>
        <li>Volta a esta página e usa <em>verificar novamente</em>.</li>
      </ol>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
        Um site não pode instalar uma extensão automaticamente (segurança do browser), por isso a
        instalação é um passo único e manual.
      </p>
    </div>
  );
}

interface BetclicImportProps {
  accounts?: BookieAccount[];
}

export default function BetclicImport({ accounts = [] }: BetclicImportProps) {
  const { installed, version, importing, progress, result, runImport, recheck } = useBetclicExtension();

  // Na app nativa (Android) não existem extensões de browser — o cartão
  // inteiro seria só instruções impossíveis de seguir. A importação por
  // extensão continua disponível na versão web/desktop.
  if (isNativeApp()) return null;

  const [accountChoices, setAccountChoices] = useState<Record<string, string>>(loadAccountChoices);

  // Contas disponíveis por casa da extensão (label da casa -> lista).
  const accountsByBookie = useMemo(() => {
    const map = new Map<string, BookieAccount[]>();
    for (const { key, label } of EXTENSION_BOOKIES) {
      map.set(key, accounts.filter((account) => account.bookmaker === label));
    }
    return map;
  }, [accounts]);

  const hasAccountChoices = EXTENSION_BOOKIES.some(({ key }) => (accountsByBookie.get(key) || []).length > 0);

  const chooseAccount = (bookie: string, accountId: string) => {
    setAccountChoices((prev) => {
      const next = { ...prev, [bookie]: accountId };
      if (!accountId) delete next[bookie];
      try { localStorage.setItem(ACCOUNT_CHOICE_KEY, JSON.stringify(next)); } catch { /* storage cheio/indisponível */ }
      return next;
    });
  };

  const handleImport = () => {
    // Só envia escolhas válidas (conta ainda existente e da casa certa).
    const accountIds: Record<string, string> = {};
    for (const { key } of EXTENSION_BOOKIES) {
      const chosen = accountChoices[key];
      if (chosen && (accountsByBookie.get(key) || []).some((account) => account.id === chosen)) {
        accountIds[key] = chosen;
      }
    }
    runImport(accountIds);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
          <Puzzle size={18} className="text-emerald-600 dark:text-emerald-400" /> Importar apostas
        </h4>
        {installed === true && (
          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
            Extensão ativa{version ? ` · v${version}` : ""}
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Com a extensão de browser instalada, importas as tuas apostas do Betclic e Betano com um
        clique — sem exportações manuais. Cada casa é lida da tua própria sessão.
      </p>

      {/* A verificar */}
      {installed === null && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <RefreshCw size={14} className="animate-spin" /> A procurar a extensão…
        </div>
      )}

      {/* Instalada -> botão de importar */}
      {installed === true && (
        <div className="space-y-3">
          {/* Escolha da conta de destino por casa (só se existirem contas) */}
          {hasAccountChoices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXTENSION_BOOKIES.map(({ key, label }) => {
                const options = accountsByBookie.get(key) || [];
                if (options.length === 0) return null;
                const selected = accountChoices[key] && options.some((account) => account.id === accountChoices[key])
                  ? accountChoices[key]
                  : "";
                return (
                  <label key={key} className="block">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                      Conta {label}
                    </span>
                    <select
                      value={selected}
                      onChange={(e) => chooseAccount(key, e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-sm px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">Sem conta</option>
                      {options.map((account) => (
                        <option key={account.id} value={account.id}>{account.label}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {importing ? "A importar…" : "Importar apostas de todas as casas"}
          </button>

          {importing && progress && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 animate-pulse">{progress}</p>
          )}

          {result && result.ok && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 rounded-sm border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {(Object.keys(result.sourceResults || {}).length > 0 ||
                  (result.imported || 0) > 0 || (result.updated || 0) > 0 || (result.unsupported || 0) > 0)
                  ? importSummary(result)
                  : `Nada novo para importar${result.skipped ? ` (${result.skipped} já existiam)` : ""}.`}
              </span>
            </div>
          )}

          {result && !result.ok && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs font-medium">
              <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{result.error || "Falha na importação."}</span>
            </div>
          )}

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Antes de importar, abre <strong>betclic.pt</strong> e/ou a página principal de <strong>betano.pt</strong>.
            Mantém o separador principal do Betano aberto durante a importação.
          </p>

          {/* Instruções continuam acessíveis mesmo com a extensão instalada. */}
          <details className="pt-1">
            <summary className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer">
              Reinstalar ou instalar noutro dispositivo
            </summary>
            <div className="mt-3">
              <InstallSteps />
            </div>
          </details>
        </div>
      )}

      {/* Não instalada -> instruções em destaque */}
      {installed === false && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded-sm border border-amber-200 dark:border-amber-900 text-xs font-medium">
            Extensão não detetada. Instala-a uma vez para importares as apostas:
          </div>

          <InstallSteps />

          <button
            onClick={recheck}
            className="px-3.5 py-2 rounded-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRight size={13} /> Já instalei — verificar novamente
          </button>
        </div>
      )}
    </div>
  );
}

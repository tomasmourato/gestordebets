import React from "react";
import { Puzzle, Download, RefreshCw, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useBetclicExtension } from "../hooks/useBetclicExtension";

// Quando (se) a extensão for publicada na Chrome Web Store, mete aqui o link e
// o botão de instalação passa a apontar para lá.
const WEBSTORE_URL: string | null = null;

// Zip só da extensão, gerado no build e servido pelo próprio app
// (scripts/zip-extension.mjs -> dist/betclic-extension.zip). O utilizador
// descarrega apenas a extensão, não o projeto todo.
const EXTENSION_DOWNLOAD_URL: string | null = "/betclic-extension.zip";

// Passos de instalação manual — reutilizados no estado "não instalada" e no
// bloco "reinstalar", para que as instruções estejam SEMPRE acessíveis no app.
function InstallSteps() {
  if (WEBSTORE_URL) {
    return (
      <a
        href={WEBSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
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
          download="betclic-extension.zip"
          className="px-3.5 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <Download size={14} /> Descarregar extensão (.zip)
        </a>
      )}
      <ol className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
        <li>
          Descarrega e extrai o <code className="font-mono">.zip</code> — a extensão fica na pasta{" "}
          <code className="font-mono text-indigo-600 dark:text-indigo-300">extension/</code>.
        </li>
        <li>
          Abre <code className="font-mono text-indigo-600 dark:text-indigo-300">brave://extensions</code>{" "}
          (ou <code className="font-mono text-indigo-600 dark:text-indigo-300">chrome://extensions</code>).
        </li>
        <li>Ativa o <strong>Modo de programador</strong> (canto superior direito).</li>
        <li>
          Clica em <strong>Carregar expandida</strong> e escolhe a pasta{" "}
          <code className="font-mono">extension/</code>.
        </li>
        <li>Volta a esta página e usa <em>verificar novamente</em>.</li>
      </ol>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        Um site não pode instalar uma extensão automaticamente (segurança do browser), por isso a
        instalação é um passo único e manual.
      </p>
    </div>
  );
}

export default function BetclicImport() {
  const { installed, version, importing, progress, result, runImport, recheck } = useBetclicExtension();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Puzzle size={18} className="text-indigo-600 dark:text-indigo-400" /> Importar do Betclic
        </h4>
        {installed === true && (
          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
            Extensão ativa{version ? ` · v${version}` : ""}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Com a extensão de browser instalada, importas as tuas apostas do Betclic com um clique —
        sem exportações manuais. As apostas são lidas da tua própria sessão do Betclic.
      </p>

      {/* A verificar */}
      {installed === null && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <RefreshCw size={14} className="animate-spin" /> A procurar a extensão…
        </div>
      )}

      {/* Instalada -> botão de importar */}
      {installed === true && (
        <div className="space-y-3">
          <button
            onClick={runImport}
            disabled={importing}
            className="px-4 py-2.5 rounded-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {importing ? "A importar…" : "Importar apostas do Betclic"}
          </button>

          {importing && progress && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 animate-pulse">{progress}</p>
          )}

          {result && result.ok && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 rounded-sm border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {((result.imported || 0) > 0 || (result.updated || 0) > 0)
                  ? `${result.imported || 0} importadas${result.updated ? ` · ${result.updated} atualizadas` : ""}${result.skipped ? ` · ${result.skipped} já existiam` : ""}.`
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

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Antes de importar, abre <strong>betclic.pt</strong> e entra em <em>As minhas apostas</em> para a
            extensão captar a sessão.
          </p>

          {/* Instruções continuam acessíveis mesmo com a extensão instalada. */}
          <details className="pt-1">
            <summary className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
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
            className="px-3.5 py-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRight size={13} /> Já instalei — verificar novamente
          </button>
        </div>
      )}
    </div>
  );
}

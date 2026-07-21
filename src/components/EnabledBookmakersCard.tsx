import React from "react";
import { Building2, Check, RefreshCw } from "lucide-react";
import { bookmakerLabel } from "../lib/bookmakers";

interface EnabledBookmakersCardProps {
  // Casas suportadas pela app (chaves minúsculas, ordem canónica).
  supported: string[];
  // Casas atualmente ativas.
  enabled: string[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  onToggle: (key: string, next: boolean) => void;
}

// Cartão onde o utilizador escolhe quais das casas suportadas usa. A extensão
// lê a mesma seleção (/api/settings) e só mostra/importa dessas casas.
export default function EnabledBookmakersCard({
  supported,
  enabled,
  loading,
  saving,
  error,
  onToggle,
}: EnabledBookmakersCardProps) {
  const enabledSet = new Set(enabled);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
          <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" /> Casas de apostas
        </h4>
        {saving && <RefreshCw size={14} className="animate-spin text-zinc-400" />}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Escolhe as casas que usas. Só as casas selecionadas aparecem — e são importadas — no site e
        na extensão de browser.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <RefreshCw size={14} className="animate-spin" /> A carregar…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {supported.map((key) => {
            const checked = enabledSet.has(key);
            return (
              <label
                key={key}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-sm border cursor-pointer transition-colors ${
                  checked
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-sm border shrink-0 transition-colors ${
                    checked
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {checked && <Check size={13} strokeWidth={3} />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={saving}
                  onChange={(e) => onToggle(key, e.target.checked)}
                />
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {bookmakerLabel(key)}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {enabled.length === 0 && !loading && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          Nenhuma casa selecionada — não vais conseguir importar apostas até escolheres pelo menos uma.
        </p>
      )}

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
}

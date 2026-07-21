import React from "react";
import { Filter } from "lucide-react";

interface FiltersBarProps {
  activeFilterCount: number;
  onClear: () => void;
  /** Os <FilterDropdown>/<TimeframeFilter> desta página. */
  children: React.ReactNode;
  /** Ação opcional encostada ao fim da barra (ex.: "Selecionar várias"). */
  trailing?: React.ReactNode;
  /** Separador superior quando a barra segue outra secção no mesmo cartão. */
  bordered?: boolean;
  id?: string;
}

/**
 * Barra de filtros partilhada pelo dashboard e pelo histórico de apostas, para
 * as duas páginas não divergirem no aspeto.
 *
 * Os filtros ficam num flex-wrap (e não numa grelha de N colunas fixas): o
 * número de filtros varia por página e por utilizador — o estado só existe no
 * histórico, a conta só aparece com contas criadas — e com colunas fixas o
 * último filtro caía sozinho para uma linha quase vazia. Com wrap + `flex-1`
 * cada linha distribui o espaço pelos filtros que lá couberem.
 */
export default function FiltersBar({
  activeFilterCount,
  onClear,
  children,
  trailing,
  bordered = false,
  id,
}: FiltersBarProps) {
  return (
    <div
      id={id}
      className={`flex flex-col gap-3 bg-zinc-50/60 p-4 dark:bg-zinc-950/20 xl:flex-row xl:items-center ${
        bordered ? "border-t border-zinc-100 dark:border-zinc-800" : ""
      }`}
    >
      <div className="flex min-w-fit items-center justify-between gap-3 xl:justify-start">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          <Filter size={13} /> Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {activeFilterCount}
            </span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-semibold text-zinc-400 transition-colors hover:text-emerald-600 dark:text-zinc-500 dark:hover:text-emerald-300 cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>

      {trailing}
    </div>
  );
}

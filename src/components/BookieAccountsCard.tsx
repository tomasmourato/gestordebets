// Cartão das Configurações para gerir contas por casa de apostas.
// Um utilizador pode ter várias contas na mesma casa (ex.: duas contas
// Betclic); as apostas podem ser associadas a uma conta e filtradas por ela.

import React, { useMemo, useState } from "react";
import { Wallet, Plus, Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import { Bet, BookieAccount } from "../types";
import { AVAILABLE_BOOKMAKERS } from "../utils";

interface BookieAccountsCardProps {
  accounts: BookieAccount[];
  bets: Bet[];
  error: string | null;
  clearError: () => void;
  onAdd: (bookmaker: string, label: string) => Promise<BookieAccount | null>;
  onRename: (id: string, label: string) => Promise<BookieAccount | null>;
  onDelete: (id: string) => Promise<boolean>;
}

export default function BookieAccountsCard({
  accounts,
  bets,
  error,
  clearError,
  onAdd,
  onRename,
  onDelete,
}: BookieAccountsCardProps) {
  const [newBookmaker, setNewBookmaker] = useState(AVAILABLE_BOOKMAKERS[0] ?? "Betclic");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Nº de apostas associadas a cada conta (para avisar antes de apagar).
  const betCountByAccount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bet of bets) {
      if (bet.accountId) counts.set(bet.accountId, (counts.get(bet.accountId) || 0) + 1);
    }
    return counts;
  }, [bets]);

  // Agrupadas por casa, pela ordem do registo de casas.
  const grouped = useMemo(() => {
    const groups = new Map<string, BookieAccount[]>();
    for (const account of accounts) {
      const list = groups.get(account.bookmaker) || [];
      list.push(account);
      groups.set(account.bookmaker, list);
    }
    return [...groups.entries()];
  }, [accounts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label || saving) return;
    setSaving(true);
    clearError();
    const created = await onAdd(newBookmaker, label);
    setSaving(false);
    if (created) setNewLabel("");
  };

  const startRename = (account: BookieAccount) => {
    clearError();
    setConfirmDeleteId(null);
    setEditingId(account.id);
    setEditingLabel(account.label);
  };

  const submitRename = async () => {
    const label = editingLabel.trim();
    if (!editingId || !label) return;
    const updated = await onRename(editingId, label);
    if (updated) setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await onDelete(id);
    if (ok) setConfirmDeleteId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-sm p-5 border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
          <Wallet size={18} className="text-indigo-600 dark:text-indigo-400" /> Contas por casa
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Regista as tuas contas em cada casa (podes ter várias na mesma casa). Depois associa
          apostas a cada conta e filtra o painel e a lista por conta.
        </p>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-sm flex items-center gap-2 text-xs font-medium">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}

      {/* Adicionar conta */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
        <select
          value={newBookmaker}
          onChange={(e) => setNewBookmaker(e.target.value)}
          aria-label="Casa de apostas"
          className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-sm px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
        >
          {AVAILABLE_BOOKMAKERS.map((bookie) => (
            <option key={bookie} value={bookie}>{bookie}</option>
          ))}
        </select>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nome da conta (ex.: Conta principal)"
          maxLength={60}
          className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-sm px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-600"
        />
        <button
          type="submit"
          disabled={!newLabel.trim() || saving}
          className="px-3.5 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={13} /> Adicionar
        </button>
      </form>

      {/* Lista de contas agrupada por casa */}
      {grouped.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Ainda não tens contas registadas. As apostas sem conta continuam a funcionar normalmente.
        </p>
      ) : (
        <div className="space-y-3">
          {grouped.map(([bookmaker, list]) => (
            <div key={bookmaker}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                {bookmaker}
              </p>
              <ul className="space-y-1.5">
                {list.map((account) => {
                  const betCount = betCountByAccount.get(account.id) || 0;
                  return (
                    <li
                      key={account.id}
                      className="flex items-center gap-2 p-2.5 rounded-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      {editingId === account.id ? (
                        <>
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); submitRename(); }
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            maxLength={60}
                            autoFocus
                            className="flex-1 border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-800 rounded-sm px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
                          />
                          <button
                            onClick={submitRename}
                            title="Guardar"
                            className="p-1.5 rounded-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            title="Cancelar"
                            className="p-1.5 rounded-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{account.label}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {betCount === 1 ? "1 aposta associada" : `${betCount} apostas associadas`}
                            </p>
                          </div>
                          {confirmDeleteId === account.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">
                                {betCount > 0 ? `As ${betCount} apostas ficam sem conta. Apagar?` : "Apagar?"}
                              </span>
                              <button
                                onClick={() => handleDelete(account.id)}
                                className="px-2 py-1 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => startRename(account)}
                                title="Renomear conta"
                                className="p-1.5 rounded-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => { clearError(); setEditingId(null); setConfirmDeleteId(account.id); }}
                                title="Apagar conta"
                                className="p-1.5 rounded-sm text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        Apagar uma conta não apaga as apostas — ficam apenas "sem conta", associadas à casa.
      </p>
    </div>
  );
}

// src/hooks/useAccounts.ts
// Estado das contas por casa de apostas, server-first (mesmo padrão de
// useBets): o estado local só é atualizado a partir da resposta do servidor.

import { useEffect, useRef, useState } from "react";
import { BookieAccount } from "../types";
import { SessionExpiredError } from "../lib/authApi";
import { fetchAccounts, createAccount, renameAccount, deleteAccount } from "../lib/accountsApi";

export function useAccounts(enabled: boolean, onSessionExpired: () => void) {
  const [accounts, setAccounts] = useState<BookieAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const handleError = (err: unknown) => {
    if (err instanceof SessionExpiredError) {
      onSessionExpiredRef.current();
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Ocorreu um erro inesperado.");
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (!enabled) {
      setAccounts([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchAccounts()
      .then((loaded) => {
        if (!cancelled) setAccounts(loaded);
      })
      .catch((err) => {
        if (!cancelled) handleError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const sortAccounts = (list: BookieAccount[]) =>
    [...list].sort((a, b) =>
      a.bookmaker.localeCompare(b.bookmaker) || a.label.localeCompare(b.label)
    );

  const addAccount = async (bookmaker: string, label: string): Promise<BookieAccount | null> => {
    setError(null);
    try {
      const created = await createAccount(bookmaker, label);
      setAccounts((prev) => sortAccounts([...prev, created]));
      return created;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const editAccount = async (id: string, label: string): Promise<BookieAccount | null> => {
    setError(null);
    try {
      const updated = await renameAccount(id, label);
      setAccounts((prev) => sortAccounts(prev.map((a) => (a.id === updated.id ? updated : a))));
      return updated;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const removeAccount = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  return { accounts, isLoading, error, clearError, addAccount, editAccount, removeAccount };
}

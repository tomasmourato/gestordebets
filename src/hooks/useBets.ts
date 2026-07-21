// src/hooks/useBets.ts
// Hook que gere o estado das apostas tendo o PostgreSQL como única fonte
// de verdade. Todas as mutações são server-first: o estado local só é
// atualizado a partir da resposta do servidor.

import { useEffect, useRef, useState } from "react";
import { Bet } from "../types";
import { SessionExpiredError } from "../lib/authApi";
import {
  fetchBets,
  createBet,
  createBets,
  updateBet,
  deleteBet,
  deleteAllBets,
} from "../lib/betsApi";

export function useBets(enabled: boolean, onSessionExpired: () => void) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref estável para o callback de sessão expirada, para que o efeito de
  // carregamento não volte a correr quando a identidade do callback muda.
  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  // Tratamento central de erros das mutações/carregamento.
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

  // Carregamento inicial (e sempre que `enabled` muda).
  useEffect(() => {
    if (!enabled) {
      setBets([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchBets()
      .then((loaded) => {
        if (!cancelled) setBets(loaded);
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

  // Recarrega as apostas do servidor (usado no pull-to-refresh mobile).
  // Não mexe no isLoading para não trocar o ecrã pelo spinner de arranque;
  // o indicador de refresh é da responsabilidade de quem chama.
  const refresh = async (): Promise<void> => {
    if (!enabled) return;
    setError(null);
    try {
      const loaded = await fetchBets();
      setBets(loaded);
    } catch (err) {
      handleError(err);
    }
  };

  // ----------------------------------------------------
  // Mutações (server-first)
  // ----------------------------------------------------

  const addBet = async (bet: Bet): Promise<Bet | null> => {
    setError(null);
    try {
      const created = await createBet(bet);
      setBets((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const importBets = async (newBets: Bet[]): Promise<Bet[] | null> => {
    setError(null);
    try {
      const created = await createBets(newBets);
      setBets((prev) => [...created, ...prev]);
      return created;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const editBet = async (bet: Bet): Promise<Bet | null> => {
    setError(null);
    try {
      const updated = await updateBet(bet);
      setBets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      return updated;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const removeBet = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await deleteBet(id);
      setBets((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const clearAllBets = async (): Promise<boolean> => {
    setError(null);
    try {
      await deleteAllBets();
      setBets([]);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const replaceAllBets = async (newBets: Bet[]): Promise<Bet[] | null> => {
    setError(null);
    try {
      await deleteAllBets();
      const created = await createBets(newBets);
      setBets(created);
      return created;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  return {
    bets,
    isLoading,
    error,
    clearError,
    refresh,
    addBet,
    importBets,
    editBet,
    removeBet,
    clearAllBets,
    replaceAllBets,
  };
}

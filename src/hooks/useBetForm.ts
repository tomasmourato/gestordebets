// src/hooks/useBetForm.ts
// Estado + validação + construção do formulário de aposta, extraído do
// BetsManager para ser partilhado com a UI mobile (src/mobile/screens/
// MobileBets.tsx). A semântica espelha 1:1 o formulário desktop: mesmos
// defaults, mesma validação, mesma preservação de metadata (cashout) e os
// mesmos cálculos partilhados (calculateBetReturnAndProfit).
//
// Nota: o BetsManager desktop mantém, por agora, a sua própria cópia deste
// estado (pré-existente). Qualquer alteração às regras deve ser feita aqui
// e replicada lá até o desktop ser migrado para este hook.

import { useMemo, useState } from "react";
import { Bet, BookieAccount, Selection, BetStatus, BetType, FreebetType } from "../types";
import { calculateBetReturnAndProfit, AVAILABLE_BOOKMAKERS, safeNum } from "../utils";
import { defaultFreebetTypeFor } from "../lib/bookmakers";
import { hasCashoutSignal } from "../lib/betStatus";

export interface FormSelection {
  event: string;
  market: string;
  choice: string;
  odd: string;
}

const nowLocal = () => new Date().toISOString().replace("T", " ").slice(0, 16);

export function useBetForm(accounts: BookieAccount[]) {
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<BetType>("SIMPLES");
  const [status, setStatus] = useState<BetStatus>("POR_LIQUIDAR");
  const [bookmaker, setBookmaker] = useState("Betano");
  const [customBookmaker, setCustomBookmaker] = useState("");
  const [accountId, setAccountId] = useState(""); // "" = sem conta
  const [stake, setStake] = useState<string>("10.00");
  const [isFreebet, setIsFreebet] = useState(false);
  const [isRiskFree, setIsRiskFree] = useState(false);
  const [freebetType, setFreebetType] = useState<FreebetType>("SNR");
  const [cashoutReturn, setCashoutReturn] = useState<string>("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [settledReturn, setSettledReturn] = useState("");
  const [selections, setSelections] = useState<FormSelection[]>([
    { event: "", market: "", choice: "", odd: "1.80" },
  ]);

  // Odd combinada (produto das odds válidas).
  const calculatedOdd = useMemo(() => {
    let multiplier = 1;
    let validCount = 0;
    selections.forEach((s) => {
      const parsed = parseFloat(s.odd);
      if (!isNaN(parsed) && parsed > 0) {
        multiplier *= parsed;
        validCount++;
      }
    });
    return validCount > 0 ? Number(multiplier.toFixed(2)) : 1.0;
  }, [selections]);

  // Pré-visualização em tempo real do retorno/lucro (inclui cashout, tipo de
  // freebet e o retorno liquidado manual de meio-ganha/meio-perdida).
  const potentialWinnings = useMemo(() => {
    const stakeNum = parseFloat(stake) || 0;
    const calcs = calculateBetReturnAndProfit(
      stakeNum,
      calculatedOdd,
      status,
      isFreebet,
      parseFloat(cashoutReturn) || 0,
      freebetType,
      isRiskFree,
    );

    if (status === "MEIO_GANHA" || status === "MEIO_PERDIDA") {
      const customReturn = Number(settledReturn.replace(",", "."));
      if (settledReturn.trim() !== "" && Number.isFinite(customReturn) && customReturn >= 0) {
        const finalReturn = Number(customReturn.toFixed(2));
        return {
          ...calcs,
          finalReturn,
          netProfit: Number((isFreebet ? finalReturn : finalReturn - stakeNum).toFixed(2)),
        };
      }
    }

    return calcs;
  }, [stake, calculatedOdd, status, isFreebet, isRiskFree, settledReturn, cashoutReturn, freebetType]);

  const reset = () => {
    setEditingBet(null);
    setType("SIMPLES");
    setStatus("POR_LIQUIDAR");
    setBookmaker("Betano");
    setCustomBookmaker("");
    setAccountId("");
    setStake("10.00");
    setIsFreebet(false);
    setIsRiskFree(false);
    setFreebetType(defaultFreebetTypeFor("Betano"));
    setCashoutReturn("");
    setDateTime(nowLocal());
    setNotes("");
    setSettledReturn("");
    setSelections([{ event: "", market: "", choice: "", odd: "1.80" }]);
    setError(null);
  };

  /** Prepara o formulário para uma nova aposta. */
  const startAdd = () => {
    reset();
  };

  /** Carrega uma aposta existente para edição. */
  const startEdit = (bet: Bet) => {
    setError(null);
    setEditingBet(bet);
    setType(bet.type);
    setStatus(bet.status);

    if (AVAILABLE_BOOKMAKERS.includes(bet.bookmaker)) {
      setBookmaker(bet.bookmaker);
      setCustomBookmaker("");
    } else {
      setBookmaker("Outra");
      setCustomBookmaker(bet.bookmaker);
    }

    setAccountId(bet.accountId ?? "");
    setStake(bet.stake.toString());
    setIsFreebet(bet.isFreebet);
    setIsRiskFree(bet.isRiskFree ?? false);
    setFreebetType(bet.freebetType ?? defaultFreebetTypeFor(bet.bookmaker));
    setCashoutReturn(bet.status === "CASHOUT" ? String(bet.finalReturn ?? "") : "");
    setDateTime(bet.dateTime);
    setNotes(bet.notes || "");
    setSettledReturn(
      bet.status === "MEIO_GANHA" || bet.status === "MEIO_PERDIDA"
        ? safeNum(bet.finalReturn).toFixed(2)
        : "",
    );
    setSelections(
      bet.selections.map((s) => ({
        event: s.event,
        market: s.market,
        choice: s.choice,
        odd: s.odd.toString(),
      })),
    );
  };

  /** Muda a casa e ajusta o tipo de freebet por omissão dessa casa. */
  const changeBookmaker = (next: string) => {
    setBookmaker(next);
    if (next !== "Outra") setFreebetType(defaultFreebetTypeFor(next));
  };

  const addSelection = () => {
    setSelections((prev) => [...prev, { event: "", market: "", choice: "", odd: "1.50" }]);
  };

  const removeSelection = (index: number) => {
    setSelections((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const changeSelection = (index: number, field: keyof FormSelection, value: string) => {
    setSelections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /**
   * Valida e constrói a aposta final. Devolve null (e define `error`) se a
   * validação falhar. A preservação de metadata segue o desktop: comment/
   * tags/metadata não são editáveis mas têm de sobreviver ao PUT; se o
   * utilizador corrigiu o estado de um cashout, as marcas de cashout são
   * limpas para o servidor não o forçar de volta.
   */
  const buildBet = (): Bet | null => {
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setError("Por favor insere uma Stake válida.");
      return null;
    }

    const finalBookmaker = bookmaker === "Outra" ? customBookmaker.trim() : bookmaker;
    if (!finalBookmaker) {
      setError("Por favor define a Casa de Apostas.");
      return null;
    }

    const built: Selection[] = [];
    let isValid = true;

    selections.forEach((s, idx) => {
      const oddVal = parseFloat(s.odd);
      if (!s.event.trim() || !s.market.trim() || !s.choice.trim() || isNaN(oddVal) || oddVal <= 1) {
        isValid = false;
      }
      built.push({
        id: `sel-${editingBet?.id || "new"}-${idx}-${Date.now()}`,
        event: s.event.trim(),
        market: s.market.trim(),
        choice: s.choice.trim(),
        odd: oddVal,
      });
    });

    if (!isValid) {
      setError("Por favor preenche todos os campos das seleções com valores válidos (odds devem ser maiores que 1.0).");
      return null;
    }

    setError(null);

    const { potentialReturn, finalReturn, netProfit } = potentialWinnings;

    const preservedMetadata = (() => {
      const metadata = editingBet?.metadata;
      if (!metadata) return undefined;
      if (status === "CASHOUT" || !hasCashoutSignal(undefined, metadata)) return metadata;
      const { isCashout, originalStatus, betclicResult, settlementStatus, ...rest } = metadata;
      return { ...rest, isCashout: false };
    })();

    return {
      id: editingBet ? editingBet.id : "bet-" + Date.now(),
      type,
      status,
      selections: built,
      stake: stakeNum,
      odd: calculatedOdd,
      isFreebet,
      freebetType: isFreebet ? freebetType : undefined,
      isRiskFree,
      potentialReturn,
      finalReturn,
      netProfit,
      bookmaker: finalBookmaker,
      dateTime: dateTime || nowLocal(),
      accountId: (() => {
        if (!accountId) return undefined;
        const account = accounts.find((a) => a.id === accountId);
        return account && account.bookmaker === finalBookmaker ? accountId : undefined;
      })(),
      notes: notes.trim() || undefined,
      origin: editingBet ? editingBet.origin : "MANUAL",
      comment: editingBet?.comment,
      tags: editingBet?.tags,
      metadata: preservedMetadata,
    };
  };

  return {
    editingBet,
    error,
    setError,
    // valores + setters
    type, setType,
    status, setStatus,
    bookmaker, changeBookmaker,
    customBookmaker, setCustomBookmaker,
    accountId, setAccountId,
    stake, setStake,
    isFreebet, setIsFreebet,
    isRiskFree, setIsRiskFree,
    freebetType, setFreebetType,
    cashoutReturn, setCashoutReturn,
    dateTime, setDateTime,
    notes, setNotes,
    settledReturn, setSettledReturn,
    selections,
    // derivados
    calculatedOdd,
    potentialWinnings,
    // ações
    reset,
    startAdd,
    startEdit,
    addSelection,
    removeSelection,
    changeSelection,
    buildBet,
  };
}

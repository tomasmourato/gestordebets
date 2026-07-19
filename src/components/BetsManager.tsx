import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Copy, 
  X, 
  PlusCircle, 
  MinusCircle, 
  Check, 
  HelpCircle,
  Eye,
  Trash,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  CalendarRange
} from "lucide-react";
import { Bet, BookieAccount, Selection, BetStatus, BetType, FreebetType } from "../types";
import { calculateBetReturnAndProfit, AVAILABLE_BOOKMAKERS, safeNum } from "../utils";
import { defaultFreebetTypeFor } from "../lib/bookmakers";
import { hasCashoutSignal } from "../lib/betStatus";
import FilterDropdown from "./FilterDropdown";

interface BetsManagerProps {
  bets: Bet[];
  currency: string;
  accounts?: BookieAccount[];
  onAddBet: (bet: Bet) => void | Promise<void>;
  onAddBets: (bets: Bet[]) => void | Promise<void>;
  onUpdateBet: (bet: Bet) => void | Promise<void>;
  onDeleteBet: (id: string) => void | Promise<void>;
}

type SortField = "date" | "stake" | "odd" | "profit";
type SortDirection = "asc" | "desc";

export default function BetsManager({ 
  bets, 
  currency, 
  onAddBet,
  onAddBets,
  onUpdateBet,
  onDeleteBet,
  accounts = []
}: BetsManagerProps) {
  const initialFilters = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialFilter = (name: string) => initialFilters.get(name) || "ALL";
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(() => initialFilter("status"));
  const [typeFilter, setTypeFilter] = useState<string>(() => initialFilter("type"));
  const [freebetFilter, setFreebetFilter] = useState<string>(() => initialFilter("money"));
  const [bookmakerFilter, setBookmakerFilter] = useState<string>(() => initialFilter("bookmaker"));
  // "ALL" | "NONE" (sem conta) | id de uma conta — também chega via drill-down (?account=)
  const [accountFilter, setAccountFilter] = useState<string>(() => initialFilter("account"));
  const [sportFilter, setSportFilter] = useState<string>(() => initialFilter("sport"));
  const [dateFromFilter, setDateFromFilter] = useState(() => initialFilters.get("dateFrom") || "");
  const [dateToFilter, setDateToFilter] = useState(() => initialFilters.get("dateTo") || "");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedBetIds, setSelectedBetIds] = useState<Set<string>>(new Set());
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<BetType>("SIMPLES");
  const [formStatus, setFormStatus] = useState<BetStatus>("POR_LIQUIDAR");
  const [formBookmaker, setFormBookmaker] = useState("Betano");
  const [formCustomBookmaker, setFormCustomBookmaker] = useState("");
  const [formAccountId, setFormAccountId] = useState(""); // "" = sem conta
  const [formStake, setFormStake] = useState<string>("10.00");
  const [formIsFreebet, setFormIsFreebet] = useState(false);
  const [formIsRiskFree, setFormIsRiskFree] = useState(false);
  const [formFreebetType, setFormFreebetType] = useState<FreebetType>("SNR");
  const [formCashoutReturn, setFormCashoutReturn] = useState<string>("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSettledReturn, setFormSettledReturn] = useState("");
  const [formSelections, setFormSelections] = useState<Array<{
    event: string;
    market: string;
    choice: string;
    odd: string;
  }>>([{ event: "", market: "", choice: "", odd: "1.80" }]);

  // Combined Odd Calculator based on selections
  const calculatedOdd = useMemo(() => {
    let multiplier = 1;
    let validCount = 0;
    formSelections.forEach(s => {
      const parsed = parseFloat(s.odd);
      if (!isNaN(parsed) && parsed > 0) {
        multiplier *= parsed;
        validCount++;
      }
    });
    return validCount > 0 ? Number(multiplier.toFixed(2)) : 1.00;
  }, [formSelections]);

  // Real-time calculations for potential return in the form
  const potentialWinningsInfo = useMemo(() => {
    const stakeNum = parseFloat(formStake) || 0;
    const calcs = calculateBetReturnAndProfit(
      stakeNum,
      calculatedOdd,
      formStatus,
      formIsFreebet,
      parseFloat(formCashoutReturn) || 0,
      formFreebetType,
      formIsRiskFree
    );

    // Meio-ganha/meio-perdida: o utilizador pode indicar o retorno liquidado
    // manualmente (fork). O cashout usa o seu próprio campo (formCashoutReturn).
    if (formStatus === "MEIO_GANHA" || formStatus === "MEIO_PERDIDA") {
      const customReturn = Number(formSettledReturn.replace(",", "."));
      if (formSettledReturn.trim() !== "" && Number.isFinite(customReturn) && customReturn >= 0) {
        const finalReturn = Number(customReturn.toFixed(2));
        return {
          ...calcs,
          finalReturn,
          netProfit: Number((formIsFreebet ? finalReturn : finalReturn - stakeNum).toFixed(2)),
        };
      }
    }

    return calcs;
  }, [formStake, calculatedOdd, formStatus, formIsFreebet, formIsRiskFree, formSettledReturn, formCashoutReturn, formFreebetType]);

  const sportOptions = useMemo(
    () => Array.from(new Set(
      bets.flatMap(bet => bet.selections.map(selection => selection.sport?.trim()).filter((sport): sport is string => Boolean(sport)))
    )).sort((a, b) => a.localeCompare(b, "pt")),
    [bets]
  );
  const bookmakerOptions = useMemo(
    () => Array.from(new Set([...AVAILABLE_BOOKMAKERS, ...bets.map(bet => bet.bookmaker).filter(Boolean)]))
      .sort((a, b) => a.localeCompare(b, "pt")),
    [bets]
  );
  const accountLabelById = useMemo(
    () => new Map(accounts.map(account => [account.id, account.label])),
    [accounts]
  );

  // Filtered and sorted bets
  const filteredBets = useMemo(() => {
    const visibleBets = bets.filter(bet => {
      // Search matches event, market, choice, bookmaker, or notes
      const matchesSearch = search === "" || bet.selections.some(s => 
        s.event.toLowerCase().includes(search.toLowerCase()) ||
        s.market.toLowerCase().includes(search.toLowerCase()) ||
        s.choice.toLowerCase().includes(search.toLowerCase())
      ) || bet.bookmaker.toLowerCase().includes(search.toLowerCase()) || 
          (bet.notes && bet.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || bet.status === statusFilter;
      const matchesType = typeFilter === "ALL" || bet.type === typeFilter;
      
      let matchesFreebet = true;
      if (freebetFilter === "FREEBET") matchesFreebet = bet.isFreebet;
      if (freebetFilter === "RISK_FREE") matchesFreebet = !!bet.isRiskFree;
      if (freebetFilter === "NORMAL") matchesFreebet = !bet.isFreebet && !bet.isRiskFree;

      const matchesBookmaker = bookmakerFilter === "ALL" || bet.bookmaker === bookmakerFilter;
      const matchesAccount =
        accountFilter === "ALL" ||
        (accountFilter === "NONE" ? !bet.accountId : bet.accountId === accountFilter);
      const matchesSport = sportFilter === "ALL" || bet.selections.some(selection => selection.sport?.trim() === sportFilter);
      const betDate = bet.dateTime?.slice(0, 10) || "";
      const matchesDateFrom = !dateFromFilter || Boolean(betDate && betDate >= dateFromFilter);
      const matchesDateTo = !dateToFilter || Boolean(betDate && betDate <= dateToFilter);

      return matchesSearch && matchesStatus && matchesType && matchesFreebet && matchesBookmaker && matchesAccount && matchesSport && matchesDateFrom && matchesDateTo;
    });

    return visibleBets.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "stake":
          comparison = safeNum(a.stake) - safeNum(b.stake);
          break;
        case "odd":
          comparison = safeNum(a.odd) - safeNum(b.odd);
          break;
        case "profit":
          comparison = safeNum(a.netProfit) - safeNum(b.netProfit);
          break;
        case "date":
        default:
          comparison = new Date(a.dateTime.replace(" ", "T")).getTime() - new Date(b.dateTime.replace(" ", "T")).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [bets, search, statusFilter, typeFilter, freebetFilter, bookmakerFilter, accountFilter, sportFilter, dateFromFilter, dateToFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(current => current === "asc" ? "desc" : "asc");
      return;
    }

    setSortField(field);
    setSortDirection("desc");
  };

  const toggleSelectionMode = () => {
    setIsSelecting(current => {
      if (current) {
        setSelectedBetIds(new Set());
        setIsConfirmingBulkDelete(false);
      }
      return !current;
    });
  };

  const toggleBetSelection = (id: string) => {
    setIsConfirmingBulkDelete(false);
    setSelectedBetIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredBetsSelected = filteredBets.length > 0 && filteredBets.every(bet => selectedBetIds.has(bet.id));

  const toggleAllFilteredBets = () => {
    setIsConfirmingBulkDelete(false);
    setSelectedBetIds(current => {
      const next = new Set(current);
      if (allFilteredBetsSelected) filteredBets.forEach(bet => next.delete(bet.id));
      else filteredBets.forEach(bet => next.add(bet.id));
      return next;
    });
  };

  const finishBulkAction = () => {
    setSelectedBetIds(new Set());
    setIsConfirmingBulkDelete(false);
    setIsSelecting(false);
    setIsBulkActionRunning(false);
  };

  const handleBulkDuplicate = async () => {
    const selectedBets = bets.filter(bet => selectedBetIds.has(bet.id));
    if (selectedBets.length === 0) return;

    setIsBulkActionRunning(true);
    const timestamp = Date.now();
    const duplicatedAt = new Date().toISOString().replace("T", " ").slice(0, 16);

    const duplicatedBets = selectedBets.map((bet, betIndex) => {
      const duplicateId = `bet-${timestamp}-${betIndex}`;
      return {
        ...bet,
        id: duplicateId,
        selections: bet.selections.map((selection, selectionIndex) => ({
          ...selection,
          id: `${duplicateId}-sel-${selectionIndex}`
        })),
        dateTime: duplicatedAt,
        notes: bet.notes ? `[Duplicado] ${bet.notes}` : "Aposta duplicada.",
        origin: "MANUAL",
        // Sem metadata: o duplicado não pode herdar o importKey, senão a
        // extensão confunde-o com a aposta importada original.
        metadata: undefined
      } as Bet;
    });

    await onAddBets(duplicatedBets);

    finishBulkAction();
  };

  const handleBulkDelete = async () => {
    const selectedIds = bets.filter(bet => selectedBetIds.has(bet.id)).map(bet => bet.id);
    if (selectedIds.length === 0) return;

    setIsBulkActionRunning(true);
    for (const id of selectedIds) {
      await onDeleteBet(id);
    }
    finishBulkAction();
  };

  const sortButton = (label: string, field: SortField, extraClasses = "") => {
    const isActive = sortField === field;
    const DirectionIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;

    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
          isActive
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
        } ${extraClasses}`}
        aria-label={`Ordenar por ${label}${isActive ? `, direção ${sortDirection === "asc" ? "ascendente" : "descendente"}` : ""}`}
        title={`Ordenar por ${label}`}
      >
        {label}
        {isActive && <DirectionIcon size={9} strokeWidth={2.5} />}
      </button>
    );
  };

  // Reset Form
  const resetForm = () => {
    setEditingBet(null);
    setFormType("SIMPLES");
    setFormStatus("POR_LIQUIDAR");
    setFormBookmaker("Betano");
    setFormCustomBookmaker("");
    setFormAccountId("");
    setFormStake("10.00");
    setFormIsFreebet(false);
    setFormIsRiskFree(false);
    setFormFreebetType(defaultFreebetTypeFor("Betano"));
    setFormCashoutReturn("");
    setFormDateTime(new Date().toISOString().replace("T", " ").slice(0, 16));
    setFormNotes("");
    setFormSettledReturn("");
    setFormSelections([{ event: "", market: "", choice: "", odd: "1.80" }]);
    setFormError(null);
  };

  // Open Modal for Add
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (bet: Bet) => {
    setFormError(null);
    setEditingBet(bet);
    setFormType(bet.type);
    setFormStatus(bet.status);
    
    if (AVAILABLE_BOOKMAKERS.includes(bet.bookmaker)) {
      setFormBookmaker(bet.bookmaker);
      setFormCustomBookmaker("");
    } else {
      setFormBookmaker("Outra");
      setFormCustomBookmaker(bet.bookmaker);
    }
    
    setFormAccountId(bet.accountId ?? "");
    setFormStake(bet.stake.toString());
    setFormIsFreebet(bet.isFreebet);
    setFormIsRiskFree(bet.isRiskFree ?? false);
    setFormFreebetType(bet.freebetType ?? defaultFreebetTypeFor(bet.bookmaker));
    setFormCashoutReturn(bet.status === "CASHOUT" ? String(bet.finalReturn ?? "") : "");
    setFormDateTime(bet.dateTime);
    setFormNotes(bet.notes || "");
    setFormSettledReturn(
      bet.status === "MEIO_GANHA" || bet.status === "MEIO_PERDIDA"
        ? safeNum(bet.finalReturn).toFixed(2)
        : ""
    );
    setFormSelections(bet.selections.map(s => ({
      event: s.event,
      market: s.market,
      choice: s.choice,
      odd: s.odd.toString()
    })));
    setIsModalOpen(true);
  };

  // Duplicate Bet
  const handleDuplicate = (bet: Bet) => {
    const duplicated: Bet = {
      ...bet,
      id: "bet-" + Date.now(),
      dateTime: new Date().toISOString().replace("T", " ").slice(0, 16),
      notes: bet.notes ? `[Duplicado] ${bet.notes}` : "Aposta duplicada.",
      origin: "MANUAL",
      // Sem metadata: o duplicado não pode herdar o importKey da original.
      metadata: undefined
    };
    onAddBet(duplicated);
  };

  // Add Selection inside form
  const addSelection = () => {
    setFormSelections([...formSelections, { event: "", market: "", choice: "", odd: "1.50" }]);
  };

  // Remove Selection inside form
  const removeSelection = (index: number) => {
    if (formSelections.length > 1) {
      setFormSelections(formSelections.filter((_, i) => i !== index));
    }
  };

  // Handle Input changes in Selections
  const handleSelectionChange = (index: number, field: string, value: string) => {
    const updated = [...formSelections];
    updated[index] = { ...updated[index], [field]: value };
    setFormSelections(updated);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const stakeNum = parseFloat(formStake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setFormError("Por favor insere uma Stake válida.");
      return;
    }

    const finalBookmaker = formBookmaker === "Outra" ? formCustomBookmaker.trim() : formBookmaker;
    if (!finalBookmaker) {
      setFormError("Por favor define a Casa de Apostas.");
      return;
    }

    // Build selections
    const selections: Selection[] = [];
    let isValid = true;
    
    formSelections.forEach((s, idx) => {
      const oddVal = parseFloat(s.odd);
      if (!s.event.trim() || !s.market.trim() || !s.choice.trim() || isNaN(oddVal) || oddVal <= 1) {
        isValid = false;
      }
      selections.push({
        id: `sel-${editingBet?.id || "new"}-${idx}-${Date.now()}`,
        event: s.event.trim(),
        market: s.market.trim(),
        choice: s.choice.trim(),
        odd: oddVal
      });
    });

    if (!isValid) {
      setFormError("Por favor preenche todos os campos das seleções com valores válidos (odds devem ser maiores que 1.0).");
      return;
    }

    setFormError(null);

    // Reutiliza o memo (já inclui cashout, tipo de freebet e o retorno
    // liquidado manual de meio-ganha/perdida) para o valor gravado bater
    // exatamente com o que a pré-visualização mostra.
    const { potentialReturn, finalReturn, netProfit } = potentialWinningsInfo;

    // O PUT substitui a aposta inteira; comment/tags/metadata não são editáveis
    // neste formulário mas têm de ser preservados — a metadata guarda a chave
    // de deduplicação (importKey) usada pela extensão.
    const preservedMetadata = (() => {
      const metadata = editingBet?.metadata;
      if (!metadata) return undefined;
      if (formStatus === "CASHOUT" || !hasCashoutSignal(undefined, metadata)) return metadata;
      // O utilizador corrigiu o estado de um cashout: sem limpar as marcas, o
      // servidor (normalizeBetStatus + constraint da BD) forçava CASHOUT de volta.
      const { isCashout, originalStatus, betclicResult, settlementStatus, ...rest } = metadata;
      return { ...rest, isCashout: false };
    })();

    const betData: Bet = {
      id: editingBet ? editingBet.id : "bet-" + Date.now(),
      type: formType,
      status: formStatus,
      selections: selections,
      stake: stakeNum,
      odd: calculatedOdd,
      isFreebet: formIsFreebet,
      freebetType: formIsFreebet ? formFreebetType : undefined,
      isRiskFree: formIsRiskFree,
      potentialReturn,
      finalReturn,
      netProfit,
      bookmaker: finalBookmaker,
      dateTime: formDateTime || new Date().toISOString().replace("T", " ").slice(0, 16),
      // Só aceita a conta se pertencer à casa escolhida (o utilizador pode
      // ter mudado a casa depois de escolher a conta).
      accountId: (() => {
        if (!formAccountId) return undefined;
        const account = accounts.find(a => a.id === formAccountId);
        return account && account.bookmaker === finalBookmaker ? formAccountId : undefined;
      })(),
      notes: formNotes.trim() || undefined,
      origin: editingBet ? editingBet.origin : "MANUAL",
      comment: editingBet?.comment,
      tags: editingBet?.tags,
      metadata: preservedMetadata
    };

    if (editingBet) {
      onUpdateBet(betData);
    } else {
      onAddBet(betData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Map status values to badges
  const getStatusBadge = (status: BetStatus) => {
    const base = "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-max border";
    switch (status) {
      case "POR_LIQUIDAR":
        return <span className={`${base} bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900`}><Clock size={10} /> Por Liquidar</span>;
      case "GANHA":
        return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900`}><Check size={10} /> Ganha</span>;
      case "PERDIDA":
        return <span className={`${base} bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900`}><X size={10} /> Perdida</span>;
      case "ANULADA":
        return <span className={`${base} bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700`}><MinusCircle size={10} /> Anulada</span>;
      case "MEIO_GANHA":
        return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900`}><Check size={10} /> Meio Ganha</span>;
      case "MEIO_PERDIDA":
        return <span className={`${base} bg-rose-50/50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900`}><X size={10} /> Meio Perdida</span>;
      case "CASHOUT":
        return <span className={`${base} bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-900`}><MinusCircle size={10} /> Cashout</span>;
    }
  };

  const activeFilterCount = [statusFilter, typeFilter, freebetFilter, bookmakerFilter, accountFilter, sportFilter]
    .filter(value => value !== "ALL").length + (dateFromFilter || dateToFilter ? 1 : 0);
  const formatFilterDate = (date: string) => date ? date.split("-").reverse().join("/") : "…";
  const clearFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setFreebetFilter("ALL");
    setBookmakerFilter("ALL");
    setAccountFilter("ALL");
    setSportFilter("ALL");
    setDateFromFilter("");
    setDateToFilter("");
  };

  return (
    <div className="space-y-4" id="bets-tab">
      
      {/* Search and Filters Toolbar */}
      <div className="overflow-visible rounded-sm border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900" id="bets-toolbar">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              placeholder="Pesquisar equipa, mercado ou notas..."
              className="h-10 w-full rounded-sm border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-xs text-zinc-800 outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-emerald-500 dark:focus:bg-zinc-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {(dateFromFilter || dateToFilter) && (
            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
              <CalendarRange size={13} />
              {formatFilterDate(dateFromFilter)} — {formatFilterDate(dateToFilter)}
              <button
                type="button"
                onClick={() => {
                  setDateFromFilter("");
                  setDateToFilter("");
                }}
                className="ml-0.5 rounded p-0.5 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900 cursor-pointer"
                aria-label="Remover filtro de período"
              >
                <X size={11} />
              </button>
            </span>
          )}

          <span className="hidden text-[11px] font-medium text-zinc-400 lg:block dark:text-zinc-500">
            {filteredBets.length} de {bets.length} apostas
          </span>

          {/* New Bet Button */}
          <button
            onClick={openAddModal}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm shadow-emerald-950/15 transition-all hover:bg-emerald-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 cursor-pointer"
            id="btn-new-bet"
          >
            <Plus size={15} strokeWidth={2.5} /> Registar Aposta
          </button>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/20 xl:flex-row xl:items-center">
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
                onClick={clearFilters}
                className="text-[10px] font-semibold text-zinc-400 transition-colors hover:text-emerald-600 dark:text-zinc-500 dark:hover:text-emerald-300 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          
          <FilterDropdown
            value={statusFilter}
            options={[
              { value: "ALL", label: "Todos os Estados" },
              { value: "POR_LIQUIDAR", label: "Por Liquidar" },
              { value: "GANHA", label: "Ganha" },
              { value: "PERDIDA", label: "Perdida" },
              { value: "ANULADA", label: "Anulada" },
              { value: "MEIO_GANHA", label: "Meio Ganha" },
              { value: "MEIO_PERDIDA", label: "Meio Perdida" },
              { value: "CASHOUT", label: "Cashout" }
            ]}
            onChange={setStatusFilter}
            ariaLabel="Filtrar por estado"
          />

          <FilterDropdown
            value={typeFilter}
            options={[
              { value: "ALL", label: "Qualquer Tipo" },
              { value: "SIMPLES", label: "Simples" },
              { value: "MULTIPLA", label: "Múltipla" }
            ]}
            onChange={setTypeFilter}
            ariaLabel="Filtrar por tipo de aposta"
          />

          <FilterDropdown
            value={freebetFilter}
            options={[
              { value: "ALL", label: "Tipo de Dinheiro" },
              { value: "NORMAL", label: "Dinheiro Real" },
              { value: "FREEBET", label: "Freebet" },
              { value: "RISK_FREE", label: "Sem risco" }
            ]}
            onChange={setFreebetFilter}
            ariaLabel="Filtrar por tipo de dinheiro"
          />

          <FilterDropdown
            value={bookmakerFilter}
            options={[{ value: "ALL", label: "Todas as Casas" }, ...bookmakerOptions.map(bookmaker => ({ value: bookmaker, label: bookmaker }))]}
            onChange={setBookmakerFilter}
            ariaLabel="Filtrar por casa de apostas"
          />

          {accounts.length > 0 && (
            <FilterDropdown
              value={accountFilter}
              options={[
                { value: "ALL", label: "Todas as Contas" },
                ...accounts.map(account => ({ value: account.id, label: `${account.bookmaker} · ${account.label}` })),
                { value: "NONE", label: "Sem conta" }
              ]}
              onChange={setAccountFilter}
              ariaLabel="Filtrar por conta"
            />
          )}

          <FilterDropdown
            value={sportFilter}
            options={[{ value: "ALL", label: "Todos os Desportos" }, ...sportOptions.map(sport => ({ value: sport, label: sport }))]}
            onChange={setSportFilter}
            ariaLabel="Filtrar por desporto"
          />

          </div>

          {/* Multiple selection */}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm border px-3 text-xs font-semibold transition-colors cursor-pointer ${
              isSelecting
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
            }`}
          >
            <CheckSquare size={14} />
            {isSelecting ? "Cancelar seleção" : "Selecionar várias"}
          </button>

          {isSelecting && (
            <button
              type="button"
              onClick={toggleAllFilteredBets}
              disabled={filteredBets.length === 0}
              className="h-9 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 transition-colors hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:border-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              {allFilteredBetsSelected ? "Desmarcar filtradas" : `Selecionar filtradas (${filteredBets.length})`}
            </button>
          )}

        </div>
      </div>

      {isSelecting && selectedBetIds.size > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            <strong className="text-emerald-600 dark:text-emerald-300">{selectedBetIds.size}</strong>{" "}
            {selectedBetIds.size === 1 ? "aposta selecionada" : "apostas selecionadas"}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {isConfirmingBulkDelete ? (
              <div className="inline-flex items-center gap-2 rounded-sm border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-2 py-1">
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  Apagar {selectedBetIds.size} {selectedBetIds.size === 1 ? "aposta" : "apostas"}?
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkActionRunning}
                  className="px-2.5 py-1 rounded-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingBulkDelete(false)}
                  disabled={isBulkActionRunning}
                  className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Cancelar eliminação"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBulkDuplicate}
                  disabled={isBulkActionRunning}
                  className="px-3 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-300 disabled:opacity-50 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Copy size={13} /> Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingBulkDelete(true)}
                  disabled={isBulkActionRunning}
                  className="px-3 py-1.5 rounded-sm border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950 disabled:opacity-50 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} /> Apagar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bets List / Grid */}
      <div className="space-y-3" id="bets-list">
        {filteredBets.map((bet) => {
          const isSettled = bet.status !== "POR_LIQUIDAR";
          return (
            <div
              key={bet.id}
              className={`bg-white dark:bg-zinc-900 rounded-sm border p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors ${
                selectedBetIds.has(bet.id)
                  ? "border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-100 dark:ring-emerald-950"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >

              {isSelecting && (
                <label className="flex items-center self-start md:self-center cursor-pointer" title="Selecionar aposta">
                  <input
                    type="checkbox"
                    checked={selectedBetIds.has(bet.id)}
                    onChange={() => toggleBetSelection(bet.id)}
                    className="h-4 w-4 rounded-sm border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    aria-label={`Selecionar aposta de ${bet.dateTime}`}
                  />
                </label>
              )}

              {/* Left Column: Selections and Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded-sm font-mono">
                    {bet.type}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    {sortButton("Data", "date")}
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{bet.dateTime}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-sm">
                    {bet.bookmaker}
                  </span>
                  {bet.accountId && accountLabelById.get(bet.accountId) && (
                    <span className="text-[9px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-sm uppercase border border-sky-200 dark:border-sky-900">
                      {accountLabelById.get(bet.accountId)}
                    </span>
                  )}
                  {bet.isFreebet && (
                    <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-sm uppercase border border-amber-200 dark:border-amber-900">
                      Freebet
                    </span>
                  )}
                  {bet.isRiskFree && (
                    <span className="text-[9px] font-bold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-sm uppercase border border-cyan-200 dark:border-cyan-900">
                      Sem risco
                    </span>
                  )}
                  {getStatusBadge(bet.status)}
                </div>

                {/* Selections List */}
                <div className="space-y-1.5">
                  {(bet.selections || []).map((sel, sIdx) => (
                    <div key={sel.id || sIdx} className="flex flex-wrap items-center gap-x-2 text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sel.event}</span>
                      <span className="text-zinc-300 dark:text-zinc-600 shrink-0">|</span>
                      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{sel.market}:</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{sel.choice}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold ml-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/50 dark:border-emerald-900 px-1.5 py-0.5 rounded-sm">@{safeNum(sel.odd).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Notes and Audit info */}
                {bet.notes && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-2 rounded-sm italic">
                    {bet.notes}
                  </p>
                )}
              </div>

              {/* Right Column: Financial Figures and Action Buttons */}
              <div className="flex items-center gap-6 self-stretch md:self-auto justify-between border-t border-zinc-100 dark:border-zinc-800 md:border-0 pt-3 md:pt-0 shrink-0">

                {/* Financial Summary */}
                <div className="flex gap-4 text-right pr-2">
                  <div className="flex flex-col">
                    {sortButton("Stake", "stake", "self-end")}
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-mono mt-0.5">
                      {safeNum(bet.stake).toFixed(2)}{currency}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {sortButton("Odd", "odd", "self-end")}
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 px-1.5 py-0.5 rounded-sm self-end mt-0.5">
                      {safeNum(bet.odd).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-[75px]">
                    {sortButton(isSettled ? "Lucro" : "Potencial", "profit", "self-end")}
                    <span className={`text-xs font-bold font-mono mt-0.5 ${
                      !isSettled
                        ? "text-zinc-500 dark:text-zinc-400"
                        : safeNum(bet.netProfit) > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : safeNum(bet.netProfit) < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-zinc-600 dark:text-zinc-300"
                    }`}>
                      {isSettled 
                        ? `${safeNum(bet.netProfit) >= 0 ? "+" : ""}${safeNum(bet.netProfit).toFixed(2)}${currency}` 
                        : `${safeNum(bet.potentialReturn).toFixed(2)}${currency}`}
                    </span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  {deletingId === bet.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-1 rounded-sm animate-pulse">
                      <span className="text-[9px] text-rose-800 dark:text-rose-200 font-bold uppercase tracking-wider mr-1">Apagar?</span>
                      <button
                        onClick={() => {
                          onDeleteBet(bet.id);
                          setDeletingId(null);
                        }}
                        className="p-1 rounded-xs bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                        title="Confirmar Apagar"
                      >
                        <Check size={10} />
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1 rounded-xs bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                        title="Cancelar"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDuplicate(bet)}
                        title="Duplicar Aposta"
                        className="p-1.5 rounded-sm text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => openEditModal(bet)}
                        title="Editar Aposta"
                        className="p-1.5 rounded-sm text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingId(bet.id)}
                        title="Apagar Aposta"
                        className="p-1.5 rounded-sm text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>

              </div>

            </div>
          );
        })}

        {filteredBets.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-sm border border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500">
            <HelpCircle className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2 stroke-1" size={32} />
            <p className="text-xs">Nenhuma aposta encontrada com os filtros selecionados.</p>
            <button
              onClick={openAddModal}
              className="mt-3 px-3.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-sm transition-colors font-semibold"
            >
              Adicionar Nova Aposta
            </button>
          </div>
        )}
      </div>

      {/* Registar/Editar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="bet-form-modal">
          <div className="bg-white dark:bg-zinc-900 rounded-md w-full max-w-xl shadow-2xl border border-zinc-100 dark:border-zinc-800 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-50 dark:border-zinc-800 shrink-0">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 font-display">
                {editingBet ? "Editar Registo de Aposta" : "Registar Nova Aposta"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-100 dark:border-rose-900 flex items-center gap-2 font-medium">
                  <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Tipo de Aposta</label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as BetType;
                      setFormType(newType);
                      // Adjust selection counts
                      if (newType === "SIMPLES" && formSelections.length > 1) {
                        setFormSelections([formSelections[0]]);
                      }
                    }}
                  >
                    <option value="SIMPLES">Simples</option>
                    <option value="MULTIPLA">Múltipla</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Estado de Liquidação</label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                    value={formStatus}
                    onChange={(e) => {
                      const nextStatus = e.target.value as BetStatus;
                      setFormStatus(nextStatus);
                      setFormSettledReturn("");
                    }}
                  >
                    <option value="POR_LIQUIDAR">Por Liquidar (Pendente)</option>
                    <option value="GANHA">Ganha</option>
                    <option value="PERDIDA">Perdida</option>
                    <option value="ANULADA">Anulada</option>
                    <option value="MEIO_GANHA">Meio Ganha</option>
                    <option value="MEIO_PERDIDA">Meio Perdida</option>
                    <option value="CASHOUT">Cashout</option>
                  </select>
                </div>
              </div>

              {/* Cashout: valor recebido ao encerrar antecipadamente (editável) */}
              {formStatus === "CASHOUT" && (
                <div className="p-4 bg-violet-50/60 dark:bg-violet-950/30 rounded-sm border border-violet-100 dark:border-violet-900">
                  <label className="block text-violet-900 dark:text-violet-200 font-semibold mb-1">
                    Valor do Cashout ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-sm border border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-800 focus:outline-none focus:border-violet-500 text-zinc-700 dark:text-zinc-200 font-mono font-bold"
                    placeholder="0.00"
                    value={formCashoutReturn}
                    onChange={(e) => setFormCashoutReturn(e.target.value)}
                  />
                  <p className="text-[11px] text-violet-700/70 dark:text-violet-300/70 mt-1">
                    Montante efetivamente recebido ao fazer cashout (independente do resultado).
                  </p>
                </div>
              )}

              {/* Bookmaker Choice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Casa de Apostas</label>
                  <select
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                    value={formBookmaker}
                    onChange={(e) => {
                      const bk = e.target.value;
                      setFormBookmaker(bk);
                      // Ajusta o tipo de freebet ao default da casa escolhida.
                      setFormFreebetType(defaultFreebetTypeFor(bk));
                    }}
                  >
                    {AVAILABLE_BOOKMAKERS.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                    <option value="Outra">Outra (Escrever...)</option>
                  </select>
                </div>
                {(() => {
                  const selectedBookmaker = formBookmaker === "Outra" ? formCustomBookmaker.trim() : formBookmaker;
                  const bookieAccounts = accounts.filter(a => a.bookmaker === selectedBookmaker);
                  if (bookieAccounts.length === 0) return null;
                  return (
                    <div>
                      <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Conta</label>
                      <select
                        className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                        value={bookieAccounts.some(a => a.id === formAccountId) ? formAccountId : ""}
                        onChange={(e) => setFormAccountId(e.target.value)}
                      >
                        <option value="">Sem conta</option>
                        {bookieAccounts.map(account => (
                          <option key={account.id} value={account.id}>{account.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
                {formBookmaker === "Outra" && (
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Qual?</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                      placeholder="Ex: Betfair, Betclic.fr"
                      value={formCustomBookmaker}
                      onChange={(e) => setFormCustomBookmaker(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Data / Hora</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200 font-mono"
                    placeholder="YYYY-MM-DD HH:mm"
                    value={formDateTime}
                    onChange={(e) => setFormDateTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Tipo de aposta: Normal / Freebet / Sem risco */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-sm border border-emerald-100/50 dark:border-emerald-900 space-y-3">
                <label className="block font-semibold text-emerald-900 dark:text-emerald-200">
                  Tipo de aposta
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "NORMAL", label: "Normal", hint: "Stake real" },
                    { key: "FREEBET", label: "Freebet", hint: "Aposta grátis" },
                    { key: "RISK_FREE", label: "Sem risco", hint: "Stake real, derrota devolvida" },
                  ] as const).map((mode) => {
                    const active =
                      (mode.key === "NORMAL" && !formIsFreebet && !formIsRiskFree) ||
                      (mode.key === "FREEBET" && formIsFreebet) ||
                      (mode.key === "RISK_FREE" && formIsRiskFree);
                    return (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => {
                          // Modos mutuamente exclusivos.
                          setFormIsFreebet(mode.key === "FREEBET");
                          setFormIsRiskFree(mode.key === "RISK_FREE");
                        }}
                        className={`px-3 py-2 rounded-sm border text-xs font-semibold transition-colors text-center ${
                          active
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white dark:bg-zinc-800 border-emerald-200 dark:border-emerald-800 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400"
                        }`}
                      >
                        <span className="block">{mode.label}</span>
                        <span className={`block text-[9px] font-normal mt-0.5 ${active ? "text-emerald-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                          {mode.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {formIsFreebet && (
                  <div>
                    <label className="block text-emerald-900/80 dark:text-emerald-200/80 font-semibold mb-1">
                      Tipo de Freebet
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-sm border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                      value={formFreebetType}
                      onChange={(e) => setFormFreebetType(e.target.value as FreebetType)}
                    >
                      <option value="SNR">Stake não devolvida — SNR (ganho = (odd−1)×stake)</option>
                      <option value="SR">Stake devolvida — SR (ganho = odd×stake)</option>
                    </select>
                    <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70 mt-1">
                      Predefinido pela casa ({formBookmaker}). SNR é o padrão; o Betclic usa SR.
                    </p>
                  </div>
                )}

                {formIsRiskFree && (
                  <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
                    Aposta sem risco: a stake é dinheiro real. Se <strong>ganhar</strong>, o lucro é
                    normal; se <strong>perder</strong>, a stake é devolvida (resultado neutro).
                    Regista a freebet devolvida como uma aposta à parte quando a usares.
                  </p>
                )}
              </div>

              {/* Stake & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Valor da Aposta (Stake)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200 font-mono font-bold"
                    placeholder="10.00"
                    value={formStake}
                    onChange={(e) => setFormStake(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 font-semibold mb-1">Notas adicionais (opcional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-200"
                    placeholder="Ex: Segui tipster X, jogo crucial"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Selections Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-[10px]">
                    Seleções do Bilhete ({formSelections.length})
                  </h4>
                  {formType === "MULTIPLA" && (
                    <button
                      type="button"
                      onClick={addSelection}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <PlusCircle size={14} /> Adicionar Seleção
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {formSelections.map((sel, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-sm border border-zinc-100 dark:border-zinc-700 space-y-2.5 relative"
                    >
                      {formSelections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSelection(idx)}
                          className="absolute right-3 top-3 text-zinc-400 hover:text-rose-500"
                        >
                          <MinusCircle size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold mb-0.5">Evento / Jogo</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px]"
                            placeholder="Ex: Benfica vs Porto"
                            value={sel.event}
                            onChange={(e) => handleSelectionChange(idx, "event", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold mb-0.5">Mercado</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px]"
                            placeholder="Ex: Resultado Final, Total de Golos"
                            value={sel.market}
                            onChange={(e) => handleSelectionChange(idx, "market", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold mb-0.5">Escolha / Prognóstico</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-[11px]"
                            placeholder="Ex: Benfica, Mais de 2.5"
                            value={sel.choice}
                            onChange={(e) => handleSelectionChange(idx, "choice", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold mb-0.5">Odd Individual</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1.01"
                            required
                            className="w-full px-2.5 py-1.5 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 font-mono text-[11px]"
                            placeholder="1.80"
                            value={sel.odd}
                            onChange={(e) => handleSelectionChange(idx, "odd", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-zinc-900 dark:bg-zinc-950 dark:border dark:border-zinc-800 text-zinc-100 rounded-sm flex justify-between items-center font-display shadow-inner">
                <div>
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Simulação do Boletim</p>
                  <p className="text-sm font-bold mt-0.5">
                    Odd Total: <span className="font-mono text-emerald-300">@{calculatedOdd.toFixed(2)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
                    {formStatus === "POR_LIQUIDAR" ? "Retorno Potencial" : "Retorno Liquidado"}
                  </p>
                  {formStatus === "MEIO_GANHA" || formStatus === "MEIO_PERDIDA" ? (
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formSettledReturn !== "" ? formSettledReturn : potentialWinningsInfo.finalReturn.toFixed(2)}
                        onChange={(e) => setFormSettledReturn(e.target.value)}
                        className="w-24 rounded-sm border border-zinc-700 bg-zinc-800 px-2 py-1 text-right font-mono text-base font-black text-emerald-400 focus:border-emerald-400 focus:outline-none"
                        aria-label="Retorno liquidado"
                      />
                      <span className="text-lg font-black text-emerald-400">{currency}</span>
                    </div>
                  ) : (
                    <p className="text-lg font-black text-emerald-400">
                      {formStatus === "POR_LIQUIDAR"
                        ? `${potentialWinningsInfo.potentialReturn.toFixed(2)}${currency}`
                        : `${potentialWinningsInfo.finalReturn.toFixed(2)}${currency}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-sm border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                >
                  {editingBet ? "Guardar Alterações" : "Registar Aposta"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

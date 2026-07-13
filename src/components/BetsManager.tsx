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
  CheckSquare
} from "lucide-react";
import { Bet, Selection, BetStatus, BetType } from "../types";
import { calculateBetReturnAndProfit, AVAILABLE_BOOKMAKERS, safeNum } from "../utils";

interface BetsManagerProps {
  bets: Bet[];
  currency: string;
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
  onDeleteBet
}: BetsManagerProps) {
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [freebetFilter, setFreebetFilter] = useState<string>("ALL");
  const [bookmakerFilter, setBookmakerFilter] = useState<string>("ALL");
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
  const [formStake, setFormStake] = useState<string>("10.00");
  const [formIsFreebet, setFormIsFreebet] = useState(false);
  const [formDateTime, setFormDateTime] = useState("");
  const [formNotes, setFormNotes] = useState("");
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
    const calcs = calculateBetReturnAndProfit(stakeNum, calculatedOdd, formStatus, formIsFreebet);
    return calcs;
  }, [formStake, calculatedOdd, formStatus, formIsFreebet]);

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
      if (freebetFilter === "NORMAL") matchesFreebet = !bet.isFreebet;

      const matchesBookmaker = bookmakerFilter === "ALL" || bet.bookmaker === bookmakerFilter;

      return matchesSearch && matchesStatus && matchesType && matchesFreebet && matchesBookmaker;
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
  }, [bets, search, statusFilter, typeFilter, freebetFilter, bookmakerFilter, sortField, sortDirection]);

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
        origin: "MANUAL"
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
            ? "text-indigo-600 dark:text-indigo-300"
            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
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
    setFormStake("10.00");
    setFormIsFreebet(false);
    setFormDateTime(new Date().toISOString().replace("T", " ").slice(0, 16));
    setFormNotes("");
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
    
    setFormStake(bet.stake.toString());
    setFormIsFreebet(bet.isFreebet);
    setFormDateTime(bet.dateTime);
    setFormNotes(bet.notes || "");
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
      origin: "MANUAL"
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

    const { potentialReturn, finalReturn, netProfit } = calculateBetReturnAndProfit(
      stakeNum,
      calculatedOdd,
      formStatus,
      formIsFreebet
    );

    const betData: Bet = {
      id: editingBet ? editingBet.id : "bet-" + Date.now(),
      type: formType,
      status: formStatus,
      selections: selections,
      stake: stakeNum,
      odd: calculatedOdd,
      isFreebet: formIsFreebet,
      potentialReturn,
      finalReturn,
      netProfit,
      bookmaker: finalBookmaker,
      dateTime: formDateTime || new Date().toISOString().replace("T", " ").slice(0, 16),
      notes: formNotes.trim() || undefined,
      origin: editingBet ? editingBet.origin : "MANUAL"
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
        return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700`}><MinusCircle size={10} /> Anulada</span>;
      case "MEIO_GANHA":
        return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900`}><Check size={10} /> Meio Ganha</span>;
      case "MEIO_PERDIDA":
        return <span className={`${base} bg-rose-50/50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900`}><X size={10} /> Meio Perdida</span>;
    }
  };

  return (
    <div className="space-y-4" id="bets-tab">
      
      {/* Search and Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-sm p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between" id="bets-toolbar">

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar equipa, mercado, notas..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          
          {/* Status Filter */}
          <select
            className="px-3 py-2 text-xs rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os Estados</option>
            <option value="POR_LIQUIDAR">Por Liquidar</option>
            <option value="GANHA">Ganha</option>
            <option value="PERDIDA">Perdida</option>
            <option value="ANULADA">Anulada</option>
            <option value="MEIO_GANHA">Meio Ganha</option>
            <option value="MEIO_PERDIDA">Meio Perdida</option>
          </select>

          {/* Type Filter */}
          <select
            className="px-3 py-2 text-xs rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none transition-colors"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Qualquer Tipo</option>
            <option value="SIMPLES">Simples</option>
            <option value="MULTIPLA">Múltipla</option>
          </select>

          {/* Freebet Filter */}
          <select
            className="px-3 py-2 text-xs rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none transition-colors"
            value={freebetFilter}
            onChange={(e) => setFreebetFilter(e.target.value)}
          >
            <option value="ALL">Tipo de Dinheiro</option>
            <option value="NORMAL">Dinheiro Real</option>
            <option value="FREEBET">Freebet</option>
          </select>

          {/* Bookmaker Filter */}
          <select
            className="px-3 py-2 text-xs rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-600 focus:outline-none transition-colors"
            value={bookmakerFilter}
            onChange={(e) => setBookmakerFilter(e.target.value)}
          >
            <option value="ALL">Todas as Casas</option>
            {AVAILABLE_BOOKMAKERS.map((b, idx) => (
              <option key={idx} value={b}>{b}</option>
            ))}
          </select>

          {/* Multiple selection */}
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`px-3 py-2 rounded-sm border font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSelecting
                ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
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
              className="px-3 py-2 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-colors cursor-pointer"
            >
              {allFilteredBetsSelected ? "Desmarcar filtradas" : `Selecionar filtradas (${filteredBets.length})`}
            </button>
          )}

          {/* New Bet Button */}
          <button
            onClick={openAddModal}
            className="ml-auto md:ml-0 px-4 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            id="btn-new-bet"
          >
            <Plus size={14} /> Registar Aposta
          </button>
        </div>

      </div>

      {isSelecting && selectedBetIds.size > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            <strong className="text-indigo-600 dark:text-indigo-300">{selectedBetIds.size}</strong>{" "}
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
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                  className="px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-50 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
              className={`bg-white dark:bg-slate-900 rounded-sm border p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                selectedBetIds.has(bet.id)
                  ? "border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-100 dark:ring-indigo-950"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >

              {isSelecting && (
                <label className="flex items-center self-start md:self-center cursor-pointer" title="Selecionar aposta">
                  <input
                    type="checkbox"
                    checked={selectedBetIds.has(bet.id)}
                    onChange={() => toggleBetSelection(bet.id)}
                    className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    aria-label={`Selecionar aposta de ${bet.dateTime}`}
                  />
                </label>
              )}

              {/* Left Column: Selections and Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 px-2 py-0.5 rounded-sm font-mono">
                    {bet.type}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    {sortButton("Data", "date")}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{bet.dateTime}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-sm">
                    {bet.bookmaker}
                  </span>
                  {bet.isFreebet && (
                    <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-sm uppercase border border-amber-200 dark:border-amber-900">
                      Freebet
                    </span>
                  )}
                  {getStatusBadge(bet.status)}
                </div>

                {/* Selections List */}
                <div className="space-y-1.5">
                  {(bet.selections || []).map((sel, sIdx) => (
                    <div key={sel.id || sIdx} className="flex flex-wrap items-center gap-x-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{sel.event}</span>
                      <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{sel.market}:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{sel.choice}</span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold ml-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/50 dark:border-indigo-900 px-1.5 py-0.5 rounded-sm">@{safeNum(sel.odd).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Notes and Audit info */}
                {bet.notes && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-2 rounded-sm italic">
                    {bet.notes}
                  </p>
                )}
              </div>

              {/* Right Column: Financial Figures and Action Buttons */}
              <div className="flex items-center gap-6 self-stretch md:self-auto justify-between border-t border-slate-100 dark:border-slate-800 md:border-0 pt-3 md:pt-0 shrink-0">

                {/* Financial Summary */}
                <div className="flex gap-4 text-right pr-2">
                  <div className="flex flex-col">
                    {sortButton("Stake", "stake", "self-end")}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                      {safeNum(bet.stake).toFixed(2)}{currency}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {sortButton("Odd", "odd", "self-end")}
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 px-1.5 py-0.5 rounded-sm self-end mt-0.5">
                      {safeNum(bet.odd).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-[75px]">
                    {sortButton(isSettled ? "Lucro" : "Potencial", "profit", "self-end")}
                    <span className={`text-xs font-bold font-mono mt-0.5 ${
                      !isSettled
                        ? "text-slate-500 dark:text-slate-400"
                        : safeNum(bet.netProfit) > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : safeNum(bet.netProfit) < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-600 dark:text-slate-300"
                    }`}>
                      {isSettled 
                        ? `${safeNum(bet.netProfit) >= 0 ? "+" : ""}${safeNum(bet.netProfit).toFixed(2)}${currency}` 
                        : `${safeNum(bet.potentialReturn).toFixed(2)}${currency}`}
                    </span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-4">
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
                        className="p-1 rounded-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
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
                        className="p-1.5 rounded-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => openEditModal(bet)}
                        title="Editar Aposta"
                        className="p-1.5 rounded-sm text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingId(bet.id)}
                        title="Apagar Aposta"
                        className="p-1.5 rounded-sm text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <HelpCircle className="mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" size={32} />
            <p className="text-xs">Nenhuma aposta encontrada com os filtros selecionados.</p>
            <button
              onClick={openAddModal}
              className="mt-3 px-3.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors font-semibold"
            >
              Adicionar Nova Aposta
            </button>
          </div>
        )}
      </div>

      {/* Registar/Editar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="bet-form-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-50 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">
                {editingBet ? "Editar Registo de Aposta" : "Registar Nova Aposta"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-xl border border-rose-100 dark:border-rose-900 flex items-center gap-2 font-medium">
                  <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Tipo de Aposta</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
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
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Estado de Liquidação</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as BetStatus)}
                  >
                    <option value="POR_LIQUIDAR">Por Liquidar (Pendente)</option>
                    <option value="GANHA">Ganha</option>
                    <option value="PERDIDA">Perdida</option>
                    <option value="ANULADA">Anulada</option>
                    <option value="MEIO_GANHA">Meio Ganha</option>
                    <option value="MEIO_PERDIDA">Meio Perdida</option>
                  </select>
                </div>
              </div>

              {/* Bookmaker Choice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Casa de Apostas</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                    value={formBookmaker}
                    onChange={(e) => setFormBookmaker(e.target.value)}
                  >
                    {AVAILABLE_BOOKMAKERS.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                    <option value="Outra">Outra (Escrever...)</option>
                  </select>
                </div>
                {formBookmaker === "Outra" && (
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Qual?</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                      placeholder="Ex: Betfair, Betclic.fr"
                      value={formCustomBookmaker}
                      onChange={(e) => setFormCustomBookmaker(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Data / Hora</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-mono"
                    placeholder="YYYY-MM-DD HH:mm"
                    value={formDateTime}
                    onChange={(e) => setFormDateTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Freebet Checkbox */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100/50 dark:border-indigo-900">
                <label className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    checked={formIsFreebet}
                    onChange={(e) => setFormIsFreebet(e.target.checked)}
                  />
                  <span>Esta aposta foi colocada com uma Freebet (Aposta Grátis)?</span>
                </label>
              </div>

              {/* Stake & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Valor da Aposta (Stake)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-mono font-bold"
                    placeholder="10.00"
                    value={formStake}
                    onChange={(e) => setFormStake(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Notas adicionais (opcional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                    placeholder="Ex: Segui tipster X, jogo crucial"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Selections Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[10px]">
                    Seleções do Bilhete ({formSelections.length})
                  </h4>
                  {formType === "MULTIPLA" && (
                    <button
                      type="button"
                      onClick={addSelection}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <PlusCircle size={14} /> Adicionar Seleção
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {formSelections.map((sel, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2.5 relative"
                    >
                      {formSelections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSelection(idx)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-rose-500"
                        >
                          <MinusCircle size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold mb-0.5">Evento / Jogo</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[11px]"
                            placeholder="Ex: Benfica vs Porto"
                            value={sel.event}
                            onChange={(e) => handleSelectionChange(idx, "event", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold mb-0.5">Mercado</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[11px]"
                            placeholder="Ex: Resultado Final, Total de Golos"
                            value={sel.market}
                            onChange={(e) => handleSelectionChange(idx, "market", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold mb-0.5">Escolha / Prognóstico</label>
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[11px]"
                            placeholder="Ex: Benfica, Mais de 2.5"
                            value={sel.choice}
                            onChange={(e) => handleSelectionChange(idx, "choice", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold mb-0.5">Odd Individual</label>
                          <input
                            type="number"
                            step="0.01"
                            min="1.01"
                            required
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-[11px]"
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
              <div className="p-4 bg-slate-900 dark:bg-slate-950 dark:border dark:border-slate-800 text-slate-100 rounded-2xl flex justify-between items-center font-display shadow-inner">
                <div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Simulação do Boletim</p>
                  <p className="text-sm font-bold mt-0.5">
                    Odd Total: <span className="font-mono text-indigo-300">@{calculatedOdd.toFixed(2)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                    {formStatus === "POR_LIQUIDAR" ? "Retorno Potencial" : "Retorno Liquidado"}
                  </p>
                  <p className="text-lg font-black text-emerald-400">
                    {formStatus === "POR_LIQUIDAR" 
                      ? `${potentialWinningsInfo.potentialReturn.toFixed(2)}${currency}`
                      : `${potentialWinningsInfo.finalReturn.toFixed(2)}${currency}`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
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

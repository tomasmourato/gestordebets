// src/mobile/screens/MobileBets.tsx
// Gestão de apostas mobile touch-first: pesquisa + sheet de filtros (mesma
// semântica do BetsManager desktop, incluindo drill-down por URL), lista de
// cards agrupada por dia com swipe para editar/apagar, sheet de detalhe,
// modo de seleção com ações em massa (editar campos comuns, ignorar/repor,
// duplicar, apagar) e formulário em página-folha (FAB) suportado pelo hook
// partilhado useBetForm.

import { useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  Copy,
  Check,
  X,
  Clock,
  MinusCircle,
  CheckSquare,
  PlusCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Bet, BookieAccount, BetStatus } from "../../types";
import { AVAILABLE_BOOKMAKERS, safeNum, calculateBetReturnAndProfit } from "../../utils";
import { useBetForm } from "../../hooks/useBetForm";
import {
  BottomSheet,
  SheetPage,
  FAB,
  ListGroup,
  ListItem,
  MobileCard,
  SectionHeader,
  SwipeableRow,
  Pressable,
  ChipGroup,
  SegmentedControl,
  useToast,
} from "../ui";

interface MobileBetsProps {
  bets: Bet[];
  currency: string;
  accounts?: BookieAccount[];
  onAddBet: (bet: Bet) => void | Promise<void>;
  onAddBets: (bets: Bet[]) => void | Promise<void>;
  onUpdateBet: (bet: Bet) => void | Promise<void>;
  /** Ignorar exclui a aposta das estatísticas; repor traz-la de volta. */
  onIgnoreBet: (id: string, ignored: boolean, comment?: string | null) => void | Promise<void>;
  onDeleteBet: (id: string) => void | Promise<void>;
}

type SortField = "date" | "stake" | "odd" | "profit";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "POR_LIQUIDAR", label: "Por liquidar" },
  { value: "GANHA", label: "Ganha" },
  { value: "PERDIDA", label: "Perdida" },
  { value: "MEIO_GANHA", label: "Meio ganha" },
  { value: "MEIO_PERDIDA", label: "Meio perdida" },
  { value: "CASHOUT", label: "Cashout" },
  { value: "ANULADA", label: "Anulada" },
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "Qualquer tipo" },
  { value: "SIMPLES", label: "Simples" },
  { value: "MULTIPLA", label: "Múltipla" },
];

const MONEY_OPTIONS = [
  { value: "ALL", label: "Tudo" },
  { value: "NORMAL", label: "Dinheiro real" },
  { value: "FREEBET", label: "Freebet" },
  { value: "RISK_FREE", label: "Sem risco" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "date", label: "Data" },
  { value: "stake", label: "Stake" },
  { value: "odd", label: "Odd" },
  { value: "profit", label: "Lucro" },
];

// Edição em massa: só se aplicam os campos que o utilizador altera. "Manter"
// (KEEP) deixa cada aposta como está. Ficam DE FORA os campos únicos por
// aposta — montante, odd e seleções — como pedido.
const KEEP = "__KEEP__";
const NO_ACCOUNT = "__NONE__";

// Estados aplicáveis em massa. CASHOUT fica de fora: exige um valor recebido
// próprio de cada aposta, que não faz sentido definir em bloco.
const BULK_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: KEEP, label: "Manter" },
  { value: "POR_LIQUIDAR", label: "Por liquidar" },
  { value: "GANHA", label: "Ganha" },
  { value: "PERDIDA", label: "Perdida" },
  { value: "MEIO_GANHA", label: "Meio ganha" },
  { value: "MEIO_PERDIDA", label: "Meio perdida" },
  { value: "ANULADA", label: "Anulada" },
];

const BULK_MONEY_OPTIONS: { value: string; label: string }[] = [
  { value: KEEP, label: "Manter" },
  { value: "NORMAL", label: "Dinheiro real" },
  { value: "FREEBET", label: "Freebet" },
  { value: "RISK_FREE", label: "Sem risco" },
];

// Estilo dos badges de estado (espelha getStatusBadge do desktop).
const STATUS_META: Record<BetStatus, { label: string; classes: string; icon: typeof Check }> = {
  POR_LIQUIDAR: { label: "Por liquidar", icon: Clock, classes: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900" },
  GANHA: { label: "Ganha", icon: Check, classes: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" },
  PERDIDA: { label: "Perdida", icon: X, classes: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900" },
  ANULADA: { label: "Anulada", icon: MinusCircle, classes: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" },
  MEIO_GANHA: { label: "Meio ganha", icon: Check, classes: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" },
  MEIO_PERDIDA: { label: "Meio perdida", icon: X, classes: "bg-rose-50/50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900" },
  CASHOUT: { label: "Cashout", icon: MinusCircle, classes: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-900" },
};

function StatusBadge({ status }: { status: BetStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 w-max border ${meta.classes}`}>
      <Icon size={10} /> {meta.label}
    </span>
  );
}

const formatDay = (day: string) => {
  if (!day) return "Sem data";
  const today = new Date();
  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (day === toKey(today)) return "Hoje";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (day === toKey(yesterday)) return "Ontem";
  return day.split("-").reverse().join("/");
};

export default function MobileBets({
  bets,
  currency,
  accounts = [],
  onAddBet,
  onAddBets,
  onUpdateBet,
  onIgnoreBet,
  onDeleteBet,
}: MobileBetsProps) {
  const toast = useToast();

  // Drill-down por URL (vindo do dashboard), como no desktop.
  const initialFilters = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialFilter = (name: string) => initialFilters.get(name) || "ALL";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => initialFilter("status"));
  const [typeFilter, setTypeFilter] = useState(() => initialFilter("type"));
  const [moneyFilter, setMoneyFilter] = useState(() => initialFilter("money"));
  const [bookmakerFilter, setBookmakerFilter] = useState(() => initialFilter("bookmaker"));
  const [accountFilter, setAccountFilter] = useState(() => initialFilter("account"));
  const [sportFilter, setSportFilter] = useState(() => initialFilter("sport"));
  const [dateFrom, setDateFrom] = useState(() => initialFilters.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(() => initialFilters.get("dateTo") || "");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailBet, setDetailBet] = useState<Bet | null>(null);
  // Ignorar abre uma sheet própria para o comentário opcional (o desktop
  // pré-preenche com o comentário atual da aposta); repor é imediato.
  const [ignoringBet, setIgnoringBet] = useState<Bet | null>(null);
  const [ignoreComment, setIgnoreComment] = useState("");
  const [deletingBet, setDeletingBet] = useState<Bet | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Modo de seleção (ações em massa).
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);

  // Editar em massa (só campos comuns) e ignorar/repor em massa.
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [beStatus, setBeStatus] = useState(KEEP);
  const [beSport, setBeSport] = useState("");
  const [beBookmaker, setBeBookmaker] = useState(KEEP);
  const [beAccount, setBeAccount] = useState(KEEP);
  const [beMoney, setBeMoney] = useState(KEEP);
  const [beNote, setBeNote] = useState("");
  const [bulkIgnoreOpen, setBulkIgnoreOpen] = useState(false);
  const [bulkIgnoreComment, setBulkIgnoreComment] = useState("");

  const form = useBetForm(accounts);

  const sportOptions = useMemo(
    () =>
      Array.from(
        new Set(
          bets.flatMap((bet) => bet.selections.map((s) => s.sport?.trim()).filter((s): s is string => Boolean(s))),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt")),
    [bets],
  );
  const bookmakerOptions = useMemo(
    () =>
      Array.from(new Set([...AVAILABLE_BOOKMAKERS, ...bets.map((b) => b.bookmaker).filter(Boolean)])).sort((a, b) =>
        a.localeCompare(b, "pt"),
      ),
    [bets],
  );
  const accountLabelById = useMemo(() => new Map(accounts.map((a) => [a.id, a.label])), [accounts]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Filtragem + ordenação — mesma semântica do desktop.
  const filteredBets = useMemo(() => {
    const q = search.toLowerCase();
    const visible = bets.filter((bet) => {
      const matchesSearch =
        search === "" ||
        bet.selections.some(
          (s) =>
            s.event.toLowerCase().includes(q) || s.market.toLowerCase().includes(q) || s.choice.toLowerCase().includes(q),
        ) ||
        bet.bookmaker.toLowerCase().includes(q) ||
        (bet.notes && bet.notes.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || bet.status === statusFilter;
      const matchesType = typeFilter === "ALL" || bet.type === typeFilter;

      let matchesMoney = true;
      if (moneyFilter === "FREEBET") matchesMoney = bet.isFreebet;
      if (moneyFilter === "RISK_FREE") matchesMoney = !!bet.isRiskFree;
      if (moneyFilter === "NORMAL") matchesMoney = !bet.isFreebet && !bet.isRiskFree;

      const matchesBookmaker = bookmakerFilter === "ALL" || bet.bookmaker === bookmakerFilter;
      const matchesAccount =
        accountFilter === "ALL" || (accountFilter === "NONE" ? !bet.accountId : bet.accountId === accountFilter);
      const matchesSport = sportFilter === "ALL" || bet.selections.some((s) => s.sport?.trim() === sportFilter);
      const day = bet.dateTime?.slice(0, 10) || "";
      const matchesFrom = !dateFrom || Boolean(day && day >= dateFrom);
      const matchesTo = !dateTo || Boolean(day && day <= dateTo);

      return (
        matchesSearch && matchesStatus && matchesType && matchesMoney && matchesBookmaker && matchesAccount && matchesSport && matchesFrom && matchesTo
      );
    });

    return visible.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "stake": cmp = safeNum(a.stake) - safeNum(b.stake); break;
        case "odd": cmp = safeNum(a.odd) - safeNum(b.odd); break;
        case "profit": cmp = safeNum(a.netProfit) - safeNum(b.netProfit); break;
        default:
          cmp = new Date(a.dateTime.replace(" ", "T")).getTime() - new Date(b.dateTime.replace(" ", "T")).getTime();
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [bets, search, statusFilter, typeFilter, moneyFilter, bookmakerFilter, accountFilter, sportFilter, dateFrom, dateTo, sortField, sortAsc]);

  // Agrupar por dia (apenas quando ordenado por data; senão lista corrida).
  const groups = useMemo(() => {
    if (sortField !== "date") return [{ day: "", bets: filteredBets }];
    const map = new Map<string, Bet[]>();
    filteredBets.forEach((bet) => {
      const day = bet.dateTime?.slice(0, 10) || "";
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(bet);
    });
    return Array.from(map.entries()).map(([day, list]) => ({ day, bets: list }));
  }, [filteredBets, sortField]);

  const activeFilterCount =
    [statusFilter, typeFilter, moneyFilter, bookmakerFilter, accountFilter, sportFilter].filter((v) => v !== "ALL").length +
    (dateFrom || dateTo ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setMoneyFilter("ALL");
    setBookmakerFilter("ALL");
    setAccountFilter("ALL");
    setSportFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const money = (n: number) =>
    `${safeNum(n).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency}`;
  const signed = (n: number) => `${n >= 0 ? "+" : ""}${money(n)}`;

  // ------------------------------------------------------------- ações

  const openAdd = () => {
    form.startAdd();
    setFormOpen(true);
  };

  const openEdit = (bet: Bet) => {
    setDetailBet(null);
    form.startEdit(bet);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const bet = form.buildBet();
    if (!bet) return;
    if (form.editingBet) {
      await onUpdateBet(bet);
      toast.show("Aposta atualizada", "success");
    } else {
      await onAddBet(bet);
      toast.show("Aposta registada", "success");
    }
    setFormOpen(false);
    form.reset();
  };

  const handleDuplicate = (bet: Bet) => {
    setDetailBet(null);
    const duplicated: Bet = {
      ...bet,
      id: "bet-" + Date.now(),
      dateTime: new Date().toISOString().replace("T", " ").slice(0, 16),
      notes: bet.notes ? `[Duplicado] ${bet.notes}` : "Aposta duplicada.",
      origin: "MANUAL",
      metadata: undefined,
    };
    void onAddBet(duplicated);
    toast.show("Aposta duplicada", "success");
  };

  const startIgnore = (bet: Bet) => {
    setDetailBet(null);
    setIgnoreComment(bet.comment ?? "");
    setIgnoringBet(bet);
  };

  const confirmIgnore = async () => {
    if (!ignoringBet) return;
    await onIgnoreBet(ignoringBet.id, true, ignoreComment.trim() || null);
    setIgnoringBet(null);
    setIgnoreComment("");
    toast.show("Aposta ignorada — fora das estatísticas", "success");
  };

  const handleUnignore = async (bet: Bet) => {
    setDetailBet(null);
    await onIgnoreBet(bet.id, false);
    toast.show("Aposta reposta nas estatísticas", "success");
  };

  const confirmDelete = async () => {
    if (!deletingBet) return;
    await onDeleteBet(deletingBet.id);
    setDeletingBet(null);
    setDetailBet(null);
    toast.show("Aposta apagada", "success");
  };

  // Seleção em massa.
  const resetBulkEdit = () => {
    setBeStatus(KEEP);
    setBeSport("");
    setBeBookmaker(KEEP);
    setBeAccount(KEEP);
    setBeMoney(KEEP);
    setBeNote("");
  };

  const toggleSelecting = () => {
    setIsSelecting((current) => {
      if (current) {
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
        resetBulkEdit();
      }
      return !current;
    });
  };

  const toggleSelected = (id: string) => {
    setConfirmBulkDelete(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finishBulk = () => {
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    setIsSelecting(false);
    setBulkRunning(false);
    resetBulkEdit();
  };

  // Apostas atualmente selecionadas (ordem da lista visível é irrelevante aqui).
  const selectedBets = () => bets.filter((b) => selectedIds.has(b.id));

  // Editar em massa: aplica só os campos alterados; os únicos por aposta
  // (montante, odd, seleções) ficam intactos. Recalcula retorno/lucro apenas
  // quando o estado ou o tipo de dinheiro muda — os cálculos dependem deles.
  const applyBulkEdit = async () => {
    const selected = selectedBets();
    if (selected.length === 0) return;

    const changesStatus = beStatus !== KEEP;
    const changesBookmaker = beBookmaker !== KEEP;
    const changesAccount = beAccount !== KEEP;
    const changesSport = beSport.trim() !== "";
    const changesMoney = beMoney !== KEEP;
    const noteToAppend = beNote.trim();
    const changesNote = noteToAppend !== "";

    if (!changesStatus && !changesBookmaker && !changesAccount && !changesSport && !changesMoney && !changesNote) {
      toast.show("Escolhe pelo menos um campo para alterar", "info");
      return;
    }

    setBulkRunning(true);
    let count = 0;
    for (const bet of selected) {
      const next: Bet = { ...bet, selections: bet.selections.map((s) => ({ ...s })) };

      if (changesBookmaker) {
        next.bookmaker = beBookmaker;
        // Se a conta atual pertence a outra casa, deixa de fazer sentido.
        if (next.accountId && accountById.get(next.accountId)?.bookmaker !== beBookmaker) {
          next.accountId = undefined;
        }
      }
      if (changesAccount) {
        if (beAccount === NO_ACCOUNT) {
          next.accountId = undefined;
        } else {
          const acc = accountById.get(beAccount);
          if (acc) {
            next.accountId = acc.id;
            next.bookmaker = acc.bookmaker; // conta implica a sua casa
          }
        }
      }
      if (changesSport) {
        next.selections = next.selections.map((s) => ({ ...s, sport: beSport.trim() }));
      }
      if (changesMoney) {
        next.isFreebet = beMoney === "FREEBET";
        next.isRiskFree = beMoney === "RISK_FREE";
        if (!next.isFreebet) next.freebetType = undefined;
      }
      if (changesStatus) {
        next.status = beStatus as BetStatus;
      }
      if (changesNote) {
        next.notes = next.notes ? `${next.notes}\n${noteToAppend}` : noteToAppend;
      }

      if (changesStatus || changesMoney) {
        const calc = calculateBetReturnAndProfit(
          safeNum(next.stake),
          safeNum(next.odd),
          next.status,
          !!next.isFreebet,
          safeNum(next.finalReturn), // só usado se CASHOUT — mantém consistência
          next.freebetType,
          next.isRiskFree,
        );
        next.potentialReturn = calc.potentialReturn;
        next.finalReturn = calc.finalReturn;
        next.netProfit = calc.netProfit;
      }

      await onUpdateBet(next);
      count++;
    }

    setBulkEditOpen(false);
    finishBulk();
    toast.show(`${count} ${count === 1 ? "aposta atualizada" : "apostas atualizadas"}`, "success");
  };

  // Ignorar/repor em massa. Se TODAS as selecionadas já estão ignoradas, o
  // botão repõe-nas de imediato; caso contrário abre a folha do motivo.
  const bulkSetIgnored = async (ignored: boolean, comment?: string | null) => {
    const targets = selectedBets().filter((b) => (ignored ? !b.isIgnored : b.isIgnored));
    if (targets.length === 0) {
      finishBulk();
      return;
    }
    setBulkRunning(true);
    for (const b of targets) {
      await onIgnoreBet(b.id, ignored, ignored ? comment : undefined);
    }
    setBulkIgnoreOpen(false);
    setBulkIgnoreComment("");
    finishBulk();
    toast.show(
      ignored
        ? `${targets.length} ${targets.length === 1 ? "aposta ignorada" : "apostas ignoradas"}`
        : `${targets.length} ${targets.length === 1 ? "aposta reposta" : "apostas repostas"}`,
      "success",
    );
  };

  const startBulkIgnore = () => {
    const selected = selectedBets();
    if (selected.length === 0) return;
    if (selected.every((b) => b.isIgnored)) {
      void bulkSetIgnored(false);
    } else {
      setBulkIgnoreComment("");
      setBulkIgnoreOpen(true);
    }
  };

  const bulkDuplicate = async () => {
    const selected = bets.filter((b) => selectedIds.has(b.id));
    if (selected.length === 0) return;
    setBulkRunning(true);
    const timestamp = Date.now();
    const duplicatedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    const duplicated = selected.map((bet, i) => {
      const duplicateId = `bet-${timestamp}-${i}`;
      return {
        ...bet,
        id: duplicateId,
        selections: bet.selections.map((s, j) => ({ ...s, id: `${duplicateId}-sel-${j}` })),
        dateTime: duplicatedAt,
        notes: bet.notes ? `[Duplicado] ${bet.notes}` : "Aposta duplicada.",
        origin: "MANUAL",
        metadata: undefined,
      } as Bet;
    });
    await onAddBets(duplicated);
    finishBulk();
    toast.show(`${duplicated.length} apostas duplicadas`, "success");
  };

  const bulkDelete = async () => {
    const ids = bets.filter((b) => selectedIds.has(b.id)).map((b) => b.id);
    if (ids.length === 0) return;
    setBulkRunning(true);
    for (const id of ids) {
      await onDeleteBet(id);
    }
    finishBulk();
    toast.show(`${ids.length} apostas apagadas`, "success");
  };

  // ------------------------------------------------------------- render

  const accountOptions = accounts.filter(
    (a) => a.bookmaker === (form.bookmaker === "Outra" ? form.customBookmaker.trim() : form.bookmaker),
  );

  const selectedList = bets.filter((b) => selectedIds.has(b.id));
  const allSelectedIgnored = selectedList.length > 0 && selectedList.every((b) => b.isIgnored);
  const noSelection = selectedIds.size === 0 || bulkRunning;

  return (
    <div className="space-y-3">
      {/* Pesquisa + filtros + seleção */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Pesquisar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
        <Pressable
          as="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Filtros"
          className="relative flex items-center justify-center w-11 h-11 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
        >
          <Filter size={17} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Pressable>
        <Pressable
          as="button"
          onClick={toggleSelecting}
          aria-label="Selecionar apostas"
          className={`flex items-center justify-center w-11 h-11 rounded-full border ${
            isSelecting
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
          }`}
        >
          <CheckSquare size={17} />
        </Pressable>
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono px-1">
        {filteredBets.length} de {bets.length} apostas
      </p>

      {/* Lista agrupada por dia */}
      {groups.map(({ day, bets: dayBets }) => (
        <div key={day || "flat"}>
          {day !== "" && <SectionHeader>{formatDay(day)}</SectionHeader>}
          <MobileCard className="!p-0 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {dayBets.map((bet) => {
              const isSelected = selectedIds.has(bet.id);
              const card = (
                <div
                  // Ignorada: esbatida, como no desktop, para se perceber à
                  // vista que não conta para as estatísticas.
                  className={`px-4 py-3 ${bet.isIgnored ? "opacity-60" : ""}`}
                  onClick={() => (isSelecting ? toggleSelected(bet.id) : setDetailBet(bet))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {bet.selections[0]?.event || "Múltipla"}
                        {bet.selections.length > 1 && (
                          <span className="ml-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            +{bet.selections.length - 1}
                          </span>
                        )}
                      </p>
                      {bet.isIgnored && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                          <EyeOff size={9} /> Ignorada
                        </span>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {bet.selections[0]?.market}
                        {bet.selections[0]?.choice ? ` · ${bet.selections[0].choice}` : ""}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 truncate">
                        {bet.bookmaker}
                        {bet.accountId && accountLabelById.has(bet.accountId)
                          ? ` · ${accountLabelById.get(bet.accountId)}`
                          : ""}
                        {bet.isFreebet ? " · Freebet" : bet.isRiskFree ? " · Sem risco" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {isSelecting ? (
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-300 dark:border-zinc-600"
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </span>
                      ) : (
                        <StatusBadge status={bet.status} />
                      )}
                      <span
                        className={`text-sm font-bold font-mono tabular-nums ${
                          bet.status === "POR_LIQUIDAR"
                            ? "text-zinc-400 dark:text-zinc-500"
                            : safeNum(bet.netProfit) >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {bet.status === "POR_LIQUIDAR" ? money(safeNum(bet.stake)) : signed(safeNum(bet.netProfit))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    <span>Stake {money(safeNum(bet.stake))}</span>
                    <span>Odd {safeNum(bet.odd).toFixed(2)}</span>
                    <span className="ml-auto">{bet.dateTime?.slice(11, 16) || ""}</span>
                  </div>
                </div>
              );

              return isSelecting ? (
                <div key={bet.id}>{card}</div>
              ) : (
                <SwipeableRow
                  key={bet.id}
                  actions={[
                    { label: "Editar", icon: Pencil, color: "bg-zinc-500", onClick: () => openEdit(bet) },
                    { label: "Apagar", icon: Trash2, color: "bg-rose-600", onClick: () => setDeletingBet(bet) },
                  ]}
                >
                  {card}
                </SwipeableRow>
              );
            })}
          </MobileCard>
        </div>
      ))}

      {filteredBets.length === 0 && (
        <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">
          {bets.length === 0 ? "Ainda não registaste apostas." : "Nenhuma aposta corresponde aos filtros."}
        </div>
      )}

      {/* Barra de ações em massa: editar/ignorar/duplicar/apagar as selecionadas */}
      {isSelecting && (
        <div className="fixed bottom-[calc(4rem+var(--safe-bottom))] inset-x-0 z-40 px-4 pb-2">
          <div className="max-w-lg mx-auto rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-sm font-bold font-mono pl-1 tabular-nums">{selectedIds.size}</span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">sel.</span>
            <div className="ml-auto flex items-center gap-1.5">
              <BulkAction
                icon={Pencil}
                label="Editar selecionadas"
                disabled={noSelection}
                onClick={() => setBulkEditOpen(true)}
              />
              <BulkAction
                icon={allSelectedIgnored ? Eye : EyeOff}
                label={allSelectedIgnored ? "Repor selecionadas" : "Ignorar selecionadas"}
                disabled={noSelection}
                onClick={startBulkIgnore}
              />
              <BulkAction icon={Copy} label="Duplicar selecionadas" disabled={noSelection} onClick={bulkDuplicate} />
              <BulkAction
                icon={Trash2}
                label="Apagar selecionadas"
                danger
                disabled={noSelection}
                onClick={() => setConfirmBulkDelete(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* FAB nova aposta (escondido no modo de seleção) */}
      {!isSelecting && <FAB icon={Plus} label="Registar aposta" onClick={openAdd} />}

      {/* Sheet de detalhe */}
      <BottomSheet
        open={!!detailBet}
        onClose={() => setDetailBet(null)}
        title={detailBet?.selections[0]?.event || "Aposta"}
      >
        {detailBet && (
          <div className="space-y-3 pb-2">
            <div className="flex items-center justify-between">
              <StatusBadge status={detailBet.status} />
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                {detailBet.dateTime?.replace(" ", " · ")}
              </span>
            </div>

            <ListGroup>
              {detailBet.selections.map((s) => (
                <ListItem
                  key={s.id}
                  title={s.event}
                  subtitle={`${s.market} · ${s.choice}`}
                  trailing={safeNum(s.odd).toFixed(2)}
                />
              ))}
            </ListGroup>

            <MobileCard className="!p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">Stake</p>
                  <p className="text-sm font-bold font-mono tabular-nums mt-0.5">{money(safeNum(detailBet.stake))}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">Odd</p>
                  <p className="text-sm font-bold font-mono tabular-nums mt-0.5">{safeNum(detailBet.odd).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                    {detailBet.status === "POR_LIQUIDAR" ? "Retorno pot." : "Lucro"}
                  </p>
                  <p
                    className={`text-sm font-bold font-mono tabular-nums mt-0.5 ${
                      detailBet.status === "POR_LIQUIDAR"
                        ? "text-zinc-800 dark:text-zinc-100"
                        : safeNum(detailBet.netProfit) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {detailBet.status === "POR_LIQUIDAR"
                      ? money(safeNum(detailBet.potentialReturn))
                      : signed(safeNum(detailBet.netProfit))}
                  </p>
                </div>
              </div>
            </MobileCard>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 px-1">
              <p>
                {detailBet.bookmaker}
                {detailBet.accountId && accountLabelById.has(detailBet.accountId)
                  ? ` · Conta ${accountLabelById.get(detailBet.accountId)}`
                  : ""}
                {" · "}
                {detailBet.type === "MULTIPLA" ? "Múltipla" : "Simples"}
                {detailBet.isFreebet ? ` · Freebet (${detailBet.freebetType || "—"})` : ""}
                {detailBet.isRiskFree ? " · Sem risco" : ""}
              </p>
              {detailBet.notes && <p className="italic">“{detailBet.notes}”</p>}
              {detailBet.isIgnored && (
                <p className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <EyeOff size={12} className="shrink-0" />
                  Ignorada — excluída das estatísticas
                  {detailBet.comment ? `: “${detailBet.comment}”` : ""}
                </p>
              )}
            </div>

            {/* 2×2: quatro ações cabem sem ficarem apertadas no telemóvel. */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Pressable
                as="button"
                onClick={() => openEdit(detailBet)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
              >
                <Pencil size={13} /> Editar
              </Pressable>
              <Pressable
                as="button"
                onClick={() => handleDuplicate(detailBet)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
              >
                <Copy size={13} /> Duplicar
              </Pressable>
              {detailBet.isIgnored ? (
                <Pressable
                  as="button"
                  onClick={() => void handleUnignore(detailBet)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <Eye size={13} /> Repor
                </Pressable>
              ) : (
                <Pressable
                  as="button"
                  onClick={() => startIgnore(detailBet)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200"
                >
                  <EyeOff size={13} /> Ignorar
                </Pressable>
              )}
              <Pressable
                as="button"
                onClick={() => setDeletingBet(detailBet)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold"
              >
                <Trash2 size={13} /> Apagar
              </Pressable>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Ignorar: exclui das estatísticas, com motivo opcional */}
      <BottomSheet open={!!ignoringBet} onClose={() => setIgnoringBet(null)} title="Ignorar aposta?">
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            A aposta em <strong>{ignoringBet?.selections[0]?.event || "Múltipla"}</strong> deixa de
            contar para as estatísticas e gráficos. Continua na lista e podes repô-la quando quiseres.
          </p>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Motivo (opcional)
            </span>
            <textarea
              value={ignoreComment}
              onChange={(e) => setIgnoreComment(e.target.value)}
              rows={2}
              placeholder="Ex.: aposta de teste, erro de registo…"
              className={`mt-1 ${inputClasses} h-auto py-2.5`}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Pressable
              as="button"
              onClick={() => setIgnoringBet(null)}
              className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center"
            >
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              onClick={() => void confirmIgnore()}
              className="py-3 rounded-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-semibold text-center"
            >
              Ignorar
            </Pressable>
          </div>
        </div>
      </BottomSheet>

      {/* Confirmação de apagar */}
      <BottomSheet open={!!deletingBet} onClose={() => setDeletingBet(null)} title="Apagar aposta?">
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            A aposta em <strong>{deletingBet?.selections[0]?.event || "Múltipla"}</strong> será apagada
            definitivamente.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable
              as="button"
              onClick={() => setDeletingBet(null)}
              className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center"
            >
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              onClick={confirmDelete}
              className="py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold text-center"
            >
              Apagar
            </Pressable>
          </div>
        </div>
      </BottomSheet>

      {/* Confirmar apagar em massa */}
      <BottomSheet open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} title={`Apagar ${selectedIds.size} apostas?`}>
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            As <strong>{selectedIds.size}</strong> apostas selecionadas serão apagadas definitivamente.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable
              as="button"
              onClick={() => setConfirmBulkDelete(false)}
              className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center"
            >
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              disabled={bulkRunning}
              onClick={() => void bulkDelete()}
              className="py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold text-center disabled:opacity-60"
            >
              Apagar {selectedIds.size}
            </Pressable>
          </div>
        </div>
      </BottomSheet>

      {/* Ignorar em massa: exclui as selecionadas das estatísticas */}
      <BottomSheet open={bulkIgnoreOpen} onClose={() => setBulkIgnoreOpen(false)} title={`Ignorar ${selectedIds.size} apostas?`}>
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            As selecionadas deixam de contar para as estatísticas e gráficos. Continuam na lista e podes
            repô-las quando quiseres.
          </p>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Motivo (opcional, aplicado a todas)
            </span>
            <textarea
              value={bulkIgnoreComment}
              onChange={(e) => setBulkIgnoreComment(e.target.value)}
              rows={2}
              placeholder="Ex.: apostas de teste, erro de registo…"
              className={`mt-1 ${inputClasses} h-auto py-2.5`}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Pressable
              as="button"
              onClick={() => setBulkIgnoreOpen(false)}
              className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center"
            >
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              disabled={bulkRunning}
              onClick={() => void bulkSetIgnored(true, bulkIgnoreComment.trim() || null)}
              className="py-3 rounded-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-semibold text-center disabled:opacity-60"
            >
              Ignorar
            </Pressable>
          </div>
        </div>
      </BottomSheet>

      {/* Editar em massa: só os campos comuns; montante/odd/seleções ficam intactos */}
      <SheetPage
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        title={`Editar ${selectedIds.size} apostas`}
        footer={
          <Pressable
            as="button"
            disabled={bulkRunning}
            onClick={() => void applyBulkEdit()}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center disabled:opacity-60"
          >
            Aplicar a {selectedIds.size} {selectedIds.size === 1 ? "aposta" : "apostas"}
          </Pressable>
        }
      >
        <div className="space-y-5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Só os campos que alterares são aplicados. O montante, a odd e as seleções de cada aposta
            ficam intactos.
          </p>

          <ChipGroup label="Estado" options={BULK_STATUS_OPTIONS} value={beStatus} onChange={setBeStatus} />

          <FormField label="Desporto (vazio = manter)">
            <input
              type="text"
              list="bulk-sports"
              value={beSport}
              onChange={(e) => setBeSport(e.target.value)}
              placeholder="Manter"
              className={inputClasses}
            />
            <datalist id="bulk-sports">
              {sportOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>

          <ChipGroup
            label="Casa de apostas"
            options={[{ value: KEEP, label: "Manter" }, ...bookmakerOptions.map((b) => ({ value: b, label: b }))]}
            value={beBookmaker}
            onChange={setBeBookmaker}
          />

          {accounts.length > 0 && (
            <ChipGroup
              label="Conta"
              options={[
                { value: KEEP, label: "Manter" },
                { value: NO_ACCOUNT, label: "Sem conta" },
                ...accounts.map((a) => ({ value: a.id, label: `${a.bookmaker} · ${a.label}` })),
              ]}
              value={beAccount}
              onChange={setBeAccount}
            />
          )}

          <ChipGroup label="Tipo de dinheiro" options={BULK_MONEY_OPTIONS} value={beMoney} onChange={setBeMoney} />

          <FormField label="Acrescentar nota (opcional)">
            <textarea
              value={beNote}
              onChange={(e) => setBeNote(e.target.value)}
              rows={2}
              placeholder="Fica anexada às notas de cada aposta selecionada"
              className={`${inputClasses} h-auto py-2.5`}
            />
          </FormField>
        </div>
      </SheetPage>

      {/* Sheet de filtros */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros e ordenação"
        headerAction={
          activeFilterCount > 0 ? (
            <Pressable as="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1">
              Limpar tudo
            </Pressable>
          ) : undefined
        }
      >
        <div className="space-y-4 pb-2">
          <ChipGroup label="Estado" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          <ChipGroup
            label="Casa de apostas"
            options={[{ value: "ALL", label: "Todas" }, ...bookmakerOptions.map((b) => ({ value: b, label: b }))]}
            value={bookmakerFilter}
            onChange={setBookmakerFilter}
          />
          {accounts.length > 0 && (
            <ChipGroup
              label="Conta"
              options={[
                { value: "ALL", label: "Todas" },
                ...accounts.map((a) => ({ value: a.id, label: `${a.bookmaker} · ${a.label}` })),
                { value: "NONE", label: "Sem conta" },
              ]}
              value={accountFilter}
              onChange={setAccountFilter}
            />
          )}
          {sportOptions.length > 0 && (
            <ChipGroup
              label="Desporto"
              options={[{ value: "ALL", label: "Todos" }, ...sportOptions.map((s) => ({ value: s, label: s }))]}
              value={sportFilter}
              onChange={setSportFilter}
            />
          )}
          <ChipGroup label="Tipo" options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
          <ChipGroup label="Dinheiro" options={MONEY_OPTIONS} value={moneyFilter} onChange={setMoneyFilter} />

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">De</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">Até</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
              />
            </label>
          </div>

          <ChipGroup
            label="Ordenar por"
            options={SORT_OPTIONS}
            value={sortField}
            onChange={(v) => setSortField(v as SortField)}
          />
          <ChipGroup
            label="Direção"
            options={[
              { value: "desc", label: "Descendente" },
              { value: "asc", label: "Ascendente" },
            ]}
            value={sortAsc ? "asc" : "desc"}
            onChange={(v) => setSortAsc(v === "asc")}
          />

          <Pressable
            as="button"
            onClick={() => setFiltersOpen(false)}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center"
          >
            Ver {filteredBets.length} {filteredBets.length === 1 ? "aposta" : "apostas"}
          </Pressable>
        </div>
      </BottomSheet>

      {/* Formulário (nova/editar) em página-folha */}
      <SheetPage
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.editingBet ? "Editar aposta" : "Registar aposta"}
        footer={
          <div className="space-y-2">
            {form.error && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{form.error}</p>
            )}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                Odd total <strong className="font-mono text-zinc-800 dark:text-zinc-100">{form.calculatedOdd.toFixed(2)}</strong>
              </span>
              <span>
                {form.status === "POR_LIQUIDAR" ? "Retorno potencial" : "Lucro"}{" "}
                <strong
                  className={`font-mono ${
                    form.status === "POR_LIQUIDAR"
                      ? "text-zinc-800 dark:text-zinc-100"
                      : form.potentialWinnings.netProfit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {form.status === "POR_LIQUIDAR"
                    ? money(form.potentialWinnings.potentialReturn)
                    : signed(form.potentialWinnings.netProfit)}
                </strong>
              </span>
            </div>
            <Pressable
              as="button"
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center"
            >
              {form.editingBet ? "Guardar alterações" : "Registar aposta"}
            </Pressable>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Tipo */}
          <SegmentedControl
            segments={[
              { value: "SIMPLES", label: "Simples" },
              { value: "MULTIPLA", label: "Múltipla" },
            ]}
            value={form.type}
            onChange={(v) => form.setType(v)}
          />

          {/* Estado */}
          <ChipGroup
            label="Estado"
            options={STATUS_OPTIONS.filter((o) => o.value !== "ALL")}
            value={form.status}
            onChange={(v) => form.setStatus(v as BetStatus)}
          />

          {form.status === "CASHOUT" && (
            <FormField label="Valor recebido no cashout">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.cashoutReturn}
                onChange={(e) => form.setCashoutReturn(e.target.value)}
                placeholder="0.00"
                className={inputClasses}
              />
            </FormField>
          )}

          {(form.status === "MEIO_GANHA" || form.status === "MEIO_PERDIDA") && (
            <FormField label="Retorno liquidado (opcional)">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.settledReturn}
                onChange={(e) => form.setSettledReturn(e.target.value)}
                placeholder="Automático"
                className={inputClasses}
              />
            </FormField>
          )}

          {/* Casa + conta */}
          <FormField label="Casa de apostas">
            <select
              value={form.bookmaker}
              onChange={(e) => form.changeBookmaker(e.target.value)}
              className={inputClasses}
            >
              {[...new Set([...AVAILABLE_BOOKMAKERS, "Outra"])].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </FormField>

          {form.bookmaker === "Outra" && (
            <FormField label="Nome da casa">
              <input
                type="text"
                value={form.customBookmaker}
                onChange={(e) => form.setCustomBookmaker(e.target.value)}
                placeholder="Ex.: Bwin"
                className={inputClasses}
              />
            </FormField>
          )}

          {accountOptions.length > 0 && (
            <FormField label="Conta (opcional)">
              <select
                value={form.accountId}
                onChange={(e) => form.setAccountId(e.target.value)}
                className={inputClasses}
              >
                <option value="">Sem conta</option>
                {accountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Seleções */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono mb-1.5">
              Seleções
            </p>
            <div className="space-y-3">
              {form.selections.map((s, i) => (
                <MobileCard key={i} className="!p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-zinc-400 dark:text-zinc-500">
                      #{i + 1}
                    </span>
                    {form.selections.length > 1 && (
                      <Pressable
                        as="button"
                        onClick={() => form.removeSelection(i)}
                        aria-label="Remover seleção"
                        className="p-1 text-rose-500"
                      >
                        <X size={14} />
                      </Pressable>
                    )}
                  </div>
                  <input
                    type="text"
                    value={s.event}
                    onChange={(e) => form.changeSelection(i, "event", e.target.value)}
                    placeholder="Evento (ex.: Benfica vs Porto)"
                    className={inputClasses}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={s.market}
                      onChange={(e) => form.changeSelection(i, "market", e.target.value)}
                      placeholder="Mercado"
                      className={inputClasses}
                    />
                    <input
                      type="text"
                      value={s.choice}
                      onChange={(e) => form.changeSelection(i, "choice", e.target.value)}
                      placeholder="Escolha"
                      className={inputClasses}
                    />
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="1"
                    value={s.odd}
                    onChange={(e) => form.changeSelection(i, "odd", e.target.value)}
                    placeholder="Odd"
                    className={inputClasses}
                  />
                </MobileCard>
              ))}
              {form.type === "MULTIPLA" && (
                <Pressable
                  as="button"
                  onClick={form.addSelection}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
                >
                  <PlusCircle size={14} /> Adicionar seleção
                </Pressable>
              )}
            </div>
          </div>

          {/* Stake + dinheiro */}
          <FormField label={`Stake (${currency})`}>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.stake}
              onChange={(e) => form.setStake(e.target.value)}
              className={inputClasses}
            />
          </FormField>

          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={form.isFreebet}
              onClick={() => form.setIsFreebet(!form.isFreebet)}
              label="Freebet"
            />
            <ToggleChip
              active={form.isRiskFree}
              onClick={() => form.setIsRiskFree(!form.isRiskFree)}
              label="Sem risco"
            />
          </div>

          {form.isFreebet && (
            <ChipGroup
              label="Tipo de freebet"
              options={[
                { value: "SNR", label: "SNR (stake não devolvida)" },
                { value: "SR", label: "SR (stake devolvida)" },
              ]}
              value={form.freebetType}
              onChange={(v) => form.setFreebetType(v as "SNR" | "SR")}
            />
          )}

          {/* Data + notas */}
          <FormField label="Data e hora">
            <input
              type="datetime-local"
              value={form.dateTime.replace(" ", "T")}
              onChange={(e) => form.setDateTime(e.target.value.replace("T", " "))}
              className={inputClasses}
            />
          </FormField>

          <FormField label="Notas (opcional)">
            <textarea
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              rows={2}
              placeholder="Apontamentos sobre a aposta…"
              className={`${inputClasses} h-auto py-2.5`}
            />
          </FormField>
        </div>
      </SheetPage>
    </div>
  );
}

const inputClasses =
  "w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500";

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// Botão de ação em massa na barra escura — só ícone (poupa espaço em ecrãs
// estreitos), com aria-label para acessibilidade.
function BulkAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      as="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-40 ${
        danger
          ? "bg-rose-600 text-white"
          : "bg-white/10 dark:bg-zinc-900/10 text-zinc-100 dark:text-zinc-900"
      }`}
    >
      <Icon size={16} />
    </Pressable>
  );
}

function ToggleChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? "bg-emerald-600 border-emerald-600 text-white"
          : "bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

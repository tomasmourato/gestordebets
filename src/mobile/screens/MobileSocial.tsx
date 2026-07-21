// src/mobile/screens/MobileSocial.tsx
// Social mobile: procura de utilizadores, pedidos de amizade e lista de
// amigos em listas touch-first; o perfil de um amigo abre em página-folha
// com o dashboard mobile (read-only) + apostas recentes em cards. Reutiliza
// integralmente src/lib/socialApi (mesma semântica do Social desktop).

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Search, Check, X, UserPlus, UserMinus, Clock, Loader2 } from "lucide-react";
import { Bet, Friend, FriendRequest, UserSearchResult } from "../../types";
import { safeNum } from "../../utils";
import {
  searchUsers,
  listFriends,
  listRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendRequest,
  removeFriend,
  fetchFriendBets,
} from "../../lib/socialApi";
import { SectionHeader, ListGroup, ListItem, MobileCard, SheetPage, BottomSheet, Pressable, useToast } from "../ui";

const MobileDashboard = lazy(() => import("./MobileDashboard"));

interface MobileSocialProps {
  currency: string;
  isDark: boolean;
}

// Etiqueta + cores por estado (igual ao statusMeta do Social desktop).
function statusMeta(status: Bet["status"]): { label: string; className: string } {
  switch (status) {
    case "GANHA":
      return { label: "Ganha", className: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" };
    case "MEIO_GANHA":
      return { label: "Meio ganha", className: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" };
    case "PERDIDA":
      return { label: "Perdida", className: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900" };
    case "MEIO_PERDIDA":
      return { label: "Meio perdida", className: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900" };
    case "ANULADA":
      return { label: "Anulada", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700" };
    case "CASHOUT":
      return { label: "Cashout", className: "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900" };
    default:
      return { label: "Por liquidar", className: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900" };
  }
}

function Avatar({ username, size = "w-9 h-9 text-sm" }: { username: string; size?: string }) {
  return (
    <span className={`${size} rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold uppercase shrink-0`}>
      {username.slice(0, 2)}
    </span>
  );
}

export default function MobileSocial({ currency, isDark }: MobileSocialProps) {
  const toast = useToast();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [viewing, setViewing] = useState<Friend | null>(null);
  const [friendBets, setFriendBets] = useState<Bet[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [removingFriend, setRemovingFriend] = useState<Friend | null>(null);

  const refresh = async () => {
    try {
      const [f, r] = await Promise.all([listFriends(), listRequests()]);
      setFriends(f);
      setIncoming(r.incoming);
      setOutgoing(r.outgoing);
    } catch (e: any) {
      toast.show(e?.message || "Erro ao carregar os dados sociais.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Procura com debounce (min. 2 caracteres) — igual ao desktop.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        setResults(await searchUsers(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const patchResult = (userId: string, relationship: UserSearchResult["relationship"]) => {
    setResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship } : u)));
  };

  const handleSend = async (u: UserSearchResult) => {
    try {
      const status = await sendFriendRequest(u.username);
      patchResult(u.id, status === "friends" ? "friends" : "outgoing");
      toast.show(status === "friends" ? `Agora és amigo de ${u.username}.` : `Pedido enviado a ${u.username}.`, "success");
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || "Erro ao enviar o pedido.", "error");
    }
  };

  const handleAccept = async (r: FriendRequest) => {
    try {
      await acceptFriendRequest(r.id);
      toast.show(`Aceitaste o pedido de ${r.username}.`, "success");
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || "Erro ao aceitar o pedido.", "error");
    }
  };

  const handleRemoveRequest = async (r: FriendRequest) => {
    try {
      await removeFriendRequest(r.id);
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || "Erro ao remover o pedido.", "error");
    }
  };

  const handleRemoveFriend = async (f: Friend) => {
    try {
      await removeFriend(f.id);
      setRemovingFriend(null);
      if (viewing?.id === f.id) setViewing(null);
      toast.show(`${f.username} removido dos amigos.`, "success");
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || "Erro ao remover a amizade.", "error");
    }
  };

  const openFriend = async (f: Friend) => {
    setViewing(f);
    setViewLoading(true);
    setFriendBets([]);
    try {
      const { bets } = await fetchFriendBets(f.id);
      setFriendBets(bets);
    } catch (e: any) {
      toast.show(e?.message || "Erro ao obter as apostas do amigo.", "error");
    } finally {
      setViewLoading(false);
    }
  };

  const recentFriendBets = useMemo(
    () =>
      [...friendBets]
        .sort((a, b) => new Date(b.dateTime.replace(" ", "T")).getTime() - new Date(a.dateTime.replace(" ", "T")).getTime())
        .slice(0, 50),
    [friendBets],
  );

  const money = (n: number) =>
    `${safeNum(n).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency}`;

  return (
    <div className="space-y-3">
      {/* Procurar utilizadores */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Procurar utilizadores…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {query.trim().length >= 2 && (
        <>
          <SectionHeader>Resultados</SectionHeader>
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-400 dark:text-zinc-500">
              <Loader2 size={14} className="animate-spin" /> A procurar…
            </div>
          ) : results.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">Nenhum utilizador encontrado.</p>
          ) : (
            <ListGroup>
              {results.map((u) => (
                <ListItem
                  key={u.id}
                  title={<span className="flex items-center gap-2.5"><Avatar username={u.username} size="w-8 h-8 text-xs" />{u.username}</span>}
                  trailing={
                    u.relationship === "friends" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Amigos</span>
                    ) : u.relationship === "outgoing" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1"><Clock size={11} /> Pendente</span>
                    ) : u.relationship === "incoming" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Respondei ao pedido ↓</span>
                    ) : (
                      <Pressable
                        as="button"
                        onClick={() => void handleSend(u)}
                        aria-label={`Adicionar ${u.username}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold"
                      >
                        <UserPlus size={12} /> Adicionar
                      </Pressable>
                    )
                  }
                />
              ))}
            </ListGroup>
          )}
        </>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-xs text-zinc-400 dark:text-zinc-500">
          <Loader2 size={16} className="animate-spin" /> A carregar…
        </div>
      ) : (
        <>
          {/* Pedidos recebidos */}
          {incoming.length > 0 && (
            <>
              <SectionHeader>Pedidos recebidos</SectionHeader>
              <ListGroup>
                {incoming.map((r) => (
                  <ListItem
                    key={r.id}
                    title={<span className="flex items-center gap-2.5"><Avatar username={r.username} size="w-8 h-8 text-xs" />{r.username}</span>}
                    trailing={
                      <span className="flex items-center gap-1.5">
                        <Pressable as="button" onClick={() => void handleAccept(r)} aria-label={`Aceitar ${r.username}`} className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white">
                          <Check size={15} />
                        </Pressable>
                        <Pressable as="button" onClick={() => void handleRemoveRequest(r)} aria-label={`Recusar ${r.username}`} className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                          <X size={15} />
                        </Pressable>
                      </span>
                    }
                  />
                ))}
              </ListGroup>
            </>
          )}

          {/* Pedidos enviados */}
          {outgoing.length > 0 && (
            <>
              <SectionHeader>Pedidos enviados</SectionHeader>
              <ListGroup>
                {outgoing.map((r) => (
                  <ListItem
                    key={r.id}
                    title={<span className="flex items-center gap-2.5"><Avatar username={r.username} size="w-8 h-8 text-xs" />{r.username}</span>}
                    subtitle="À espera de resposta"
                    trailing={
                      <Pressable as="button" onClick={() => void handleRemoveRequest(r)} aria-label={`Cancelar pedido a ${r.username}`} className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500">
                        Cancelar
                      </Pressable>
                    }
                  />
                ))}
              </ListGroup>
            </>
          )}

          {/* Amigos */}
          <SectionHeader>Amigos ({friends.length})</SectionHeader>
          {friends.length === 0 ? (
            <MobileCard className="text-center py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Ainda não tens amigos adicionados.</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Procura utilizadores acima para enviar pedidos.</p>
            </MobileCard>
          ) : (
            <ListGroup>
              {friends.map((f) => (
                <ListItem
                  key={f.id}
                  title={<span className="flex items-center gap-2.5"><Avatar username={f.username} />{f.username}</span>}
                  subtitle={f.since ? `Amigos desde ${new Date(f.since).toLocaleDateString("pt-PT")}` : undefined}
                  chevron
                  onClick={() => void openFriend(f)}
                />
              ))}
            </ListGroup>
          )}
        </>
      )}

      {/* Perfil do amigo em página-folha */}
      <SheetPage
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.username : ""}
        footer={
          viewing ? (
            <Pressable
              as="button"
              onClick={() => setRemovingFriend(viewing)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm font-semibold"
            >
              <UserMinus size={15} /> Remover amigo
            </Pressable>
          ) : undefined
        }
      >
        {viewing && (
          <div className="space-y-4">
            {viewLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-zinc-400 dark:text-zinc-500">
                <Loader2 size={16} className="animate-spin" /> A carregar as estatísticas de {viewing.username}…
              </div>
            ) : (
              <>
                {/* Estatísticas read-only (sem drill-down). */}
                <Suspense fallback={<div className="py-8 text-center text-xs text-zinc-400">A carregar…</div>}>
                  <MobileDashboard bets={friendBets} currency={currency} isDark={isDark} />
                </Suspense>

                <SectionHeader>Apostas recentes ({friendBets.length} no total)</SectionHeader>
                {recentFriendBets.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">
                    Este amigo ainda não registou apostas.
                  </p>
                ) : (
                  <MobileCard className="!p-0 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                    {recentFriendBets.map((bet) => {
                      const meta = statusMeta(bet.status);
                      const event = bet.selections?.[0]?.event || "Múltipla";
                      const extra = (bet.selections?.length || 0) > 1 ? ` +${bet.selections.length - 1}` : "";
                      return (
                        <div key={bet.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {event}
                                {extra && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{extra}</span>}
                              </p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                                {bet.dateTime?.slice(0, 16)} · {bet.bookmaker}
                              </p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.className}`}>
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                            <span>Stake {money(safeNum(bet.stake))}</span>
                            <span>Odd {safeNum(bet.odd).toFixed(2)}</span>
                            <span className={`ml-auto font-bold ${bet.status === "POR_LIQUIDAR" ? "" : safeNum(bet.netProfit) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {bet.status === "POR_LIQUIDAR" ? "—" : `${safeNum(bet.netProfit) >= 0 ? "+" : ""}${money(safeNum(bet.netProfit))}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </MobileCard>
                )}
              </>
            )}
          </div>
        )}
      </SheetPage>

      {/* Confirmação de remover amigo */}
      <BottomSheet open={!!removingFriend} onClose={() => setRemovingFriend(null)} title="Remover amigo?">
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Deixarás de ver as estatísticas de <strong>{removingFriend?.username}</strong> e ele deixará de ver as tuas.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable as="button" onClick={() => setRemovingFriend(null)} className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">
              Cancelar
            </Pressable>
            <Pressable
              as="button"
              onClick={() => removingFriend && void handleRemoveFriend(removingFriend)}
              className="py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold text-center"
            >
              Remover
            </Pressable>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

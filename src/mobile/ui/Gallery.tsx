// src/mobile/ui/Gallery.tsx
// Galeria de desenvolvimento dos primitivos mobile — acessível com
// `?gallery=1`, fora do gate de autenticação, só para verificação visual e
// de interação no browser/emulador. REMOVER na Fase 5 (polish).

import { lazy, Suspense, useState } from "react";
import { Plus, Pencil, Trash2, Home, Bell, Wallet } from "lucide-react";
import { INITIAL_BETS } from "../../utils";

const MobileDashboard = lazy(() => import("../screens/MobileDashboard"));
const MobileBets = lazy(() => import("../screens/MobileBets"));
import {
  Pressable,
  ToastProvider,
  useToast,
  BottomSheet,
  SheetPage,
  FAB,
  SectionHeader,
  MobileCard,
  ListItem,
  ListGroup,
  SegmentedControl,
  FilterChips,
  SwipeableRow,
  PullToRefresh,
} from "./index";

function GalleryInner() {
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [seg, setSeg] = useState<"all" | "won" | "lost">("all");
  const [chip, setChip] = useState("todos");

  return (
    <PullToRefresh onRefresh={async () => { await new Promise((r) => setTimeout(r, 900)); toast.show("Atualizado", "success"); }}>
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4 pt-safe pb-24">
        <h1 className="text-lg font-bold font-display pt-4">Galeria de primitivos</h1>
        <p className="text-xs text-zinc-500 mb-2">Dev-only · puxa para atualizar</p>

        <SectionHeader>Toast</SectionHeader>
        <div className="flex gap-2">
          <Pressable as="button" onClick={() => toast.show("Guardado com sucesso", "success")} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Sucesso</Pressable>
          <Pressable as="button" onClick={() => toast.show("Algo correu mal", "error")} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold">Erro</Pressable>
          <Pressable as="button" onClick={() => toast.show("Só informação", "info")} className="px-3 py-2 rounded-lg bg-zinc-700 text-white text-xs font-semibold">Info</Pressable>
        </div>

        <SectionHeader>Segmented + Chips</SectionHeader>
        <SegmentedControl
          segments={[{ value: "all", label: "Todas" }, { value: "won", label: "Ganhas" }, { value: "lost", label: "Perdidas" }]}
          value={seg}
          onChange={setSeg}
        />
        <div className="mt-3">
          <FilterChips
            options={[{ value: "todos", label: "Todos" }, { value: "betano", label: "Betano" }, { value: "betclic", label: "Betclic" }, { value: "placard", label: "Placard" }, { value: "solverde", label: "Solverde" }]}
            value={chip}
            onChange={setChip}
          />
        </div>

        <SectionHeader>Lista</SectionHeader>
        <ListGroup>
          <ListItem icon={Home} title="Painel" subtitle="Visão geral" chevron onClick={() => toast.show("Painel", "info")} />
          <ListItem icon={Wallet} title="Saldo" trailing="1.240,00 €" />
          <ListItem icon={Bell} title="Notificações" subtitle="Ativadas" chevron />
          <ListItem icon={Trash2} title="Apagar tudo" destructive onClick={() => toast.show("Apagar", "error")} />
        </ListGroup>

        <SectionHeader>Swipe (puxa para a esquerda)</SectionHeader>
        <MobileCard className="!p-0 overflow-hidden">
          <SwipeableRow
            actions={[
              { label: "Editar", icon: Pencil, color: "bg-zinc-500", onClick: () => toast.show("Editar", "info") },
              { label: "Apagar", icon: Trash2, color: "bg-rose-600", onClick: () => toast.show("Apagado", "error") },
            ]}
          >
            <div className="px-4 py-3">
              <div className="text-sm font-medium">Benfica — Porto</div>
              <div className="text-xs text-zinc-500 font-mono">Stake 10,00 € · Odd 2,10</div>
            </div>
          </SwipeableRow>
        </MobileCard>

        <SectionHeader>Sheets</SectionHeader>
        <div className="flex gap-2">
          <Pressable as="button" onClick={() => setSheetOpen(true)} className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold">Bottom sheet</Pressable>
          <Pressable as="button" onClick={() => setPageOpen(true)} className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold">Sheet page</Pressable>
        </div>

        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Detalhe da aposta">
          <div className="space-y-2 pb-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Arrasta para baixo ou toca no fundo para fechar. O botão voltar do Android também fecha.</p>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 flex items-center px-3 text-sm">Linha {i + 1}</div>
            ))}
          </div>
        </BottomSheet>

        <SheetPage
          open={pageOpen}
          onClose={() => setPageOpen(false)}
          title="Nova aposta"
          footer={<Pressable as="button" onClick={() => { setPageOpen(false); toast.show("Aposta guardada", "success"); }} className="w-full py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold text-center">Guardar</Pressable>}
        >
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <input key={i} placeholder={`Campo ${i + 1}`} className="w-full h-12 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-base" />
            ))}
          </div>
        </SheetPage>

        <SectionHeader>Ecrã — Dashboard mobile</SectionHeader>
        <Suspense fallback={<div className="text-xs text-zinc-400 py-6">A carregar…</div>}>
          <MobileDashboard bets={INITIAL_BETS} currency="€" isDark={document.documentElement.classList.contains("dark")} onOpenBets={(f) => toast.show("Abrir apostas: " + f.status, "info")} />
        </Suspense>

        <SectionHeader>Ecrã — Apostas mobile</SectionHeader>
        <Suspense fallback={<div className="text-xs text-zinc-400 py-6">A carregar…</div>}>
          <MobileBets
            bets={INITIAL_BETS}
            currency="€"
            onAddBet={() => toast.show("onAddBet", "info")}
            onAddBets={() => toast.show("onAddBets", "info")}
            onUpdateBet={() => toast.show("onUpdateBet", "info")}
            onIgnoreBet={(_id, ignored) => toast.show(ignored ? "onIgnoreBet(true)" : "onIgnoreBet(false)", "info")}
            onDeleteBet={() => toast.show("onDeleteBet", "info")}
          />
        </Suspense>

        <FAB icon={Plus} label="Nova aposta" onClick={() => setPageOpen(true)} />
      </div>
    </PullToRefresh>
  );
}

export default function Gallery() {
  return (
    <ToastProvider>
      <GalleryInner />
    </ToastProvider>
  );
}

// src/mobile/lib/backStack.ts
// Pilha (LIFO) de handlers do botão "voltar" do Android. Elementos que se
// sobrepõem à navegação — bottom sheets, painéis, modais — registam um
// handler enquanto estão abertos. O listener global do botão back (montado
// em MobileApp) chama `runTopBackHandler()`: se houver um handler no topo,
// fecha esse elemento e consome o evento; caso contrário, o MobileApp aplica
// a navegação por separadores / sair da app.
//
// Independente do Capacitor — na web o hook também funciona (só não há
// nenhum listener nativo a disparar), o que mantém as primitivas testáveis
// no browser.

import { useEffect } from "react";

interface BackEntry {
  id: number;
  handler: () => void;
}

let nextId = 1;
const stack: BackEntry[] = [];

/** Executa o handler mais recente, se existir. Devolve true se consumiu. */
export function runTopBackHandler(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.handler();
  return true;
}

/** True quando há pelo menos um elemento sobreposto a pedir o back. */
export function hasBackHandler(): boolean {
  return stack.length > 0;
}

function push(handler: () => void): number {
  const id = nextId++;
  stack.push({ id, handler });
  return id;
}

function remove(id: number): void {
  const index = stack.findIndex((entry) => entry.id === id);
  if (index !== -1) stack.splice(index, 1);
}

/**
 * Regista `handler` como resposta ao botão back enquanto `active` for true.
 * Uso típico: `useBackHandler(onClose, open)` num bottom sheet.
 */
export function useBackHandler(handler: () => void, active = true): void {
  useEffect(() => {
    if (!active) return;
    const id = push(handler);
    return () => remove(id);
    // Re-registamos quando o handler ou `active` mudam para apanhar closures
    // sempre atualizados (ex.: estado capturado pelo onClose).
  }, [handler, active]);
}

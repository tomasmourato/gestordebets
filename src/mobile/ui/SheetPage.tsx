// src/mobile/ui/SheetPage.tsx
// Página em folha inteira que sobe de baixo — para fluxos maiores que uma
// bottom sheet (ex.: formulário de aposta). Tem cabeçalho fixo com botão
// fechar/voltar, respeita as safe areas e regista-se no backStack.

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useBackHandler } from "../lib/backStack";
import { Pressable } from "./Pressable";

interface SheetPageProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Barra de ação fixa no fundo (ex.: botão "Guardar"). */
  footer?: React.ReactNode;
}

export function SheetPage({ open, onClose, title, children, footer }: SheetPageProps) {
  useBackHandler(onClose, open);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-zinc-100 dark:bg-zinc-950 flex flex-col"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
        >
          {/* Cabeçalho */}
          <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur pt-safe">
            <div className="h-14 px-3 flex items-center gap-2">
              <Pressable
                as="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex items-center justify-center w-9 h-9 rounded-full text-zinc-500 dark:text-zinc-400"
              >
                <X size={20} />
              </Pressable>
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display truncate">
                {title}
              </h2>
            </div>
          </header>

          {/* Corpo com scroll */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {children}
          </div>

          {/* Rodapé de ação (opcional) */}
          {footer && (
            <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
              {footer}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

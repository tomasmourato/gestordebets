// src/mobile/ui/BottomSheet.tsx
// Bottom sheet nativa-feel: sobe de baixo, escurece o fundo, arrasta para
// baixo para fechar (drag + velocidade), tem pega (grabber) e respeita a
// safe area inferior. Regista-se no backStack para o botão "voltar" do
// Android a fechar. Usa portal para escapar a qualquer overflow/transform.
//
// Nota de teclado: com Keyboard.resize=body + adjustResize, o WebView encolhe
// e a sheet (fixa ao fundo) fica automaticamente acima do teclado.

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { useBackHandler } from "../lib/backStack";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Título opcional no cabeçalho da sheet. */
  title?: string;
  /** Ação opcional à direita do cabeçalho. */
  headerAction?: React.ReactNode;
}

export function BottomSheet({ open, onClose, children, title, headerAction }: BottomSheetProps) {
  const y = useMotionValue(0);

  // Botão "voltar" do Android fecha a sheet enquanto estiver aberta.
  useBackHandler(onClose, open);

  // Bloqueia o scroll do body por trás da sheet.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset da posição de arrasto sempre que (re)abre.
  useEffect(() => {
    if (open) y.set(0);
  }, [open, y]);

  const handleDragEnd = (_e: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 120 || info.velocity.y > 700) {
      onClose();
    } else {
      animate(y, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Painel: entrada/saída deslizante no elemento externo; o arrasto
              (drag) vive no elemento interno, para os transforms não colidirem. */}
          <motion.div
            className="relative w-full max-w-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
          >
            <motion.div
              className="bg-white dark:bg-zinc-950 rounded-t-2xl border-t border-x border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90dvh] flex flex-col"
              style={{ y }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
            >
              {/* Pega */}
              <div className="shrink-0 flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
                <span className="h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>

              {(title || headerAction) && (
                <div className="shrink-0 flex items-center justify-between gap-3 px-4 pb-2 pt-1">
                  <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display truncate">
                    {title}
                  </h3>
                  {headerAction}
                </div>
              )}

              {/* Conteúdo (scroll interno) + safe area inferior */}
              <div className="overflow-y-auto overscroll-contain px-4 pt-1 pb-[calc(1rem+var(--safe-bottom))]">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

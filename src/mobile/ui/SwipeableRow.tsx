// src/mobile/ui/SwipeableRow.tsx
// Linha com ações reveladas por arrasto horizontal (padrão nativo): puxar
// para a esquerda revela botões (ex.: editar/apagar). Toca fora ou arrasta
// de volta para fechar. Snap por posição ou velocidade.

import React, { useState } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { selectionHaptic } from "../../lib/haptics";

export interface SwipeAction {
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  onClick: () => void;
  /** Cor de fundo do botão (classes Tailwind). */
  color: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  /** Largura de cada botão de ação, em px. */
  actionWidth?: number;
}

export function SwipeableRow({ children, actions, actionWidth = 72 }: SwipeableRowProps) {
  const x = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const revealWidth = actions.length * actionWidth;

  const snap = (to: number) => {
    animate(x, to, { type: "spring", stiffness: 500, damping: 44 });
    setOpen(to !== 0);
  };

  const handleDragEnd = (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const shouldOpen = info.offset.x < -revealWidth / 2 || info.velocity.x < -500;
    if (shouldOpen) {
      void selectionHaptic();
      snap(-revealWidth);
    } else {
      snap(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Botões de ação por baixo */}
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              action.onClick();
              snap(0);
            }}
            style={{ width: actionWidth }}
            className={`flex flex-col items-center justify-center gap-1 text-white text-[10px] font-semibold ${action.color}`}
          >
            <action.icon size={18} />
            {action.label}
          </button>
        ))}
      </div>

      {/* Conteúdo arrastável por cima */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -revealWidth, right: 0 }}
        dragElastic={{ left: 0.05, right: 0.15 }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (open) snap(0);
        }}
        className="relative bg-white dark:bg-zinc-900"
      >
        {children}
      </motion.div>
    </div>
  );
}

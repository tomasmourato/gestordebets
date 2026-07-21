// src/mobile/ui/FAB.tsx
// Botão de ação flutuante (FAB): ação primária do ecrã (ex.: nova aposta).
// Fica acima da tab bar + safe area, com feedback de toque e haptic.

import React from "react";
import { motion } from "motion/react";
import { tapHaptic } from "../../lib/haptics";

interface FABProps {
  onClick: () => void;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
}

export function FAB({ onClick, icon: Icon, label }: FABProps) {
  return (
    <motion.button
      onClick={() => {
        void tapHaptic("medium");
        onClick();
      }}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="fixed right-4 bottom-[calc(5rem+var(--safe-bottom))] z-30 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:bg-emerald-700"
    >
      <Icon size={24} />
    </motion.button>
  );
}

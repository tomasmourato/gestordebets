// src/mobile/ui/PullToRefresh.tsx
// Puxar para atualizar (pull-to-refresh) por toque. IMPORTANTE: NÃO cria um
// contentor de scroll próprio — o shell mobile usa o scroll da PÁGINA (body).
// Este wrapper é um bloco normal em fluxo; só engata o gesto de "puxar"
// quando a página já está no topo (window.scrollY <= 0). Assim o scroll
// normal nunca é bloqueado (era o bug: `h-full overflow-y-auto` aninhado
// criava um viewport de altura automática que não deslizava).

import React, { useRef, useState } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { RefreshCw } from "lucide-react";
import { selectionHaptic } from "../../lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Distância (px) a puxar para disparar. */
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 72 }: PullToRefreshProps) {
  const y = useMotionValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const startRef = useRef<number | null>(null);
  const pullingRef = useRef(false);

  const atTop = () => window.scrollY <= 0;

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing || !atTop()) return;
    startRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pullingRef.current || startRef.current === null) return;
    const delta = e.touches[0].clientY - startRef.current;
    // Se o dedo sobe (delta<=0) ou já saímos do topo, é scroll normal da
    // página: desiste do gesto de puxar e deixa o body deslizar à vontade.
    if (delta <= 0 || !atTop()) {
      pullingRef.current = false;
      startRef.current = null;
      if (y.get() !== 0) animate(y, 0, { duration: 0.15 });
      return;
    }
    // Resistência: puxa cada vez mais devagar.
    y.set(Math.min(delta * 0.5, threshold * 1.5));
  };

  const onTouchEnd = async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    startRef.current = null;

    if (y.get() >= threshold && !refreshing) {
      void selectionHaptic();
      setRefreshing(true);
      animate(y, threshold, { type: "spring", stiffness: 500, damping: 40 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(y, 0, { type: "spring", stiffness: 500, damping: 40 });
      }
    } else {
      animate(y, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Indicador (altura 0 em repouso — não ocupa espaço) */}
      <motion.div
        style={{ height: y, opacity: y }}
        className="flex items-end justify-center overflow-hidden"
      >
        <motion.span
          animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0.2 }}
          className="mb-2 text-emerald-600 dark:text-emerald-400"
        >
          <RefreshCw size={18} />
        </motion.span>
      </motion.div>

      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

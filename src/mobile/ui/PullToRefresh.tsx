// src/mobile/ui/PullToRefresh.tsx
// Puxar para atualizar (pull-to-refresh) por toque: quando o conteúdo está
// no topo, arrastar para baixo revela um indicador; ao largar além do
// limiar, chama onRefresh. Só ativa quando o scroll está no topo, para não
// competir com o scroll normal.

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
  const containerRef = useRef<HTMLDivElement>(null);

  // No topo do próprio contentor E da página (o conteúdo mobile usa o scroll
  // do body): sem isto, puxar para cima a meio da página disparava o refresh.
  const atTop = () => (containerRef.current?.scrollTop ?? 0) <= 0 && window.scrollY <= 0;

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing || !atTop()) return;
    startRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pullingRef.current || startRef.current === null) return;
    const delta = e.touches[0].clientY - startRef.current;
    if (delta <= 0 || !atTop()) {
      y.set(0);
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
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative h-full overflow-y-auto overscroll-contain"
    >
      {/* Indicador */}
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

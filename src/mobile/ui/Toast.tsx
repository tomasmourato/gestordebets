// src/mobile/ui/Toast.tsx
// Toasts transitórios da UI mobile: mensagens curtas de confirmação/erro que
// aparecem acima da tab bar e desaparecem sozinhas. Exposto por contexto
// (<ToastProvider> em MobileApp) + hook useToast().

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { notifyHaptic } from "../../lib/haptics";

type ToastKind = "success" | "error" | "info";

interface ToastState {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, React.ComponentType<{ size?: number; className?: string }>> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ACCENT: Record<ToastKind, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  info: "text-zinc-300",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    window.clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, kind });
    if (kind === "success") void notifyHaptic("success");
    else if (kind === "error") void notifyHaptic("error");
    timerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5rem+var(--safe-bottom))] z-[60] max-w-[90vw]"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 text-zinc-100 shadow-lg shadow-black/30 border border-zinc-700/60">
              {(() => {
                const Icon = ICONS[toast.kind];
                return <Icon size={15} className={ACCENT[toast.kind]} />;
              })()}
              <span className="text-xs font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // Fallback silencioso fora do provider (ex.: testes isolados de um primitivo).
  return ctx ?? { show: () => {} };
}

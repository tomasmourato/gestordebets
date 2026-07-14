// Painel lateral (drawer) de conta: mostra os detalhes do utilizador
// autenticado (avatar, username, email, ID, data de registo) e concentra a
// ação de terminar sessão. Abre a partir do avatar no cabeçalho.

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogOut, Copy, Check, Mail, Fingerprint, CalendarDays, AtSign, AlertCircle } from "lucide-react";
import { CurrentUser, fetchCurrentUser, SessionExpiredError } from "../lib/authApi";
import { Language } from "../types";

interface AccountPanelProps {
  open: boolean;
  /** Utilizador em cache (localStorage) — mostrado de imediato enquanto o /me carrega. */
  user: { id: string; username: string; email: string } | null;
  language: Language;
  t: (key: string) => string;
  onClose: () => void;
  onLogout: () => void;
  onSessionExpired: () => void;
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <span className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
        <p className={`text-xs text-slate-800 dark:text-slate-100 mt-0.5 break-all ${mono ? "font-mono" : "font-medium"}`}>
          {value}
        </p>
      </div>
      {action}
    </div>
  );
}

export default function AccountPanel({
  open,
  user,
  language,
  t,
  onClose,
  onLogout,
  onSessionExpired,
}: AccountPanelProps) {
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ao abrir, refresca os dados a partir do servidor (traz o created_at, que
  // não existe na cache local). O painel mostra a cache entretanto.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadError(false);
    fetchCurrentUser()
      .then((fresh) => {
        if (!cancelled) setProfile(fresh);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof SessionExpiredError) onSessionExpired();
        else setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const shown = profile ?? user;

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat(language === "en" ? "en-GB" : "pt-PT", { dateStyle: "long" }).format(
        new Date(profile.created_at)
      )
    : null;

  const copyId = async () => {
    if (!shown?.id) return;
    try {
      await navigator.clipboard.writeText(shown.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível (http/permissões) — sem feedback, sem crash */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("account.title")}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Drawer lateral */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="absolute right-0 top-0 h-full w-full max-w-xs bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                {t("account.title")}
              </h3>
              <button
                onClick={onClose}
                aria-label={t("account.close")}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Avatar + identidade */}
              <div className="flex flex-col items-center text-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                  {shown?.username?.slice(0, 2) || "?"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{shown?.username || "—"}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{shown?.email || ""}</p>
                </div>
              </div>

              {loadError && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 rounded-md flex items-center gap-2 text-[11px] font-medium">
                  <AlertCircle size={13} className="shrink-0" />
                  {t("account.loadError")}
                </div>
              )}

              {/* Detalhes da conta */}
              <div className="space-y-2">
                <DetailRow icon={<AtSign size={14} />} label={t("account.username")} value={shown?.username || "—"} />
                <DetailRow icon={<Mail size={14} />} label={t("account.email")} value={shown?.email || "—"} />
                <DetailRow
                  icon={<Fingerprint size={14} />}
                  label={t("account.userId")}
                  value={shown?.id || "—"}
                  mono
                  action={
                    <button
                      onClick={copyId}
                      title={copied ? t("account.copied") : t("account.copyId")}
                      aria-label={t("account.copyId")}
                      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  }
                />
                {memberSince && (
                  <DetailRow icon={<CalendarDays size={14} />} label={t("account.memberSince")} value={memberSince} />
                )}
              </div>
            </div>

            {/* Terminar sessão */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={14} /> {t("account.logout")}
              </button>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                {t("account.logoutHint")}
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

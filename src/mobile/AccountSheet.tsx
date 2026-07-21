// src/mobile/AccountSheet.tsx
// Versão mobile do painel de conta: em vez do drawer lateral (AccountPanel),
// abre numa bottom sheet nativa-feel. Reutiliza fetchCurrentUser e as mesmas
// chaves i18n. Mostra identidade, detalhes e terminar sessão.

import { useEffect, useState } from "react";
import { LogOut, Copy, Moon, Sun } from "lucide-react";
import { CurrentUser, fetchCurrentUser, SessionExpiredError } from "../lib/authApi";
import { Language } from "../types";
import { BottomSheet, ListGroup, ListItem, Pressable, useToast } from "./ui";

interface AccountSheetProps {
  open: boolean;
  user: { id: string; username: string; email: string } | null;
  language: Language;
  t: (key: string) => string;
  isDark: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
  onLogout: () => void;
  onSessionExpired: () => void;
}

export function AccountSheet({
  open,
  user,
  language,
  t,
  isDark,
  onToggleTheme,
  onClose,
  onLogout,
  onSessionExpired,
}: AccountSheetProps) {
  const toast = useToast();
  const [profile, setProfile] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchCurrentUser()
      .then((fresh) => {
        if (!cancelled) setProfile(fresh);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof SessionExpiredError) onSessionExpired();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shown = profile ?? user;

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat(language === "en" ? "en-GB" : "pt-PT", { dateStyle: "long" }).format(
        new Date(profile.created_at),
      )
    : null;

  const copyId = async () => {
    if (!shown?.id) return;
    try {
      await navigator.clipboard.writeText(shown.id);
      toast.show(t("account.copied"), "success");
    } catch {
      /* clipboard indisponível — sem crash */
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t("account.title")}>
      {/* Identidade */}
      <div className="flex flex-col items-center text-center gap-2 pb-4">
        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm">
          {shown?.username?.slice(0, 2) || "?"}
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{shown?.username || "—"}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{shown?.email || ""}</p>
        </div>
      </div>

      {/* Detalhes */}
      <ListGroup>
        <ListItem title={t("account.username")} trailing={shown?.username || "—"} />
        <ListItem title={t("account.email")} trailing={<span className="max-w-[55vw] truncate inline-block align-bottom">{shown?.email || "—"}</span>} />
        <ListItem
          title={t("account.userId")}
          subtitle={<span className="font-mono break-all">{shown?.id || "—"}</span>}
          trailing={
            <Pressable as="button" onClick={copyId} aria-label={t("account.copyId")} className="p-2 -m-1 text-zinc-400">
              <Copy size={15} />
            </Pressable>
          }
        />
        {memberSince && <ListItem title={t("account.memberSince")} trailing={memberSince} />}
      </ListGroup>

      {/* Tema */}
      <div className="mt-3">
        <ListGroup>
          <ListItem
            icon={isDark ? Sun : Moon}
            title={isDark ? "Tema claro" : "Tema escuro"}
            onClick={onToggleTheme}
          />
        </ListGroup>
      </div>

      {/* Terminar sessão */}
      <div className="mt-4">
        <Pressable
          as="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold"
        >
          <LogOut size={16} /> {t("account.logout")}
        </Pressable>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed mt-2">
          {t("account.logoutHint")}
        </p>
      </div>
    </BottomSheet>
  );
}

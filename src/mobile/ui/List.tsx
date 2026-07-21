// src/mobile/ui/List.tsx
// Blocos de construção touch-first: cabeçalho de secção, cartão e item de
// lista. Alvos de toque generosos (≥48px), numerais mono à direita e estilo
// terminal esmeralda/zinc coerente com a marca.

import React from "react";
import { ChevronRight } from "lucide-react";
import { Pressable } from "./Pressable";

/** Título de secção (estilo definições Android). */
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500 font-mono">
      {children}
    </p>
  );
}

/** Cartão de superfície — contentor base dos ecrãs mobile. */
export function MobileCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4";
  if (onClick) {
    return (
      <Pressable onClick={onClick} className={`${base} ${className}`}>
        {children}
      </Pressable>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}

interface ListItemProps {
  /** Ícone à esquerda (opcional). */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Conteúdo à direita (valor, badge). Substitui o chevron se presente. */
  trailing?: React.ReactNode;
  onClick?: () => void;
  /** Mostra o chevron de navegação à direita. */
  chevron?: boolean;
  destructive?: boolean;
}

/** Linha de lista tocável, agrupável dentro de um <ListGroup>. */
export function ListItem({
  icon: Icon,
  title,
  subtitle,
  trailing,
  onClick,
  chevron = false,
  destructive = false,
}: ListItemProps) {
  const content = (
    <div className="flex items-center gap-3 min-h-[52px] px-4 py-2.5">
      {Icon && (
        <span className={`shrink-0 ${destructive ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
          <Icon size={18} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${destructive ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{subtitle}</div>
        )}
      </div>
      {trailing != null ? (
        <div className="shrink-0 text-sm font-mono text-zinc-600 dark:text-zinc-300">{trailing}</div>
      ) : chevron ? (
        <ChevronRight size={18} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <Pressable onClick={onClick} className="active:bg-zinc-100 dark:active:bg-zinc-800/60">
        {content}
      </Pressable>
    );
  }
  return content;
}

/** Agrupa vários <ListItem> num cartão com separadores. */
export function ListGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

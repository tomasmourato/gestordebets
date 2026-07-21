// src/mobile/ui/Pressable.tsx
// Wrapper de toque com feedback físico: encolhe ligeiramente ao premir e
// dispara um haptic leve. É a base de botões, cards e itens de lista da UI
// mobile, para tudo reagir ao dedo como numa app nativa.

import React from "react";
import { motion } from "motion/react";
import { tapHaptic } from "../../lib/haptics";

interface PressableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Desliga o feedback tátil (ex.: em áreas não interativas). */
  haptic?: boolean;
  /** Intensidade do encolher ao premir. */
  scale?: number;
  disabled?: boolean;
  as?: "div" | "button";
}

export function Pressable({
  children,
  haptic = true,
  scale = 0.97,
  disabled = false,
  onClick,
  className = "",
  as = "div",
  ...rest
}: PressableProps) {
  const Comp = as === "button" ? motion.button : motion.div;

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    if (disabled) return;
    if (haptic) void tapHaptic("light");
    onClick?.(e as React.MouseEvent<HTMLDivElement>);
  };

  return (
    <Comp
      whileTap={disabled ? undefined : { scale }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
      className={`select-none ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"} ${className}`}
      {...(rest as any)}
    >
      {children}
    </Comp>
  );
}

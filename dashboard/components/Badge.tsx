import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "win" | "loss" | "tie" | "playoff" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const styles = {
    default: "bg-white/10 text-ink",
    win: "bg-accent-green/20 text-accent-green",
    loss: "bg-accent-red/20 text-accent-red",
    tie: "bg-ink-dim/20 text-ink-dim",
    playoff: "bg-accent/20 text-accent",
    warning: "bg-accent-gold/15 text-accent-gold",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

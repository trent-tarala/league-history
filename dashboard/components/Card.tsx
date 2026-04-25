import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { InfoIcon } from "./InfoIcon";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Optional tooltip body shown next to the title. */
  info?: ReactNode;
  className?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, subtitle, info, className, children, actions }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/5 bg-bg-card/80 backdrop-blur",
        "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]",
        "p-5 min-w-0",
        className
      )}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-ink">
                {title}
                {info && <InfoIcon label={info} />}
              </h2>
            )}
            {subtitle && <p className="text-xs text-ink-dim mt-1">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent,
  info,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "gold" | "green" | "red" | "blue" | "purple";
  /** Optional tooltip body shown next to the label. */
  info?: ReactNode;
}) {
  const accentColor =
    accent === "gold"
      ? "text-accent-gold"
      : accent === "green"
        ? "text-accent-green"
        : accent === "red"
          ? "text-accent-red"
          : accent === "blue"
            ? "text-accent-blue"
            : accent === "purple"
              ? "text-accent"
              : "text-ink";
  return (
    <div className="rounded-xl border border-white/5 bg-bg-subtle/60 px-4 py-3 h-full flex flex-col min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
        {info && <InfoIcon label={info} />}
      </div>
      <div className={cn("text-2xl font-semibold mt-1", accentColor)}>
        {value}
      </div>
      {hint && <div className="text-xs text-ink-dim mt-0.5">{hint}</div>}
    </div>
  );
}

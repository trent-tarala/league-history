"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Side = "top" | "bottom";

const TIP_OFFSET = 8;
const VIEWPORT_PAD = 8;
const MAX_WIDTH_PX = 288;

interface InfoIconProps {
  /** Tooltip body. Plain string or rich ReactNode. */
  label: ReactNode;
  /** Preferred side to anchor the tooltip on. Auto-flips if it would clip. */
  side?: Side;
  /** Optional aria-label override for screen readers. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Small "?" badge that opens a tooltip on hover/focus.
 *
 * The tooltip itself is portaled into <body> with position: fixed, so it
 * always escapes any overflow:hidden / overflow-x-auto ancestors (e.g. the
 * scroll wrapper around <StatTable>).
 */
export function InfoIcon({
  label,
  side = "top",
  ariaLabel,
  className,
}: InfoIconProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    placedSide: Side;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const id = useId();
  const a11y = ariaLabel ?? (typeof label === "string" ? label : "More info");

  useEffect(() => {
    setMounted(true);
  }, []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;

    const tRect = trigger.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let placedSide: Side = side;
    if (side === "top" && tRect.top - tipRect.height - TIP_OFFSET < VIEWPORT_PAD) {
      placedSide = "bottom";
    } else if (
      side === "bottom" &&
      tRect.bottom + tipRect.height + TIP_OFFSET > vh - VIEWPORT_PAD
    ) {
      placedSide = "top";
    }

    const top =
      placedSide === "top"
        ? tRect.top - tipRect.height - TIP_OFFSET
        : tRect.bottom + TIP_OFFSET;

    const triggerCenter = tRect.left + tRect.width / 2;
    const halfTip = tipRect.width / 2;
    const minLeft = VIEWPORT_PAD;
    const maxLeft = vw - tipRect.width - VIEWPORT_PAD;
    const left = Math.max(minLeft, Math.min(maxLeft, triggerCenter - halfTip));

    setPos({ left, top, placedSide });
  }, [side]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const handler = () => reposition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, reposition]);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") hide();
  };

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-label={a11y}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={onKeyDown}
        className={cn(
          "inline-flex items-center justify-center align-middle",
          "w-3.5 h-3.5 rounded-full",
          "bg-white/10 text-ink-faint hover:bg-white/20 hover:text-ink-dim",
          "text-[9px] font-bold leading-none cursor-help select-none",
          "ml-1 outline-none focus-visible:ring-1 focus-visible:ring-accent",
          className
        )}
      >
        ?
      </span>
      {mounted && open
        ? createPortal(
            <div
              ref={tipRef}
              id={id}
              role="tooltip"
              style={{
                position: "fixed",
                left: pos?.left ?? -9999,
                top: pos?.top ?? -9999,
                maxWidth: MAX_WIDTH_PX,
                visibility: pos ? "visible" : "hidden",
              }}
              className={cn(
                "pointer-events-none z-[1000]",
                "rounded-lg bg-bg/95 ring-1 ring-white/10 px-3 py-2",
                "text-[11px] text-ink-dim font-normal normal-case tracking-normal leading-snug text-left",
                "shadow-xl backdrop-blur-md"
              )}
            >
              {label}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

interface InfoTipProps {
  label: ReactNode;
  children: ReactNode;
  side?: Side;
  className?: string;
}

/**
 * Wrap an existing trigger element (label, header) so it shows the tooltip
 * on hover/focus. Internally just a small wrapper around <InfoIcon>'s
 * positioning logic — re-use only when you need the trigger to be something
 * other than the "?" badge.
 */
export function InfoTip({ label, children, side = "top", className }: InfoTipProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {children}
      <InfoIcon label={label} side={side} />
    </span>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/owners/", label: "Owners" },
  { href: "/leaderboards/", label: "Leaderboards" },
  { href: "/records/", label: "Record Book" },
  { href: "/head-to-head/", label: "Head-to-Head" },
  { href: "/seasons/", label: "Seasons" },
  { href: "/streaks/", label: "Streaks" },
  { href: "/awards/", label: "Awards" },
  { href: "/luck/", label: "Luck" },
];

// Match active link by exact path for "/" and prefix-match otherwise so that
// nested routes (e.g. /owners/123 or /seasons/2024) keep the parent tab lit.
function isActive(href: string, pathname: string): boolean {
  const normalized = href.replace(/\/$/, "") || "/";
  if (normalized === "/") return pathname === "/" || pathname === "";
  return pathname === normalized || pathname.startsWith(normalized + "/");
}

const linkBase =
  "no-underline hover:no-underline transition-colors rounded-lg";
const linkActive = "bg-accent/15 text-ink ring-1 ring-accent/40";
const linkInactive = "text-ink-dim hover:text-ink hover:bg-white/5";

export function Nav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes (including hash/search
  // updates). Tapping a link doesn't unmount this component, so we have to
  // react to pathname explicitly.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock background scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-bg/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="font-semibold tracking-tight text-ink no-underline hover:no-underline"
          >
            Venice Idiots
          </Link>

          <nav className="hidden lg:flex flex-wrap gap-1 text-sm ml-auto">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    linkBase,
                    "px-3 py-1.5",
                    active ? linkActive : linkInactive
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="lg:hidden ml-auto inline-flex items-center justify-center w-10 h-10 rounded-lg text-ink hover:bg-white/5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/*
        IMPORTANT: this overlay must NOT be a descendant of the sticky header
        above. The header has `backdrop-blur` (a backdrop-filter), which creates
        a containing block for `position: fixed` children — that would clip the
        overlay to the header's box on mobile. Rendering it as a sibling lets
        `fixed inset-0` actually fill the viewport.
      */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-bg flex flex-col lg:hidden h-[100dvh]"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-white/5 shrink-0">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="font-semibold tracking-tight text-ink no-underline hover:no-underline"
            >
              Venice Idiots
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-ink hover:bg-white/5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href, pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    linkBase,
                    "px-4 py-3 text-base font-medium",
                    active ? linkActive : linkInactive
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

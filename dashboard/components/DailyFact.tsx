"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface DailyFactItem {
  id: string;
  headline: string;
  body: ReactNode;
}

interface DailyFactProps {
  facts: DailyFactItem[];
}

// Number of whole UTC days since the Unix epoch. Keeps the rotation aligned
// across timezones so every visitor sees the same fact on the same calendar
// day (UTC). Local-day rotation is intentionally avoided to keep the cache
// behavior predictable and the joke synced for league mates in different TZs.
function daysSinceEpochUTC(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000
  );
}

export function DailyFact({ facts }: DailyFactProps) {
  // Render fact[0] on the server so SSR HTML has real content (no layout
  // shift). After hydration, swap to today's fact via useEffect so each day
  // shows a different one regardless of when the site was last built.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(daysSinceEpochUTC(new Date()) % facts.length);
  }, [facts.length]);

  if (facts.length === 0) return null;
  const fact = facts[index];

  return (
    <section className="rounded-2xl border border-accent/30 bg-accent/[0.06] backdrop-blur shadow-[0_4px_24px_-8px_rgba(124,92,255,0.35)] p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        Did You Know?
      </div>
      <h2 className="text-base font-semibold text-ink mt-1">{fact.headline}</h2>
      <p className="text-sm text-ink-dim mt-2 leading-relaxed">{fact.body}</p>
    </section>
  );
}

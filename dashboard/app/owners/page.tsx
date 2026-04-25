import Link from "next/link";
import { Card } from "@/components/Card";
import { OwnerSwatch } from "@/components/OwnerLink";
import { Badge } from "@/components/Badge";
import { getCareerProfiles } from "@/lib/aggregations";
import { fmtPct, fmtRecord, ownerSlug } from "@/lib/constants";

export default function OwnersPage() {
  const profiles = Array.from(getCareerProfiles().values()).sort(
    (a, b) => b.winPct - a.winPct
  );
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Owners</h1>
        <p className="text-ink-dim text-sm mt-1">
          {profiles.length} owners have appeared in the league. Click anyone for a
          full career profile.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Link
            key={p.owner.owner_id}
            href={`/owners/${ownerSlug(p.owner.owner_id)}/`}
            className="block rounded-xl border border-white/5 bg-bg-card/70 p-4 hover:border-white/10 hover:bg-bg-card transition no-underline hover:no-underline"
          >
            <div className="flex items-center gap-3">
              <OwnerSwatch ownerId={p.owner.owner_id} name={p.owner.display_name} size={42} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink truncate">
                  {p.owner.display_name}
                </div>
                <div className="text-[11px] text-ink-faint truncate">
                  {p.owner.first_seen_year}–{p.owner.last_seen_year} • {p.seasons} seasons
                </div>
              </div>
              {p.championships > 0 && (
                <Badge variant="warning">{p.championships}× champ</Badge>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Record</div>
                <div className="text-sm text-ink font-semibold">
                  {fmtRecord(p.wins, p.losses, p.ties)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Win %</div>
                <div className="text-sm text-ink font-semibold">{fmtPct(p.winPct)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-ink-faint">Playoffs</div>
                <div className="text-sm text-ink font-semibold">
                  {p.playoffAppearances}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Card className="bg-bg-card/40">
        <p className="text-xs text-ink-dim">
          Owners are tracked by stable ESPN account IDs, so co-managed teams and
          name changes are handled correctly. Display names use the most recent
          name we&apos;ve seen.
        </p>
      </Card>
    </div>
  );
}

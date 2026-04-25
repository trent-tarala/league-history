import Link from "next/link";
import { OwnerLink } from "@/components/OwnerLink";
import { getSeasonChampions } from "@/lib/aggregations";
import { fmtNum } from "@/lib/constants";

export default function SeasonsIndexPage() {
  const champs = getSeasonChampions().sort((a, b) => b.year - a.year);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Seasons</h1>
        <p className="text-ink-dim text-sm mt-1">
          Pick a season for the full standings, weekly heatmap, matchup log, and draft board.
        </p>
      </header>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {champs.map((c) => (
          <Link
            key={c.year}
            href={`/seasons/${c.year}/`}
            className="block rounded-2xl border border-white/5 bg-bg-card/70 p-5 hover:border-white/10 hover:bg-bg-card no-underline hover:no-underline"
          >
            <div className="text-2xl font-semibold text-ink">{c.year}</div>
            {c.champion && (
              <div className="text-sm text-ink-dim mt-3">
                Champion:{" "}
                <span className="text-ink">
                  <OwnerLink ownerId={c.champion.owner_id} name={c.champion.owner} />
                </span>
              </div>
            )}
            {c.pointsLeader && (
              <div className="text-xs text-ink-faint mt-1">
                PF leader: {c.pointsLeader.owner} ({fmtNum(c.pointsLeader.points_for, 0)})
              </div>
            )}
            {c.highestWeek && (
              <div className="text-xs text-ink-faint mt-1">
                Highest week: {fmtNum(c.highestWeek.score)} • {c.highestWeek.ownerName} W{c.highestWeek.week}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

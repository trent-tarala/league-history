import Link from "next/link";
import { cn } from "@/lib/cn";
import { getOwners } from "@/lib/data";
import { getH2HCell } from "@/lib/aggregations";
import { fmtPct, ownerSlug } from "@/lib/constants";

function cellClasses(games: number, wins: number, losses: number): string {
  if (games === 0) return "";
  // Bright flat states — green (winning), yellow (tied), red (losing).
  if (wins > losses) {
    return "bg-accent-green/75 ring-1 ring-inset ring-accent-green/40";
  }
  if (wins < losses) {
    return "bg-accent-red/75 ring-1 ring-inset ring-accent-red/40";
  }
  return "bg-accent-gold/80 ring-1 ring-inset ring-accent-gold/50";
}

export function HeadToHeadMatrix() {
  const owners = getOwners();
  return (
    <div className="overflow-x-auto min-w-0 -mx-3">
      <table className="w-full table-fixed text-xs border-separate border-spacing-0.5 min-w-[860px]">
        <colgroup>
          <col className="w-[120px]" />
          {owners.map((o) => (
            <col key={o.owner_id} className="w-[56px]" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-bg-card px-2 py-1 text-left text-ink-faint align-bottom h-28">
              Owner ↓ vs →
            </th>
            {owners.map((o) => (
              <th
                key={o.owner_id}
                className="relative p-0 align-bottom h-28 text-ink-faint font-medium"
              >
                <div
                  className="absolute bottom-1 left-1/2 origin-bottom-left -rotate-45 whitespace-nowrap text-[10px] leading-none pl-0.5"
                  title={o.display_name}
                >
                  {o.display_name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {owners.map((row) => (
            <tr key={row.owner_id}>
              <td className="sticky left-0 z-10 bg-bg-card px-2 py-1 text-ink whitespace-nowrap text-left text-[11px]">
                {row.display_name}
              </td>
              {owners.map((col) => {
                if (row.owner_id === col.owner_id) {
                  return (
                    <td
                      key={col.owner_id}
                      className="bg-white/[0.06] rounded text-center text-ink-faint h-[44px]"
                    >
                      —
                    </td>
                  );
                }
                const cell = getH2HCell(row.owner_id, col.owner_id);
                const games = cell?.games ?? 0;
                const wins = cell?.wins ?? 0;
                const losses = cell?.losses ?? 0;
                const ties = cell?.ties ?? 0;
                const winPct = cell?.winPct ?? 0;
                const colorClass = cellClasses(games, wins, losses);
                const isTied = games > 0 && wins === losses;
                return (
                  <td
                    key={col.owner_id}
                    className={cn("rounded text-center h-[44px]", colorClass)}
                  >
                    {games > 0 ? (
                      <Link
                        href={`/head-to-head/${ownerSlug(row.owner_id)}/${ownerSlug(col.owner_id)}/`}
                        className={cn(
                          "block w-full h-full flex items-center justify-center no-underline hover:no-underline hover:brightness-110 text-[11px] font-bold leading-none",
                          isTied ? "text-bg" : "text-white"
                        )}
                        title={`${row.display_name} vs ${col.display_name}: ${wins}-${losses}${ties > 0 ? `-${ties}` : ""} (${fmtPct(winPct)})`}
                      >
                        {wins}-{losses}
                        {ties > 0 ? `-${ties}` : ""}
                      </Link>
                    ) : (
                      <span className="text-ink-faint text-[10px]">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-ink-faint mt-3">
        Read row vs column. Cell color:{" "}
        <span className="text-accent-green">green</span> = winning record,{" "}
        <span className="text-accent-red">red</span> = losing record,{" "}
        <span className="text-accent-gold">yellow</span> = tied series
        (equal wins and losses). Click any cell to see every game between
        that pair.
      </p>
    </div>
  );
}

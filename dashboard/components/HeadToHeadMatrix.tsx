import Link from "next/link";
import { cn } from "@/lib/cn";
import { getOwners } from "@/lib/data";
import { getH2HCell } from "@/lib/aggregations";
import { fmtPct, ownerSlug } from "@/lib/constants";

function cellColor(games: number, wins: number, losses: number): string {
  if (games === 0) return "transparent";
  // Three flat states, no intensity scaling: green (winning record),
  // yellow (tied), red (losing record). Every cell within a category looks
  // identical so the matrix is easy to read at a glance.
  if (wins > losses) return "rgba(61, 220, 132, 0.45)";
  if (wins < losses) return "rgba(255, 93, 108, 0.45)";
  return "rgba(245, 196, 81, 0.45)";
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
                const bg = cellColor(games, wins, losses);
                return (
                  <td
                    key={col.owner_id}
                    className={cn("rounded text-center h-[44px]")}
                    style={{ backgroundColor: bg }}
                  >
                    {games > 0 ? (
                      <Link
                        href={`/head-to-head/${ownerSlug(row.owner_id)}/${ownerSlug(col.owner_id)}/`}
                        className="block w-full h-full flex flex-col items-center justify-center text-ink no-underline hover:text-accent hover:no-underline"
                        title={`${row.display_name} vs ${col.display_name}: ${wins}-${losses}${ties > 0 ? `-${ties}` : ""} (${fmtPct(winPct)})`}
                      >
                        <span className="text-[10px] font-semibold leading-none">
                          {wins}-{losses}
                          {ties > 0 ? `-${ties}` : ""}
                        </span>
                        <span className="text-[9px] text-ink-faint leading-none mt-0.5">
                          {fmtPct(winPct, 0)}
                        </span>
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

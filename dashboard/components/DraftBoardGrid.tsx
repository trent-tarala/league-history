import { cn } from "@/lib/cn";
import { colorForOwner } from "@/lib/constants";
import type { DraftPick, Standing } from "@/lib/types";

interface DraftBoardGridProps {
  picks: DraftPick[];
  standings: Standing[];
}

export function DraftBoardGrid({ picks, standings }: DraftBoardGridProps) {
  if (picks.length === 0) {
    return <div className="text-sm text-ink-dim">No draft data for this season.</div>;
  }
  const teamsInOrder = standings
    .filter((s) => s.team_id !== null)
    .sort((a, b) => (a.team_id ?? 0) - (b.team_id ?? 0));

  // Detect snake by team_ids in round 1 vs round 2.
  const round1 = picks.filter((p) => p.round === 1).sort(
    (a, b) => (a.round_pick ?? 0) - (b.round_pick ?? 0)
  );
  const draftSlotByTeam = new Map<number, number>();
  round1.forEach((p, idx) => {
    if (p.team_id != null) draftSlotByTeam.set(p.team_id, idx);
  });

  const teamCount = round1.length;
  const maxRound = Math.max(...picks.map((p) => p.round ?? 0));

  // Build [round][slot] grid
  const grid: (DraftPick | null)[][] = Array.from({ length: maxRound }, () =>
    Array.from({ length: teamCount }, () => null)
  );

  for (const pick of picks) {
    if (pick.round == null || pick.round_pick == null || pick.team_id == null)
      continue;
    const slot = (pick.round_pick - 1);
    if (slot < 0 || slot >= teamCount) continue;
    grid[pick.round - 1][slot] = pick;
  }

  // Header row uses round-1 team order (the canonical draft order).
  const headerTeamIds = round1
    .map((p) => p.team_id)
    .filter((x): x is number => x != null);
  const headerStandings = headerTeamIds.map((id) =>
    teamsInOrder.find((s) => s.team_id === id)
  );

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="px-2 text-ink-faint text-left">Rd</th>
            {headerStandings.map((s, idx) => (
              <th
                key={idx}
                className="px-2 text-ink-faint text-left font-medium min-w-[110px]"
              >
                <div className="text-ink truncate max-w-[110px]">
                  {s?.owner ?? "—"}
                </div>
                <div className="text-[10px] text-ink-faint truncate max-w-[110px]">
                  {s?.team_name ?? ""}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rIdx) => (
            <tr key={rIdx}>
              <td className="text-ink-faint px-2 text-center align-middle">
                {rIdx + 1}
              </td>
              {row.map((pick, cIdx) => {
                if (!pick) {
                  return <td key={cIdx} className="bg-white/[0.02] rounded px-2 py-1.5" />;
                }
                const owner = pick.owner_id;
                const swatch = owner ? colorForOwner(owner) : "#5f6b8a";
                return (
                  <td
                    key={cIdx}
                    className="rounded px-2 py-1.5 text-ink"
                    style={{
                      backgroundColor: swatch + "26",
                      borderLeft: `3px solid ${swatch}`,
                    }}
                    title={`${pick.player_name} - Round ${pick.round}, Pick ${pick.round_pick}`}
                  >
                    <div className="font-medium leading-tight truncate max-w-[110px]">
                      {pick.player_name}
                    </div>
                    <div className="text-[10px] text-ink-faint">
                      {pick.round}.{pick.round_pick}
                      {pick.bid_amount > 0 && ` • $${pick.bid_amount}`}
                      {pick.keeper_status && " • Keeper"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Suppress unused warning for cn (kept available if you want to extend styling).
void cn;

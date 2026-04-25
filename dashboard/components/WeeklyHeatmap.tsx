import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/constants";
import type { Standing } from "@/lib/types";
import { OwnerLink } from "./OwnerLink";

interface WeeklyHeatmapProps {
  standings: Standing[];
}

/** Color for a single weekly score using a min..max scale. */
function colorFor(score: number, min: number, max: number): string {
  if (max === min) return "rgba(124, 92, 255, 0.25)";
  const t = Math.min(1, Math.max(0, (score - min) / (max - min)));
  // gradient from cool (low) to warm (high)
  // low: #243056   mid: #7c5cff   high: #f5c451
  if (t < 0.5) {
    const u = t / 0.5;
    return `rgb(${Math.round(36 + (124 - 36) * u)}, ${Math.round(48 + (92 - 48) * u)}, ${Math.round(86 + (255 - 86) * u)})`;
  }
  const u = (t - 0.5) / 0.5;
  return `rgb(${Math.round(124 + (245 - 124) * u)}, ${Math.round(92 + (196 - 92) * u)}, ${Math.round(255 + (81 - 255) * u)})`;
}

export function WeeklyHeatmap({ standings }: WeeklyHeatmapProps) {
  if (standings.length === 0) return null;
  const maxWeek = Math.max(0, ...standings.map((s) => s.weekly_scores.length));
  const allScores = standings.flatMap((s) => s.weekly_scores).filter((v) => v > 0);
  if (allScores.length === 0) return null;
  const minScore = Math.min(...allScores);
  const maxScore = Math.max(...allScores);
  const sorted = [...standings].sort(
    (a, b) => (a.final_standing ?? 999) - (b.final_standing ?? 999)
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-left text-ink-faint pr-2 sticky left-0 bg-bg-card z-10">
              Owner
            </th>
            {Array.from({ length: maxWeek }, (_, i) => (
              <th
                key={i}
                className="text-center text-ink-faint font-medium w-9"
              >
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.owner_id ?? row.team_id}>
              <td className="pr-2 text-ink whitespace-nowrap sticky left-0 bg-bg-card z-10">
                <OwnerLink ownerId={row.owner_id} name={row.owner} />
              </td>
              {Array.from({ length: maxWeek }, (_, i) => {
                const score = row.weekly_scores[i] ?? 0;
                const outcome = row.weekly_outcomes[i] ?? "";
                if (score === 0) {
                  return (
                    <td key={i} className="w-9 h-7 rounded bg-white/[0.02]" />
                  );
                }
                return (
                  <td
                    key={i}
                    className={cn(
                      "w-9 h-7 rounded text-center text-[10px] font-medium",
                      outcome === "W" && "ring-1 ring-accent-green/40",
                      outcome === "L" && "ring-1 ring-accent-red/30"
                    )}
                    style={{
                      backgroundColor: colorFor(score, minScore, maxScore),
                      color: "#0b1220",
                    }}
                    title={`Week ${i + 1}: ${fmtNum(score)} (${outcome || "-"})`}
                  >
                    {Math.round(score)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-ink-faint">
        <span>Low</span>
        <div
          className="h-2 w-32 rounded"
          style={{
            background:
              "linear-gradient(to right, rgb(36,48,86), rgb(124,92,255), rgb(245,196,81))",
          }}
        />
        <span>High</span>
        <span className="ml-4">Green outline = win, red = loss</span>
      </div>
    </div>
  );
}

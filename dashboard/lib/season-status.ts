import { getSeason, getYears } from "./data";
import { isPlayoffMatchup } from "./constants";
import type { Season, Standing } from "./types";

export type SeasonStatus = "in_progress" | "playoffs" | "complete";

function getPlayedRegularWeeks(season: Season): Set<number> {
  const weeks = new Set<number>();
  for (const m of season.matchups) {
    if (m.matchup_type !== "REGULAR") continue;
    if (m.home_score > 0 || m.away_score > 0) weeks.add(m.week);
  }
  return weeks;
}

/** Scheduled regular-season length (excludes playoffs). */
export function getRegularSeasonWeekCount(year: number | string): number {
  const season = getSeason(year);
  if (!season) return 0;

  const playoffWeeks = season.matchups
    .filter((m) => isPlayoffMatchup(m.matchup_type))
    .map((m) => m.week);
  if (playoffWeeks.length > 0) {
    return Math.min(...playoffWeeks) - 1;
  }

  const row = season.standings[0];
  if (row?.weekly_outcomes?.includes("U")) {
    return row.weekly_outcomes.length;
  }

  const played = getPlayedRegularWeeks(season);
  return played.size > 0 ? Math.max(...played) : 0;
}

export function getWeeksPlayed(year: number | string): number {
  const season = getSeason(year);
  if (!season) return 0;
  return getPlayedRegularWeeks(season).size;
}

export function isRegularSeasonComplete(year: number | string): boolean {
  const season = getSeason(year);
  if (!season) return false;
  const total = getRegularSeasonWeekCount(year);
  if (total === 0) return false;
  const played = getPlayedRegularWeeks(season);
  for (let w = 1; w <= total; w++) {
    if (!played.has(w)) return false;
  }
  return true;
}

function isChampionshipComplete(season: Season): boolean {
  const played = season.matchups.filter(
    (m) =>
      m.matchup_type === "WINNERS_BRACKET" &&
      (m.home_score > 0 || m.away_score > 0)
  );
  if (played.length === 0) return false;

  const maxWeek = Math.max(...played.map((m) => m.week));
  const finalGames = played.filter((m) => m.week === maxWeek);
  const seriesKeys = new Set(
    finalGames.map(
      (m) => `${m.home_owner_id ?? "?"}|${m.away_owner_id ?? "?"}`
    )
  );
  return seriesKeys.size === 1;
}

export function getSeasonStatus(year: number | string): SeasonStatus {
  const season = getSeason(year);
  if (!season) return "in_progress";

  if (isChampionshipComplete(season) && isRegularSeasonComplete(year)) {
    return "complete";
  }

  const hasPlayoffs = season.matchups.some(
    (m) =>
      isPlayoffMatchup(m.matchup_type) &&
      (m.home_score > 0 || m.away_score > 0)
  );
  if (hasPlayoffs) return "playoffs";

  return "in_progress";
}

export function isSeasonComplete(year: number | string): boolean {
  return getSeasonStatus(year) === "complete";
}

export function getCompletedSeasonYears(): number[] {
  return getYears()
    .map(Number)
    .filter((y) => isSeasonComplete(y));
}

export function getInProgressSeasonYears(): number[] {
  return getYears()
    .map(Number)
    .filter((y) => !isSeasonComplete(y));
}

/** Final standings when complete; current W-L-PF order when still playing. */
export function sortSeasonStandings(
  standings: Standing[],
  year: number | string
): Standing[] {
  if (isSeasonComplete(year)) {
    return [...standings].sort(
      (a, b) => (a.final_standing ?? 999) - (b.final_standing ?? 999)
    );
  }
  return [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.points_for !== a.points_for) return b.points_for - a.points_for;
    return (a.owner ?? "").localeCompare(b.owner ?? "");
  });
}

export function seasonStatusLabel(status: SeasonStatus): string {
  if (status === "complete") return "Final";
  if (status === "playoffs") return "Playoffs";
  return "In progress";
}

import rawData from "../../fantasy_league_history.json";
import type {
  LeagueData,
  OwnerId,
  OwnerRegistryEntry,
  Season,
  Standing,
  Matchup,
  DraftPick,
} from "./types";

const data = rawData as unknown as LeagueData;

export function getLeagueId(): number {
  return data.league_id;
}

export function getOwners(): OwnerRegistryEntry[] {
  return Object.values(data.owners).sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );
}

export function getOwner(id: OwnerId): OwnerRegistryEntry | undefined {
  return data.owners[id];
}

export function getOwnerIds(): OwnerId[] {
  return Object.keys(data.owners);
}

export function getYears(): string[] {
  return Object.keys(data.seasons).sort((a, b) => Number(a) - Number(b));
}

export function getSeason(year: number | string): Season | undefined {
  return data.seasons[String(year)];
}

export function getAllStandings(): Standing[] {
  const out: Standing[] = [];
  for (const year of getYears()) {
    const season = data.seasons[year];
    for (const row of season.standings) {
      out.push(row);
    }
  }
  return out;
}

export function getAllMatchups(): Matchup[] {
  const out: Matchup[] = [];
  for (const year of getYears()) {
    const season = data.seasons[year];
    for (const m of season.matchups) {
      out.push(m);
    }
  }
  return out;
}

export function getStandingsByYear(): Map<string, Standing[]> {
  const map = new Map<string, Standing[]>();
  for (const year of getYears()) {
    map.set(year, data.seasons[year].standings);
  }
  return map;
}

/** Helpful for type-stamping a matchup with the season year (not on the row itself). */
export interface MatchupWithYear extends Matchup {
  year: number;
  /** True when this row is part of a multi-week (2+ week) playoff series.
   *  Its `home_score` / `away_score` are aggregate totals across the entire
   *  series, NOT a true single-week score. Single-week leaderboards must
   *  filter these out; H2H/career totals can keep them as one matchup with
   *  the correct aggregate result. */
  multiWeek: boolean;
}

// ESPN models 2-week playoff/consolation matchups as TWO rows (one per week)
// with the SAME total score on each row — e.g. Sam Reese 260.82 appears on
// both 2019 W16 and W17 because that was a single 2-week series scored 260.82
// in aggregate. Iterating raw rows therefore double-counts every multi-week
// playoff game in records, H2H, and career totals. We collapse to one row per
// series here so all cross-season aggregations are correct, and stamp the
// surviving row with `multiWeek = true` so downstream "single-week"
// leaderboards can exclude it. Per-week views that hit `season.matchups`
// directly (e.g. the Matchup Log on a season page) are unaffected by this
// helper, so they still mirror what ESPN shows.
let _allMatchupsWithYearCache: MatchupWithYear[] | null = null;

export function getAllMatchupsWithYear(): MatchupWithYear[] {
  if (_allMatchupsWithYearCache) return _allMatchupsWithYearCache;
  const out: MatchupWithYear[] = [];
  for (const year of getYears()) {
    const yi = Number(year);

    // Pre-pass: count how many times each non-regular (matchup_type, owner
    // pair, score pair) appears within this season. A count > 1 means it's
    // a multi-week playoff series whose aggregate score is repeated per week.
    // Regular-season games never repeat intentionally, and two different
    // regular weeks can legitimately have identical totals, so we skip them.
    const counts = new Map<string, number>();
    const keyOf = (m: Matchup): string =>
      [
        m.matchup_type,
        m.home_owner_id ?? "?",
        m.away_owner_id ?? "?",
        m.home_score.toFixed(2),
        m.away_score.toFixed(2),
      ].join("|");
    for (const m of data.seasons[year].matchups) {
      if (m.matchup_type === "REGULAR") continue;
      const key = keyOf(m);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const seen = new Set<string>();
    for (const m of data.seasons[year].matchups) {
      let multiWeek = false;
      if (m.matchup_type !== "REGULAR") {
        const key = keyOf(m);
        multiWeek = (counts.get(key) ?? 1) > 1;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push({ ...m, year: yi, multiWeek });
    }
  }
  _allMatchupsWithYearCache = out;
  return out;
}

export interface DraftPickWithYear extends DraftPick {
  year: number;
}

export function getAllDraftPicksWithYear(): DraftPickWithYear[] {
  const out: DraftPickWithYear[] = [];
  for (const year of getYears()) {
    const yi = Number(year);
    for (const p of data.seasons[year].draft) {
      out.push({ ...p, year: yi });
    }
  }
  return out;
}

export interface StandingWithOwnerName extends Standing {
  ownerName: string;
}

/** Standing rows keyed by owner_id with the canonical display name attached. */
export function getStandingsWithOwnerName(): StandingWithOwnerName[] {
  return getAllStandings().map((row) => {
    const owner = row.owner_id ? data.owners[row.owner_id] : undefined;
    return {
      ...row,
      ownerName: owner?.display_name ?? row.owner ?? "Unknown",
    };
  });
}

export const LEAGUE_DATA = data;

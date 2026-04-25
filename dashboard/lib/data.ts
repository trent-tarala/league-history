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
}

export function getAllMatchupsWithYear(): MatchupWithYear[] {
  const out: MatchupWithYear[] = [];
  for (const year of getYears()) {
    const yi = Number(year);
    for (const m of data.seasons[year].matchups) {
      out.push({ ...m, year: yi });
    }
  }
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

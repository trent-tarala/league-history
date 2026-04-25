import { getYears, getSeason, getOwners } from "./data";
import { isConsolationMatchup, isPlayoffMatchup } from "./constants";
import type { OwnerId, OwnerRegistryEntry } from "./types";

export interface AllPlayRow {
  year: number;
  owner: OwnerRegistryEntry;
  ownerId: OwnerId;
  actualWins: number;
  actualLosses: number;
  actualTies: number;
  actualWinPct: number;
  allPlayWins: number;
  allPlayLosses: number;
  allPlayTies: number;
  allPlayWinPct: number;
  /** allPlay - actual; positive = unlucky (deserved more wins). */
  luck: number;
}

/** Compute the all-play record per owner per year (your record if every week
 *  you "played" every other team in the league at the same time). */
export function getAllPlayRecords(): AllPlayRow[] {
  const out: AllPlayRow[] = [];
  const ownerById = new Map(getOwners().map((o) => [o.owner_id, o]));

  for (const year of getYears()) {
    const season = getSeason(year);
    if (!season) continue;

    // Build map: owner_id -> per-week score (only regular-season weeks).
    const weeklyScores = new Map<OwnerId, Map<number, number>>();
    for (const m of season.matchups) {
      if (isPlayoffMatchup(m.matchup_type)) continue;
      if (isConsolationMatchup(m.matchup_type)) continue;
      if (m.home_owner_id) {
        const map = weeklyScores.get(m.home_owner_id) ?? new Map<number, number>();
        map.set(m.week, m.home_score);
        weeklyScores.set(m.home_owner_id, map);
      }
      if (m.away_owner_id) {
        const map = weeklyScores.get(m.away_owner_id) ?? new Map<number, number>();
        map.set(m.week, m.away_score);
        weeklyScores.set(m.away_owner_id, map);
      }
    }

    // For each week, rank scores; an all-play win = beating any other owner in that week.
    for (const row of season.standings) {
      if (!row.owner_id) continue;
      let apWins = 0;
      let apLosses = 0;
      let apTies = 0;
      const myScores = weeklyScores.get(row.owner_id);
      if (!myScores) continue;
      for (const [week, myScore] of myScores) {
        for (const [otherId, scoresMap] of weeklyScores) {
          if (otherId === row.owner_id) continue;
          const theirScore = scoresMap.get(week);
          if (theirScore == null) continue;
          if (myScore > theirScore) apWins += 1;
          else if (myScore < theirScore) apLosses += 1;
          else apTies += 1;
        }
      }
      const apGames = apWins + apLosses + apTies;
      const apPct = apGames > 0 ? (apWins + apTies * 0.5) / apGames : 0;
      const games = row.wins + row.losses + row.ties;
      const actualPct = games > 0 ? (row.wins + row.ties * 0.5) / games : 0;
      const owner = ownerById.get(row.owner_id);
      if (!owner) continue;
      out.push({
        year: Number(year),
        owner,
        ownerId: row.owner_id,
        actualWins: row.wins,
        actualLosses: row.losses,
        actualTies: row.ties,
        actualWinPct: actualPct,
        allPlayWins: apWins,
        allPlayLosses: apLosses,
        allPlayTies: apTies,
        allPlayWinPct: apPct,
        luck: apPct - actualPct,
      });
    }
  }
  return out;
}

export interface LuckIndexRow {
  year: number;
  owner: OwnerRegistryEntry;
  pfRank: number;
  finishRank: number;
  delta: number;
}

/** Difference between rank by points-for vs final standing rank.
 *  Positive delta = finished better than your scoring deserved (lucky);
 *  negative = finished worse than your scoring deserved (unlucky). */
export function getLuckIndex(): LuckIndexRow[] {
  const ownerById = new Map(getOwners().map((o) => [o.owner_id, o]));
  const out: LuckIndexRow[] = [];
  for (const year of getYears()) {
    const season = getSeason(year);
    if (!season) continue;
    const byPF = [...season.standings].sort(
      (a, b) => b.points_for - a.points_for
    );
    const pfRanks = new Map<OwnerId, number>();
    byPF.forEach((row, idx) => {
      if (row.owner_id) pfRanks.set(row.owner_id, idx + 1);
    });
    for (const row of season.standings) {
      if (!row.owner_id || row.final_standing == null) continue;
      const owner = ownerById.get(row.owner_id);
      if (!owner) continue;
      const pf = pfRanks.get(row.owner_id);
      if (pf == null) continue;
      out.push({
        year: Number(year),
        owner,
        pfRank: pf,
        finishRank: row.final_standing,
        delta: pf - row.final_standing, // positive = finished better than PF rank
      });
    }
  }
  return out;
}

export interface CursedSeason {
  year: number;
  owner: OwnerRegistryEntry;
  pointsFor: number;
  finalStanding: number;
  totalTeams: number;
}

/** Top PF totals among teams that missed the playoffs. */
export function getCursedSeasons(limit = 10): CursedSeason[] {
  const ownerById = new Map(getOwners().map((o) => [o.owner_id, o]));
  const out: CursedSeason[] = [];
  for (const year of getYears()) {
    const season = getSeason(year);
    if (!season) continue;
    const playoffTeamIds = new Set<OwnerId>();
    for (const m of season.matchups) {
      if (isPlayoffMatchup(m.matchup_type)) {
        if (m.home_owner_id) playoffTeamIds.add(m.home_owner_id);
        if (m.away_owner_id) playoffTeamIds.add(m.away_owner_id);
      }
    }
    for (const row of season.standings) {
      if (!row.owner_id || row.final_standing == null) continue;
      if (playoffTeamIds.has(row.owner_id)) continue;
      const owner = ownerById.get(row.owner_id);
      if (!owner) continue;
      out.push({
        year: Number(year),
        owner,
        pointsFor: row.points_for,
        finalStanding: row.final_standing,
        totalTeams: season.standings.length,
      });
    }
  }
  return out.sort((a, b) => b.pointsFor - a.pointsFor).slice(0, limit);
}

export interface SOSRow {
  year: number;
  owner: OwnerRegistryEntry;
  avgOpponentPF: number;
}

/** Strength of schedule: average per-game PF of every team you faced
 *  in the regular season (NOT total — opponents may have played different
 *  numbers of games if league size changed). */
export function getStrengthOfSchedule(): SOSRow[] {
  const ownerById = new Map(getOwners().map((o) => [o.owner_id, o]));
  const out: SOSRow[] = [];
  for (const year of getYears()) {
    const season = getSeason(year);
    if (!season) continue;
    const opponentsByOwner = new Map<OwnerId, OwnerId[]>();
    for (const m of season.matchups) {
      if (isPlayoffMatchup(m.matchup_type)) continue;
      if (isConsolationMatchup(m.matchup_type)) continue;
      if (m.home_owner_id && m.away_owner_id) {
        const a = opponentsByOwner.get(m.home_owner_id) ?? [];
        a.push(m.away_owner_id);
        opponentsByOwner.set(m.home_owner_id, a);
        const b = opponentsByOwner.get(m.away_owner_id) ?? [];
        b.push(m.home_owner_id);
        opponentsByOwner.set(m.away_owner_id, b);
      }
    }
    const pfPerGame = new Map<OwnerId, number>();
    for (const row of season.standings) {
      if (!row.owner_id) continue;
      const games = row.wins + row.losses + row.ties;
      pfPerGame.set(row.owner_id, games > 0 ? row.points_for / games : 0);
    }
    for (const row of season.standings) {
      if (!row.owner_id) continue;
      const opps = opponentsByOwner.get(row.owner_id) ?? [];
      if (opps.length === 0) continue;
      const totals = opps
        .map((id) => pfPerGame.get(id) ?? 0)
        .reduce((a, b) => a + b, 0);
      const owner = ownerById.get(row.owner_id);
      if (!owner) continue;
      out.push({
        year: Number(year),
        owner,
        avgOpponentPF: totals / opps.length,
      });
    }
  }
  return out;
}

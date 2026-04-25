import {
  getAllMatchupsWithYear,
  getAllStandings,
  getOwner,
  getOwners,
  getStandingsByYear,
  getYears,
  getSeason,
  type MatchupWithYear,
} from "./data";

function ownerDisplayName(
  id: OwnerId | null | undefined,
  fallback: string | null | undefined
): string {
  if (id) {
    const o = getOwner(id);
    if (o) return o.display_name;
  }
  return fallback ?? "Unknown";
}
import type {
  Matchup,
  OwnerId,
  OwnerRegistryEntry,
  Standing,
} from "./types";
import { isConsolationMatchup, isPlayoffMatchup } from "./constants";

// ---------- Owner-side matchup view ----------

export interface OwnerMatchup {
  year: number;
  week: number;
  matchupType: string;
  isPlayoff: boolean;
  ownerId: OwnerId;
  ownerScore: number;
  opponentId: OwnerId | null;
  opponentScore: number;
  isHome: boolean;
  result: "W" | "L" | "T";
  margin: number; // ownerScore - opponentScore
}

function pushOwnerSide(
  out: OwnerMatchup[],
  m: MatchupWithYear,
  side: "home" | "away"
): void {
  const ownerId = side === "home" ? m.home_owner_id : m.away_owner_id;
  const opponentId = side === "home" ? m.away_owner_id : m.home_owner_id;
  if (!ownerId) return;
  const ownerScore = side === "home" ? m.home_score : m.away_score;
  const opponentScore = side === "home" ? m.away_score : m.home_score;
  let result: "W" | "L" | "T";
  if (ownerScore > opponentScore) result = "W";
  else if (ownerScore < opponentScore) result = "L";
  else result = "T";
  out.push({
    year: m.year,
    week: m.week,
    matchupType: m.matchup_type,
    isPlayoff: m.is_playoff,
    ownerId,
    ownerScore,
    opponentId,
    opponentScore,
    isHome: side === "home",
    result,
    margin: ownerScore - opponentScore,
  });
}

let _ownerMatchupsCache: OwnerMatchup[] | null = null;
export function getOwnerMatchups(): OwnerMatchup[] {
  if (_ownerMatchupsCache) return _ownerMatchupsCache;
  const out: OwnerMatchup[] = [];
  for (const m of getAllMatchupsWithYear()) {
    pushOwnerSide(out, m, "home");
    pushOwnerSide(out, m, "away");
  }
  _ownerMatchupsCache = out;
  return out;
}

// ---------- Career profile per owner ----------

export interface CareerProfile {
  owner: OwnerRegistryEntry;
  seasons: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  avgPF: number;
  avgPA: number;
  championships: number;
  runnerUps: number;
  thirdPlaces: number;
  lastPlaces: number;
  playoffAppearances: number;
  finishes: number[];
  avgFinish: number | null;
  bestSeason: Standing | null;
  worstSeason: Standing | null;
  highestSingleWeek: { score: number; year: number; week: number } | null;
  lowestSingleWeek: { score: number; year: number; week: number } | null;
  biggestWin: OwnerMatchup | null;
  worstLoss: OwnerMatchup | null;
}

function isPlayoffTeam(row: Standing, season: ReturnType<typeof getSeason>): boolean {
  // Made the playoffs if they appeared as home_owner_id or away_owner_id in any
  // playoff (winners/losers bracket) matchup that season.
  if (!season || !row.owner_id) return false;
  for (const m of season.matchups) {
    if (!isPlayoffMatchup(m.matchup_type)) continue;
    if (m.home_owner_id === row.owner_id || m.away_owner_id === row.owner_id) {
      return true;
    }
  }
  return false;
}

let _careerCache: Map<OwnerId, CareerProfile> | null = null;
export function getCareerProfiles(): Map<OwnerId, CareerProfile> {
  if (_careerCache) return _careerCache;

  const standingsByYear = getStandingsByYear();
  const result = new Map<OwnerId, CareerProfile>();

  for (const owner of getOwners()) {
    const id = owner.owner_id;
    const profile: CareerProfile = {
      owner,
      seasons: 0,
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winPct: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      avgPF: 0,
      avgPA: 0,
      championships: 0,
      runnerUps: 0,
      thirdPlaces: 0,
      lastPlaces: 0,
      playoffAppearances: 0,
      finishes: [],
      avgFinish: null,
      bestSeason: null,
      worstSeason: null,
      highestSingleWeek: null,
      lowestSingleWeek: null,
      biggestWin: null,
      worstLoss: null,
    };

    for (const year of getYears()) {
      const season = standingsByYear.get(year);
      if (!season) continue;
      const row = season.find((r) => r.owner_id === id);
      if (!row) continue;

      profile.seasons += 1;
      profile.wins += row.wins;
      profile.losses += row.losses;
      profile.ties += row.ties;
      profile.pointsFor += row.points_for;
      profile.pointsAgainst += row.points_against;
      const teamSize = season.length;
      if (row.final_standing != null) {
        profile.finishes.push(row.final_standing);
        if (row.final_standing === 1) profile.championships += 1;
        else if (row.final_standing === 2) profile.runnerUps += 1;
        else if (row.final_standing === 3) profile.thirdPlaces += 1;
        if (row.final_standing === teamSize) profile.lastPlaces += 1;
      }
      if (isPlayoffTeam(row, getSeason(year))) {
        profile.playoffAppearances += 1;
      }

      // Track best/worst season by final standing then PF.
      const isBetter =
        profile.bestSeason == null ||
        (row.final_standing ?? 999) < (profile.bestSeason.final_standing ?? 999) ||
        ((row.final_standing ?? 999) === (profile.bestSeason.final_standing ?? 999) &&
          row.points_for > profile.bestSeason.points_for);
      if (isBetter) profile.bestSeason = row;
      const isWorse =
        profile.worstSeason == null ||
        (row.final_standing ?? -1) > (profile.worstSeason.final_standing ?? -1) ||
        ((row.final_standing ?? -1) === (profile.worstSeason.final_standing ?? -1) &&
          row.points_for < profile.worstSeason.points_for);
      if (isWorse) profile.worstSeason = row;

      // Single-week highs/lows.
      row.weekly_scores.forEach((score, idx) => {
        if (
          profile.highestSingleWeek == null ||
          score > profile.highestSingleWeek.score
        ) {
          profile.highestSingleWeek = { score, year: Number(year), week: idx + 1 };
        }
        if (
          profile.lowestSingleWeek == null ||
          score < profile.lowestSingleWeek.score
        ) {
          profile.lowestSingleWeek = { score, year: Number(year), week: idx + 1 };
        }
      });
    }

    profile.games = profile.wins + profile.losses + profile.ties;
    profile.winPct =
      profile.games > 0
        ? (profile.wins + profile.ties * 0.5) / profile.games
        : 0;
    profile.pointDiff = profile.pointsFor - profile.pointsAgainst;
    profile.avgPF = profile.games > 0 ? profile.pointsFor / profile.games : 0;
    profile.avgPA = profile.games > 0 ? profile.pointsAgainst / profile.games : 0;
    profile.avgFinish =
      profile.finishes.length > 0
        ? profile.finishes.reduce((a, b) => a + b, 0) / profile.finishes.length
        : null;

    // Find biggest win / worst loss in their owner-side matchups.
    for (const om of getOwnerMatchups()) {
      if (om.ownerId !== id) continue;
      if (om.result === "W") {
        if (
          profile.biggestWin == null ||
          om.margin > profile.biggestWin.margin
        ) {
          profile.biggestWin = om;
        }
      } else if (om.result === "L") {
        if (
          profile.worstLoss == null ||
          om.margin < profile.worstLoss.margin
        ) {
          profile.worstLoss = om;
        }
      }
    }

    result.set(id, profile);
  }

  _careerCache = result;
  return result;
}

export function getCareerProfile(id: OwnerId): CareerProfile | undefined {
  return getCareerProfiles().get(id);
}

// ---------- Champions per year ----------

export interface SeasonChampion {
  year: number;
  champion: Standing | null;
  runnerUp: Standing | null;
  third: Standing | null;
  sacko: Standing | null;
  pointsLeader: Standing | null;
  pointsAgainstLeader: Standing | null;
  highestWeek: { score: number; year: number; week: number; ownerId: OwnerId | null; ownerName: string } | null;
  mostConsistent: { row: Standing; stdDev: number } | null;
  mostVolatile: { row: Standing; stdDev: number } | null;
  regularSeasonLeader: Standing | null;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function getSeasonChampions(): SeasonChampion[] {
  const out: SeasonChampion[] = [];
  for (const year of getYears()) {
    const season = getSeason(year);
    if (!season) continue;
    const standings = season.standings;
    const yi = Number(year);
    const teamSize = standings.length;
    const champion = standings.find((r) => r.final_standing === 1) ?? null;
    const runnerUp = standings.find((r) => r.final_standing === 2) ?? null;
    const third = standings.find((r) => r.final_standing === 3) ?? null;
    const sacko = standings.find((r) => r.final_standing === teamSize) ?? null;
    const pointsLeader = [...standings].sort(
      (a, b) => b.points_for - a.points_for
    )[0] ?? null;
    const pointsAgainstLeader = [...standings].sort(
      (a, b) => b.points_against - a.points_against
    )[0] ?? null;
    const regularSeasonLeader = [...standings].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.points_for - a.points_for;
    })[0] ?? null;

    let highestWeek: SeasonChampion["highestWeek"] = null;
    for (const row of standings) {
      row.weekly_scores.forEach((score, idx) => {
        if (highestWeek == null || score > highestWeek.score) {
          highestWeek = {
            score,
            year: yi,
            week: idx + 1,
            ownerId: row.owner_id,
            ownerName: row.owner,
          };
        }
      });
    }

    const consistencies = standings
      .map((row) => ({ row, stdDev: stdDev(row.weekly_scores) }))
      .filter((x) => x.row.weekly_scores.length > 1);
    const mostConsistent = consistencies.length
      ? consistencies.reduce((acc, cur) =>
          cur.stdDev < acc.stdDev ? cur : acc
        )
      : null;
    const mostVolatile = consistencies.length
      ? consistencies.reduce((acc, cur) =>
          cur.stdDev > acc.stdDev ? cur : acc
        )
      : null;

    out.push({
      year: yi,
      champion,
      runnerUp,
      third,
      sacko,
      pointsLeader,
      pointsAgainstLeader,
      highestWeek,
      mostConsistent,
      mostVolatile,
      regularSeasonLeader,
    });
  }
  return out;
}

// ---------- Single-game record book ----------

export interface MatchupRecord {
  year: number;
  week: number;
  matchupType: string;
  homeOwnerId: OwnerId | null;
  homeOwnerName: string;
  homeTeam: string;
  homeScore: number;
  awayOwnerId: OwnerId | null;
  awayOwnerName: string;
  awayTeam: string;
  awayScore: number;
  margin: number;
  combined: number;
  winner: string | null;
  isPlayoff: boolean;
}

function toRecord(m: MatchupWithYear): MatchupRecord {
  return {
    year: m.year,
    week: m.week,
    matchupType: m.matchup_type,
    homeOwnerId: m.home_owner_id,
    homeOwnerName: ownerDisplayName(m.home_owner_id, m.home_team),
    homeTeam: m.home_team ?? "",
    homeScore: m.home_score,
    awayOwnerId: m.away_owner_id,
    awayOwnerName: ownerDisplayName(m.away_owner_id, m.away_team),
    awayTeam: m.away_team ?? "",
    awayScore: m.away_score,
    margin: Math.abs(m.home_score - m.away_score),
    combined: m.home_score + m.away_score,
    winner: m.winner,
    isPlayoff: m.is_playoff || isPlayoffMatchup(m.matchup_type),
  };
}

export function getMatchupRecords(filter: "all" | "regular" | "playoff" = "all") {
  const matchups = getAllMatchupsWithYear().filter((m) => {
    if (filter === "regular") return !isPlayoffMatchup(m.matchup_type) && !isConsolationMatchup(m.matchup_type);
    if (filter === "playoff") return isPlayoffMatchup(m.matchup_type);
    return true;
  });

  const sides: { score: number; opponentScore: number; year: number; week: number; ownerId: OwnerId | null; ownerName: string; teamName: string; matchup: MatchupWithYear; isWin: boolean }[] = [];
  for (const m of matchups) {
    sides.push({
      score: m.home_score,
      opponentScore: m.away_score,
      year: m.year,
      week: m.week,
      ownerId: m.home_owner_id,
      ownerName: ownerDisplayName(m.home_owner_id, m.home_team),
      teamName: m.home_team ?? "",
      matchup: m,
      isWin: m.home_score > m.away_score,
    });
    sides.push({
      score: m.away_score,
      opponentScore: m.home_score,
      year: m.year,
      week: m.week,
      ownerId: m.away_owner_id,
      ownerName: ownerDisplayName(m.away_owner_id, m.away_team),
      teamName: m.away_team ?? "",
      matchup: m,
      isWin: m.away_score > m.home_score,
    });
  }

  const records = matchups.map(toRecord);

  return {
    highestScore: [...sides].sort((a, b) => b.score - a.score).slice(0, 10),
    lowestScore: [...sides]
      .filter((s) => s.score > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10),
    biggestBlowout: [...records].sort((a, b) => b.margin - a.margin).slice(0, 10),
    closestGame: [...records].sort((a, b) => a.margin - b.margin).slice(0, 10),
    highestCombined: [...records].sort((a, b) => b.combined - a.combined).slice(0, 10),
    lowestCombined: [...records]
      .filter((r) => r.combined > 0)
      .sort((a, b) => a.combined - b.combined)
      .slice(0, 10),
    cursedLoss: [...sides]
      .filter((s) => !s.isWin)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10),
    luckyWin: [...sides]
      .filter((s) => s.isWin)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10),
  };
}

// ---------- Head-to-head ----------

export interface H2HCell {
  ownerA: OwnerId;
  ownerB: OwnerId;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  games: number;
  winPct: number;
}

let _h2hCache: Map<string, H2HCell> | null = null;
function h2hKey(a: OwnerId, b: OwnerId): string {
  return `${a}__${b}`;
}

export function getHeadToHead(): Map<string, H2HCell> {
  if (_h2hCache) return _h2hCache;
  const out = new Map<string, H2HCell>();
  for (const om of getOwnerMatchups()) {
    if (!om.opponentId) continue;
    const key = h2hKey(om.ownerId, om.opponentId);
    let cell = out.get(key);
    if (!cell) {
      cell = {
        ownerA: om.ownerId,
        ownerB: om.opponentId,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        games: 0,
        winPct: 0,
      };
      out.set(key, cell);
    }
    cell.games += 1;
    cell.pointsFor += om.ownerScore;
    cell.pointsAgainst += om.opponentScore;
    if (om.result === "W") cell.wins += 1;
    else if (om.result === "L") cell.losses += 1;
    else cell.ties += 1;
    cell.winPct = cell.games > 0 ? (cell.wins + cell.ties * 0.5) / cell.games : 0;
  }
  _h2hCache = out;
  return out;
}

export function getH2HCell(a: OwnerId, b: OwnerId): H2HCell | undefined {
  return getHeadToHead().get(h2hKey(a, b));
}

export function getH2HMatchups(a: OwnerId, b: OwnerId): OwnerMatchup[] {
  return getOwnerMatchups()
    .filter((m) => m.ownerId === a && m.opponentId === b)
    .sort((x, y) => x.year - y.year || x.week - y.week);
}

// ---------- Helpers ----------

export function totalGamesPlayed(): number {
  // Counts each matchup once.
  return getAllMatchupsWithYear().length;
}

export function totalPointsScored(): number {
  let total = 0;
  for (const m of getAllMatchupsWithYear()) {
    total += m.home_score + m.away_score;
  }
  return total;
}

export function uniqueStartedPlayerCount(): number {
  const ids = new Set<number>();
  for (const m of getAllMatchupsWithYear()) {
    for (const p of m.home_lineup) {
      if (p.lineup_slot && p.lineup_slot !== "BE" && p.lineup_slot !== "IR" && p.player_id) {
        ids.add(p.player_id);
      }
    }
    for (const p of m.away_lineup) {
      if (p.lineup_slot && p.lineup_slot !== "BE" && p.lineup_slot !== "IR" && p.player_id) {
        ids.add(p.player_id);
      }
    }
  }
  return ids.size;
}

export function avgScorePerYear(): { year: number; avg: number }[] {
  const out: { year: number; avg: number }[] = [];
  for (const year of getYears()) {
    const season = getSeason(year);
    if (!season) continue;
    const scores: number[] = [];
    for (const m of season.matchups) {
      if (!isPlayoffMatchup(m.matchup_type) && !isConsolationMatchup(m.matchup_type)) {
        scores.push(m.home_score, m.away_score);
      }
    }
    if (scores.length === 0) continue;
    out.push({
      year: Number(year),
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    });
  }
  return out;
}

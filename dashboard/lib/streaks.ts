import { getOwnerMatchups } from "./aggregations";
import { getOwners, getYears, getSeason } from "./data";
import { isPlayoffMatchup } from "./constants";
import type { OwnerId, OwnerRegistryEntry } from "./types";

export interface Streak {
  ownerId: OwnerId;
  ownerName: string;
  type: "W" | "L";
  length: number;
  startYear: number;
  startWeek: number;
  endYear: number;
  endWeek: number;
  isActive: boolean;
}

export function getLongestStreaks(kind: "W" | "L"): Streak[] {
  const owners = getOwners();
  const matchups = getOwnerMatchups();

  // Group by owner, then sort chronologically.
  const byOwner = new Map<OwnerId, typeof matchups>();
  for (const m of matchups) {
    const arr = byOwner.get(m.ownerId) ?? [];
    arr.push(m);
    byOwner.set(m.ownerId, arr);
  }

  const out: Streak[] = [];
  for (const owner of owners) {
    const list = (byOwner.get(owner.owner_id) ?? []).slice().sort(
      (a, b) => a.year - b.year || a.week - b.week
    );
    if (list.length === 0) continue;

    let bestLen = 0;
    let bestStartIdx = 0;
    let bestEndIdx = 0;
    let curLen = 0;
    let curStartIdx = 0;
    list.forEach((m, idx) => {
      if (m.result === kind) {
        if (curLen === 0) curStartIdx = idx;
        curLen += 1;
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStartIdx = curStartIdx;
          bestEndIdx = idx;
        }
      } else {
        curLen = 0;
      }
    });

    if (bestLen === 0) continue;
    const startGame = list[bestStartIdx];
    const endGame = list[bestEndIdx];
    const lastGame = list[list.length - 1];
    const isActive = lastGame === endGame && lastGame.result === kind;

    out.push({
      ownerId: owner.owner_id,
      ownerName: owner.display_name,
      type: kind,
      length: bestLen,
      startYear: startGame.year,
      startWeek: startGame.week,
      endYear: endGame.year,
      endWeek: endGame.week,
      isActive,
    });
  }

  return out.sort((a, b) => b.length - a.length);
}

export interface PlayoffStreak {
  ownerId: OwnerId;
  ownerName: string;
  length: number;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

function ownerMadePlayoffs(ownerId: OwnerId, year: string): boolean {
  const season = getSeason(year);
  if (!season) return false;
  for (const m of season.matchups) {
    if (!isPlayoffMatchup(m.matchup_type)) continue;
    if (m.home_owner_id === ownerId || m.away_owner_id === ownerId) return true;
  }
  return false;
}

function ownerWasInLeague(ownerId: OwnerId, year: string): boolean {
  const season = getSeason(year);
  if (!season) return false;
  return season.standings.some((row) => row.owner_id === ownerId);
}

export function getPlayoffAppearanceStreaks(): PlayoffStreak[] {
  const owners = getOwners();
  const years = getYears();
  const out: PlayoffStreak[] = [];

  for (const owner of owners) {
    let bestLen = 0;
    let bestStart = 0;
    let bestEnd = 0;
    let curLen = 0;
    let curStart = 0;
    years.forEach((year) => {
      if (!ownerWasInLeague(owner.owner_id, year)) {
        curLen = 0;
        return;
      }
      if (ownerMadePlayoffs(owner.owner_id, year)) {
        if (curLen === 0) curStart = Number(year);
        curLen += 1;
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStart = curStart;
          bestEnd = Number(year);
        }
      } else {
        curLen = 0;
      }
    });
    if (bestLen === 0) continue;
    const lastYear = Number(years[years.length - 1]);
    const isActive = bestEnd === lastYear && ownerMadePlayoffs(owner.owner_id, String(lastYear));
    out.push({
      ownerId: owner.owner_id,
      ownerName: owner.display_name,
      length: bestLen,
      startYear: bestStart,
      endYear: bestEnd,
      isActive,
    });
  }

  return out.sort((a, b) => b.length - a.length);
}

export function getPlayoffDroughts(): PlayoffStreak[] {
  const owners = getOwners();
  const years = getYears();
  const out: PlayoffStreak[] = [];

  for (const owner of owners) {
    let bestLen = 0;
    let bestStart = 0;
    let bestEnd = 0;
    let curLen = 0;
    let curStart = 0;
    years.forEach((year) => {
      if (!ownerWasInLeague(owner.owner_id, year)) {
        curLen = 0;
        return;
      }
      if (!ownerMadePlayoffs(owner.owner_id, year)) {
        if (curLen === 0) curStart = Number(year);
        curLen += 1;
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStart = curStart;
          bestEnd = Number(year);
        }
      } else {
        curLen = 0;
      }
    });
    if (bestLen === 0) continue;
    const lastYear = Number(years[years.length - 1]);
    const isActive =
      bestEnd === lastYear && !ownerMadePlayoffs(owner.owner_id, String(lastYear));
    out.push({
      ownerId: owner.owner_id,
      ownerName: owner.display_name,
      length: bestLen,
      startYear: bestStart,
      endYear: bestEnd,
      isActive,
    });
  }

  return out.sort((a, b) => b.length - a.length);
}

export interface YoYDelta {
  owner: OwnerRegistryEntry;
  fromYear: number;
  toYear: number;
  fromWinPct: number;
  toWinPct: number;
  delta: number;
}

export function getBiggestImprovements(): YoYDelta[] {
  const owners = getOwners();
  const out: YoYDelta[] = [];
  for (const owner of owners) {
    const seasons = owner.seasons.map(Number).sort((a, b) => a - b);
    let prev: { year: number; winPct: number } | null = null;
    for (const year of seasons) {
      const season = getSeason(year);
      if (!season) continue;
      const row = season.standings.find((r) => r.owner_id === owner.owner_id);
      if (!row) continue;
      const games = row.wins + row.losses + row.ties;
      const winPct = games > 0 ? (row.wins + row.ties * 0.5) / games : 0;
      if (prev) {
        out.push({
          owner,
          fromYear: prev.year,
          toYear: year,
          fromWinPct: prev.winPct,
          toWinPct: winPct,
          delta: winPct - prev.winPct,
        });
      }
      prev = { year, winPct };
    }
  }
  return out.sort((a, b) => b.delta - a.delta);
}

import Link from "next/link";
import { Card, StatTile } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Trophy } from "@/components/Trophy";
import { Badge } from "@/components/Badge";
import { LineChart } from "@/components/Charts";
import { DailyFact, type DailyFactItem } from "@/components/DailyFact";
import {
  avgScorePerYear,
  getCareerProfiles,
  getMatchupRecords,
  getSeasonChampions,
  totalGamesPlayed,
  totalPointsScored,
  type CareerProfile,
} from "@/lib/aggregations";
import { getSeason, getStandingsByYear, getYears } from "@/lib/data";
import type { Standing } from "@/lib/types";
import {
  fmtInt,
  fmtNum,
  fmtPct,
  fmtRecord,
  isConsolationMatchup,
  isPlayoffMatchup,
} from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import { InfoIcon } from "@/components/InfoIcon";

export default function HomePage() {
  const profiles = Array.from(getCareerProfiles().values()).sort(
    (a, b) => b.winPct - a.winPct
  );
  const champions = getSeasonChampions().sort((a, b) => b.year - a.year);
  const records = getMatchupRecords();
  const games = totalGamesPlayed();
  const points = totalPointsScored();
  const avgScore = avgScorePerYear();
  const pointsPerYear = getYears()
    .map((year) => {
      const season = getSeason(year);
      if (!season) return null;
      let total = 0;
      let count = 0;
      for (const m of season.matchups) {
        if (isPlayoffMatchup(m.matchup_type)) continue;
        if (isConsolationMatchup(m.matchup_type)) continue;
        total += m.home_score + m.away_score;
        count += 2;
      }
      return { x: year, total, games: count / 2 };
    })
    .filter((x): x is { x: string; total: number; games: number } => x !== null);

  const topWinPct = profiles.slice(0, 8);

  const recordCols: Column<CareerProfile>[] = [
    {
      key: "rank",
      header: "#",
      align: "right",
      className: "text-ink-faint w-8",
      render: (_, idx) => idx + 1,
    },
    {
      key: "owner",
      header: "Owner",
      render: (p) => (
        <OwnerLink ownerId={p.owner.owner_id} name={p.owner.display_name} showAvatar />
      ),
    },
    {
      key: "rec",
      header: "Record",
      info: STAT_DEFS.record,
      align: "right",
      render: (p) => fmtRecord(p.wins, p.losses, p.ties),
    },
    {
      key: "winpct",
      header: "Win %",
      info: STAT_DEFS.winPct,
      align: "right",
      render: (p) => fmtPct(p.winPct),
    },
    {
      key: "rings",
      header: "Rings",
      info: STAT_DEFS.championship,
      align: "right",
      render: (p) => (p.championships ? <Badge variant="warning">{p.championships}</Badge> : "—"),
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">League History</h1>

      <DailyFact facts={buildDailyFacts(records, profiles, getStandingsByYear())} />

      <section className="space-y-4">
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatTile
            label="Seasons"
            value={fmtInt(champions.length)}
            info="Number of completed seasons in the league archive."
          />
          <StatTile
            label="Owners"
            value={fmtInt(profiles.length)}
            info="Distinct fantasy owners (by stable ESPN account ID) who have appeared in the league."
          />
          <StatTile
            label="Games Played"
            value={fmtInt(games)}
            info={STAT_DEFS.games}
          />
          <StatTile
            label="Total Points Scored"
            value={fmtInt(points)}
            info="Sum of every team's score in every matchup ever recorded."
          />
        </div>
      </section>

      <Card title="Trophy Case" subtitle="Champions, runners-up, and the League Loser for every season">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-3 py-2">Year</th>
                <th className="text-left px-3 py-2">
                  Champion
                  <InfoIcon label={STAT_DEFS.championship} />
                </th>
                <th className="text-left px-3 py-2">
                  Runner-up
                  <InfoIcon label={STAT_DEFS.runnerUp} />
                </th>
                <th className="text-left px-3 py-2">
                  3rd
                  <InfoIcon label={STAT_DEFS.thirdPlace} />
                </th>
                <th className="text-left px-3 py-2">
                  League Loser
                  <InfoIcon label={STAT_DEFS.leagueLoser} />
                </th>
                <th className="text-left px-3 py-2">
                  Reg-Season Title
                  <InfoIcon label={STAT_DEFS.regularSeasonTitle} />
                </th>
              </tr>
            </thead>
            <tbody>
              {champions.map((c) => (
                <tr key={c.year} className="border-b border-white/5">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/seasons/${c.year}/`}
                      className="font-semibold text-ink no-underline hover:text-accent"
                    >
                      {c.year}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.champion ? (
                      <span className="inline-flex items-center gap-2">
                        <Trophy label="Champ" tier="gold" />
                        <OwnerLink
                          ownerId={c.champion.owner_id}
                          name={c.champion.owner}
                          showAvatar
                        />
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.runnerUp ? (
                      <OwnerLink ownerId={c.runnerUp.owner_id} name={c.runnerUp.owner} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.third ? (
                      <OwnerLink ownerId={c.third.owner_id} name={c.third.owner} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.sacko ? (
                      <span className="inline-flex items-center gap-2">
                        <Trophy label="Loser" tier="sacko" />
                        <OwnerLink ownerId={c.sacko.owner_id} name={c.sacko.owner} />
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.regularSeasonLeader ? (
                      <OwnerLink
                        ownerId={c.regularSeasonLeader.owner_id}
                        name={c.regularSeasonLeader.owner}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card
          title="All-Time Win %"
          subtitle="Top owners by career winning percentage"
          actions={<Link href="/leaderboards/" className="text-xs">All leaderboards →</Link>}
        >
          <StatTable rows={topWinPct} columns={recordCols} />
        </Card>

        <div className="grid grid-cols-2 grid-rows-4 gap-3 h-full">
          <StatTile
            label="Highest Score Ever"
            value={fmtNum(records.highestScore[0]?.score)}
            hint={`${records.highestScore[0]?.ownerName} • ${records.highestScore[0]?.year} W${records.highestScore[0]?.week}`}
            accent="gold"
            info={STAT_DEFS.highestScore}
          />
          <StatTile
            label="Lowest Score Ever"
            value={fmtNum(records.lowestScore[0]?.score)}
            hint={`${records.lowestScore[0]?.ownerName} • ${records.lowestScore[0]?.year} W${records.lowestScore[0]?.week}`}
            accent="red"
            info={STAT_DEFS.lowestScore}
          />
          <StatTile
            label="Biggest Blowout"
            value={fmtNum(records.biggestBlowout[0]?.margin)}
            hint={
              records.biggestBlowout[0]
                ? `${
                    records.biggestBlowout[0].homeScore < records.biggestBlowout[0].awayScore
                      ? records.biggestBlowout[0].homeOwnerName
                      : records.biggestBlowout[0].awayOwnerName
                  } • ${records.biggestBlowout[0].year} W${records.biggestBlowout[0].week}`
                : undefined
            }
            accent="red"
            info={STAT_DEFS.biggestBlowout}
          />
          <StatTile
            label="Closest Game"
            value={fmtNum(records.closestGame[0]?.margin)}
            hint={
              records.closestGame[0]
                ? `${
                    records.closestGame[0].homeScore >= records.closestGame[0].awayScore
                      ? records.closestGame[0].homeOwnerName
                      : records.closestGame[0].awayOwnerName
                  } d. ${
                    records.closestGame[0].homeScore >= records.closestGame[0].awayScore
                      ? records.closestGame[0].awayOwnerName
                      : records.closestGame[0].homeOwnerName
                  } • ${records.closestGame[0].year} W${records.closestGame[0].week}`
                : undefined
            }
            accent="blue"
            info={STAT_DEFS.closestGame}
          />
          <StatTile
            label="Highest-Scoring Loss"
            value={fmtNum(records.cursedLoss[0]?.score)}
            hint={`${records.cursedLoss[0]?.ownerName} • ${records.cursedLoss[0]?.year} W${records.cursedLoss[0]?.week}`}
            accent="purple"
            info={STAT_DEFS.cursedLoss}
          />
          <StatTile
            label="Lowest-Scoring Win"
            value={fmtNum(records.luckyWin[0]?.score)}
            hint={`${records.luckyWin[0]?.ownerName} • ${records.luckyWin[0]?.year} W${records.luckyWin[0]?.week}`}
            accent="green"
            info={STAT_DEFS.luckyWin}
          />
          <StatTile
            label="Highest Combined Score"
            value={fmtNum(records.highestCombined[0]?.combined)}
            hint={
              records.highestCombined[0]
                ? `${records.highestCombined[0].homeOwnerName} vs ${records.highestCombined[0].awayOwnerName} • ${records.highestCombined[0].year} W${records.highestCombined[0].week}`
                : undefined
            }
            accent="gold"
            info={STAT_DEFS.highestCombined}
          />
          <StatTile
            label="Lowest Combined Score"
            value={fmtNum(records.lowestCombined[0]?.combined)}
            hint={
              records.lowestCombined[0]
                ? `${records.lowestCombined[0].homeOwnerName} vs ${records.lowestCombined[0].awayOwnerName} • ${records.lowestCombined[0].year} W${records.lowestCombined[0].week}`
                : undefined
            }
            accent="blue"
            info={STAT_DEFS.lowestCombined}
          />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5 text-sm">
        <SectionLink href="/owners/" title="Owners" subtitle="Career profiles, year-by-year, head-to-head" />
        <SectionLink href="/seasons/" title="Seasons" subtitle="Standings, draft boards, weekly heatmap" />
        <SectionLink href="/streaks/" title="Streaks" subtitle="Longest winning, losing, playoff" />
        <SectionLink href="/luck/" title="Luck" subtitle="All-play records, schedule strength" />
        <SectionLink href="/awards/" title="Awards" subtitle="Hall of fame & shame per season" />
      </div>

      <Card title="Avg Score per Week" subtitle="Regular-season scoring inflation over the years">
        <LineChart
          data={avgScore.map((p) => ({ x: p.year, avg: p.avg }))}
          xKey="x"
          series={[{ key: "avg", label: "Avg points / team / week", color: "#7c5cff" }]}
          height={280}
        />
      </Card>

      <Card title="Total Points Scored per Season" subtitle="Larger leagues + higher scoring add up">
        <LineChart
          data={pointsPerYear}
          xKey="x"
          series={[{ key: "total", label: "Total regular-season points", color: "#4cc9f0" }]}
          height={260}
        />
      </Card>
    </div>
  );
}

function SectionLink({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-white/5 bg-bg-card/60 p-4 no-underline hover:bg-bg-card hover:border-white/10 hover:no-underline"
    >
      <div className="font-semibold text-ink">{title}</div>
      <div className="text-xs text-ink-dim mt-1">{subtitle}</div>
    </Link>
  );
}

// Trent stays off the wall of shame. Match by display name (no other owner
// has "trent" in theirs) so we don't have to hardcode an owner_id.
function isTrent(name: string | null | undefined): boolean {
  return !!name && name.toLowerCase().includes("trent");
}

// Find the first item in a sorted list whose referenced owner names don't
// include Trent. Used to skip past Trent-involved entries when picking the
// "headline" record from a top-N list.
function firstWithoutTrent<T>(
  items: T[],
  getNames: (item: T) => (string | null | undefined)[]
): T | undefined {
  return items.find((item) => !getNames(item).some(isTrent));
}

// Build the rotating "Did You Know?" pool. Each entry roasts whoever holds
// the #1 (worst) spot in some category, skipping Trent. Order doesn't matter
// for picking, but we keep it stable so the modulo-by-day rotation is
// deterministic across builds.
function buildDailyFacts(
  records: ReturnType<typeof getMatchupRecords>,
  profiles: CareerProfile[],
  standingsByYear: Map<string, Standing[]>
): DailyFactItem[] {
  const facts: DailyFactItem[] = [];

  // ---------- Single-game roasts ----------

  const lowest = firstWithoutTrent(records.lowestScore, (s) => [s.ownerName]);
  if (lowest) {
    facts.push({
      id: "lowest_score",
      headline: "Worst single week ever",
      body: (
        <>
          <OwnerLink ownerId={lowest.ownerId} name={lowest.ownerName} /> put up
          just <strong className="text-ink">{fmtNum(lowest.score)}</strong>{" "}
          points in {lowest.year} W{lowest.week}. The whole week. Their
          opponent didn&apos;t exactly need to break a sweat.
        </>
      ),
    });
  }

  const blowout = firstWithoutTrent(records.biggestBlowout, (b) => [
    b.homeOwnerName,
    b.awayOwnerName,
  ]);
  if (blowout) {
    const winnerIsHome = blowout.homeScore > blowout.awayScore;
    const winnerId = winnerIsHome ? blowout.homeOwnerId : blowout.awayOwnerId;
    const winnerName = winnerIsHome ? blowout.homeOwnerName : blowout.awayOwnerName;
    const loserId = winnerIsHome ? blowout.awayOwnerId : blowout.homeOwnerId;
    const loserName = winnerIsHome ? blowout.awayOwnerName : blowout.homeOwnerName;
    const winScore = Math.max(blowout.homeScore, blowout.awayScore);
    const loseScore = Math.min(blowout.homeScore, blowout.awayScore);
    facts.push({
      id: "biggest_blowout",
      headline: "Most lopsided game ever",
      body: (
        <>
          <OwnerLink ownerId={winnerId} name={winnerName} /> beat{" "}
          <OwnerLink ownerId={loserId} name={loserName} />{" "}
          <strong className="text-ink">
            {fmtNum(winScore)} – {fmtNum(loseScore)}
          </strong>{" "}
          in {blowout.year} W{blowout.week}. A {fmtNum(blowout.margin)}-point
          margin. That&apos;s not a fantasy game, that&apos;s an assault charge.
        </>
      ),
    });
  }

  const lowCombined = firstWithoutTrent(records.lowestCombined, (r) => [
    r.homeOwnerName,
    r.awayOwnerName,
  ]);
  if (lowCombined) {
    facts.push({
      id: "lowest_combined",
      headline: "Most boring game ever",
      body: (
        <>
          <OwnerLink ownerId={lowCombined.homeOwnerId} name={lowCombined.homeOwnerName} />{" "}
          and{" "}
          <OwnerLink ownerId={lowCombined.awayOwnerId} name={lowCombined.awayOwnerName} />{" "}
          combined for just{" "}
          <strong className="text-ink">{fmtNum(lowCombined.combined)}</strong>{" "}
          points in {lowCombined.year} W{lowCombined.week}. Two starting QBs
          would&apos;ve outscored the entire matchup.
        </>
      ),
    });
  }

  const cursed = firstWithoutTrent(records.cursedLoss, (s) => [s.ownerName]);
  if (cursed) {
    facts.push({
      id: "cursed_loss",
      headline: "Cruelest loss ever",
      body: (
        <>
          <OwnerLink ownerId={cursed.ownerId} name={cursed.ownerName} /> dropped{" "}
          <strong className="text-ink">{fmtNum(cursed.score)}</strong> points in{" "}
          {cursed.year} W{cursed.week} — and lost. The opponent put up{" "}
          {fmtNum(cursed.opponentScore)}. The fantasy gods do not care about
          you.
        </>
      ),
    });
  }

  const lucky = firstWithoutTrent(records.luckyWin, (s) => [s.ownerName]);
  if (lucky) {
    facts.push({
      id: "lucky_win",
      headline: "Luckiest win ever",
      body: (
        <>
          <OwnerLink ownerId={lucky.ownerId} name={lucky.ownerName} /> backed
          into a W with just{" "}
          <strong className="text-ink">{fmtNum(lucky.score)}</strong> points in{" "}
          {lucky.year} W{lucky.week}. Their opponent managed only{" "}
          {fmtNum(lucky.opponentScore)}. The bar was on the floor; somehow
          they still tripped on it.
        </>
      ),
    });
  }

  // Cruelest tiny loss (smallest non-zero margin) — told from the loser's POV.
  const heartbreak = firstWithoutTrent(
    records.closestGame.filter((g) => g.margin > 0),
    (g) => [g.homeScore < g.awayScore ? g.homeOwnerName : g.awayOwnerName]
  );
  if (heartbreak) {
    const loserIsHome = heartbreak.homeScore < heartbreak.awayScore;
    const loserId = loserIsHome ? heartbreak.homeOwnerId : heartbreak.awayOwnerId;
    const loserName = loserIsHome ? heartbreak.homeOwnerName : heartbreak.awayOwnerName;
    const winnerId = loserIsHome ? heartbreak.awayOwnerId : heartbreak.homeOwnerId;
    const winnerName = loserIsHome ? heartbreak.awayOwnerName : heartbreak.homeOwnerName;
    facts.push({
      id: "tiniest_loss",
      headline: "Cruelest tiny loss",
      body: (
        <>
          <OwnerLink ownerId={loserId} name={loserName} /> lost to{" "}
          <OwnerLink ownerId={winnerId} name={winnerName} /> by{" "}
          <strong className="text-ink">{fmtNum(heartbreak.margin)}</strong>{" "}
          points in {heartbreak.year} W{heartbreak.week}. One bench decision
          and the season looks different. It doesn&apos;t.
        </>
      ),
    });
  }

  // ---------- Career roasts ----------

  // Eligible pool: real owners with games played, never Trent.
  const careerPool = profiles.filter(
    (p) => p.games > 0 && !isTrent(p.owner.display_name)
  );

  // Worst career win % (require ≥3 seasons so a one-off bad year doesn't win).
  const worstWinner = [...careerPool]
    .filter((p) => p.seasons >= 3)
    .sort((a, b) => a.winPct - b.winPct || b.games - a.games)[0];
  if (worstWinner) {
    facts.push({
      id: "worst_career_winpct",
      headline: "League's most reliable loser",
      body: (
        <>
          <OwnerLink
            ownerId={worstWinner.owner.owner_id}
            name={worstWinner.owner.display_name}
          />{" "}
          has won just{" "}
          <strong className="text-ink">{fmtPct(worstWinner.winPct)}</strong>{" "}
          of their games across {worstWinner.seasons} seasons (
          {fmtRecord(worstWinner.wins, worstWinner.losses, worstWinner.ties)}).
          At some point you have to ask if it&apos;s the lineup or the
          lineup-setter.
        </>
      ),
    });
  }

  // Most last-place finishes — the actual league loser trophy room.
  const mostLast = [...careerPool]
    .filter((p) => p.lastPlaces > 0)
    .sort((a, b) => b.lastPlaces - a.lastPlaces || b.seasons - a.seasons)[0];
  if (mostLast) {
    facts.push({
      id: "most_last_place",
      headline: "Permanent basement resident",
      body: (
        <>
          <OwnerLink
            ownerId={mostLast.owner.owner_id}
            name={mostLast.owner.display_name}
          />{" "}
          has finished dead last{" "}
          <strong className="text-ink">
            {mostLast.lastPlaces} {mostLast.lastPlaces === 1 ? "time" : "times"}
          </strong>
          . The League Loser trophy basically has their name engraved on it.
        </>
      ),
    });
  }

  // Most career losses — pure volume of L's.
  const mostLosses = [...careerPool].sort((a, b) => b.losses - a.losses)[0];
  if (mostLosses) {
    facts.push({
      id: "most_career_losses",
      headline: "Career losses leader",
      body: (
        <>
          <OwnerLink
            ownerId={mostLosses.owner.owner_id}
            name={mostLosses.owner.display_name}
          />{" "}
          has racked up{" "}
          <strong className="text-ink">{fmtInt(mostLosses.losses)}</strong>{" "}
          career losses — more than anyone in league history. A monument to
          showing up.
        </>
      ),
    });
  }

  // Worst career point differential (most outscored over time).
  const worstDiff = [...careerPool].sort((a, b) => a.pointDiff - b.pointDiff)[0];
  if (worstDiff && worstDiff.pointDiff < 0) {
    facts.push({
      id: "worst_point_diff",
      headline: "Outscored by a small country",
      body: (
        <>
          <OwnerLink
            ownerId={worstDiff.owner.owner_id}
            name={worstDiff.owner.display_name}
          />{" "}
          has been outscored by opponents by{" "}
          <strong className="text-ink">
            {fmtNum(Math.abs(worstDiff.pointDiff))}
          </strong>{" "}
          points across their career. The math is unforgiving.
        </>
      ),
    });
  }

  // Worst single-season record (by win rate, requires a real season).
  let worstSeasonRow: Standing | null = null;
  let worstSeasonYear: number | null = null;
  let worstSeasonRate = Infinity;
  for (const [year, standings] of standingsByYear) {
    for (const row of standings) {
      const games = row.wins + row.losses + row.ties;
      if (games < 5) continue;
      if (isTrent(row.owner)) continue;
      const rate = (row.wins + row.ties * 0.5) / games;
      if (
        rate < worstSeasonRate ||
        (rate === worstSeasonRate &&
          worstSeasonRow != null &&
          row.points_for < worstSeasonRow.points_for)
      ) {
        worstSeasonRate = rate;
        worstSeasonRow = row;
        worstSeasonYear = Number(year);
      }
    }
  }
  if (worstSeasonRow && worstSeasonYear) {
    facts.push({
      id: "worst_single_season",
      headline: "Worst regular season ever",
      body: (
        <>
          <OwnerLink
            ownerId={worstSeasonRow.owner_id}
            name={worstSeasonRow.owner}
          />{" "}
          went{" "}
          <strong className="text-ink">
            {fmtRecord(
              worstSeasonRow.wins,
              worstSeasonRow.losses,
              worstSeasonRow.ties
            )}
          </strong>{" "}
          in {worstSeasonYear}. An entire season of tape they probably
          don&apos;t want back.
        </>
      ),
    });
  }

  // Lowest career PF per game (≥3 seasons so we're not roasting newcomers).
  const worstAvgPF = [...careerPool]
    .filter((p) => p.seasons >= 3 && p.avgPF > 0)
    .sort((a, b) => a.avgPF - b.avgPF)[0];
  if (worstAvgPF) {
    facts.push({
      id: "worst_avg_pf",
      headline: "Offense, allegedly",
      body: (
        <>
          <OwnerLink
            ownerId={worstAvgPF.owner.owner_id}
            name={worstAvgPF.owner.display_name}
          />{" "}
          averages just{" "}
          <strong className="text-ink">{fmtNum(worstAvgPF.avgPF)}</strong>{" "}
          points per game across {worstAvgPF.seasons} seasons — the lowest
          tenured average in league history. The offense is not offending
          anyone.
        </>
      ),
    });
  }

  // Most non-playoff seasons (require ≥3 seasons of opportunity).
  const missedPlayoffs = [...careerPool]
    .filter((p) => p.seasons >= 3)
    .map((p) => ({ p, missed: p.seasons - p.playoffAppearances }))
    .filter(({ missed }) => missed > 0)
    .sort(
      (a, b) =>
        b.missed - a.missed || a.p.playoffAppearances - b.p.playoffAppearances
    )[0];
  if (missedPlayoffs) {
    facts.push({
      id: "most_missed_playoffs",
      headline: "Allergic to the playoffs",
      body: (
        <>
          <OwnerLink
            ownerId={missedPlayoffs.p.owner.owner_id}
            name={missedPlayoffs.p.owner.display_name}
          />{" "}
          has missed the playoffs{" "}
          <strong className="text-ink">
            {missedPlayoffs.missed} of {missedPlayoffs.p.seasons}
          </strong>{" "}
          seasons. December is just for watching at this point.
        </>
      ),
    });
  }

  // Longest tenure with zero rings.
  const ringless = [...careerPool]
    .filter((p) => p.championships === 0 && p.seasons >= 4)
    .sort((a, b) => b.seasons - a.seasons || b.games - a.games)[0];
  if (ringless) {
    facts.push({
      id: "ringless_veteran",
      headline: "Still chasing the first ring",
      body: (
        <>
          <OwnerLink
            ownerId={ringless.owner.owner_id}
            name={ringless.owner.display_name}
          />{" "}
          has played{" "}
          <strong className="text-ink">{ringless.seasons} seasons</strong>{" "}
          without raising a single trophy. There&apos;s always next year.
          Probably not, though.
        </>
      ),
    });
  }

  // Most runner-up finishes without a title — the choke artist award.
  const mostChokes = [...careerPool]
    .filter((p) => p.runnerUps > 0 && p.championships === 0)
    .sort((a, b) => b.runnerUps - a.runnerUps || b.seasons - a.seasons)[0];
  if (mostChokes) {
    facts.push({
      id: "most_runner_ups",
      headline: "Always a bridesmaid",
      body: (
        <>
          <OwnerLink
            ownerId={mostChokes.owner.owner_id}
            name={mostChokes.owner.display_name}
          />{" "}
          has finished as runner-up{" "}
          <strong className="text-ink">
            {mostChokes.runnerUps}{" "}
            {mostChokes.runnerUps === 1 ? "time" : "times"}
          </strong>{" "}
          without ever taking the title. So close, every time.
        </>
      ),
    });
  }

  // Personal worst week — the worst single game any individual put up,
  // separate from the league-wide #1 above (different victim, different week).
  const ownProfileLow = [...careerPool]
    .filter((p) => p.lowestSingleWeek != null && p.lowestSingleWeek.score > 0)
    .sort(
      (a, b) =>
        (a.lowestSingleWeek!.score - b.lowestSingleWeek!.score) ||
        (b.games - a.games)
    );
  // Skip whoever already owns the league-wide low so we don't repeat them.
  const skipName = lowest?.ownerName?.toLowerCase() ?? null;
  const personalLow = ownProfileLow.find(
    (p) => p.owner.display_name.toLowerCase() !== skipName
  );
  if (personalLow && personalLow.lowestSingleWeek) {
    facts.push({
      id: "personal_low_week",
      headline: "Career-low embarrassment",
      body: (
        <>
          <OwnerLink
            ownerId={personalLow.owner.owner_id}
            name={personalLow.owner.display_name}
          />
          &apos;s worst week ever was{" "}
          <strong className="text-ink">
            {fmtNum(personalLow.lowestSingleWeek.score)}
          </strong>{" "}
          points in {personalLow.lowestSingleWeek.year} W
          {personalLow.lowestSingleWeek.week}. Some weeks the lineup just
          stops trying.
        </>
      ),
    });
  }

  return facts;
}

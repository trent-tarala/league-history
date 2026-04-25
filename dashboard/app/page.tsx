import Link from "next/link";
import { Card, StatTile } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Trophy } from "@/components/Trophy";
import { Badge } from "@/components/Badge";
import { LineChart } from "@/components/Charts";
import {
  avgScorePerYear,
  getCareerProfiles,
  getMatchupRecords,
  getSeasonChampions,
  totalGamesPlayed,
  totalPointsScored,
  type CareerProfile,
} from "@/lib/aggregations";
import { getSeason, getYears } from "@/lib/data";
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
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">League History</h1>
          <p className="text-ink-dim text-sm max-w-2xl">
            {champions.length} seasons of fantasy football. {profiles.length} owners.{" "}
            {fmtInt(games)} games played. {fmtInt(points)} points scored.
          </p>
        </div>
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

      <div className="grid gap-6 md:grid-cols-2">
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

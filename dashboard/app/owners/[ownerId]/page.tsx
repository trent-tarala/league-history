import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, StatTile } from "@/components/Card";
import { OwnerSwatch } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Trophy } from "@/components/Trophy";
import { LineChart } from "@/components/Charts";
import {
  getCareerProfile,
  getHeadToHead,
  getOwnerMatchups,
} from "@/lib/aggregations";
import { getOwner, getOwnerIds, getOwners, getYears, getSeason } from "@/lib/data";
import {
  colorForOwner,
  fmtNum,
  fmtPct,
  fmtRecord,
  ordinal,
  ownerIdFromSlug,
  ownerSlug,
} from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import type { Standing } from "@/lib/types";

export function generateStaticParams() {
  return getOwnerIds().map((id) => ({ ownerId: ownerSlug(id) }));
}

interface PageProps {
  params: Promise<{ ownerId: string }>;
}

export default async function OwnerPage({ params }: PageProps) {
  const { ownerId: rawId } = await params;
  const ownerId = ownerIdFromSlug(rawId);
  const owner = getOwner(ownerId);
  const profile = getCareerProfile(ownerId);
  if (!owner || !profile) notFound();

  const swatch = colorForOwner(ownerId);
  const yearByYear = getYears()
    .map((y) => {
      const season = getSeason(y);
      const row = season?.standings.find((r) => r.owner_id === ownerId);
      if (!row || !season) return null;
      const teamCount = season.standings.length;
      return { year: Number(y), row, teamCount };
    })
    .filter((x): x is { year: number; row: Standing; teamCount: number } => x !== null);

  // Weekly score chart across all seasons.
  const matchups = getOwnerMatchups()
    .filter((m) => m.ownerId === ownerId)
    .sort((a, b) => a.year - b.year || a.week - b.week);
  const chartData = matchups.map((m, idx) => ({
    x: `${m.year} W${m.week}`,
    score: m.ownerScore,
    seq: idx,
  }));

  // Head-to-head summary vs every other owner.
  const allOwners = getOwners().filter((o) => o.owner_id !== ownerId);
  const h2hMap = getHeadToHead();

  const yearCols: Column<typeof yearByYear[number]>[] = [
    { key: "year", header: "Year", render: (r) => (
      <Link href={`/seasons/${r.year}/`} className="text-ink no-underline hover:text-accent">
        {r.year}
      </Link>
    ) },
    { key: "team", header: "Team", render: (r) => r.row.team_name ?? "—" },
    {
      key: "rec",
      header: "Record",
      info: STAT_DEFS.record,
      align: "right",
      render: (r) => fmtRecord(r.row.wins, r.row.losses, r.row.ties),
    },
    {
      key: "pf",
      header: "PF",
      info: STAT_DEFS.pf,
      align: "right",
      render: (r) => fmtNum(r.row.points_for),
    },
    {
      key: "pa",
      header: "PA",
      info: STAT_DEFS.pa,
      align: "right",
      render: (r) => fmtNum(r.row.points_against),
    },
    {
      key: "finish",
      header: "Finish",
      info: STAT_DEFS.finish,
      align: "right",
      render: (r) => {
        if (r.row.final_standing == null) return "—";
        const isChamp = r.row.final_standing === 1;
        const isSacko = r.row.final_standing === r.teamCount;
        return (
          <span className="inline-flex items-center gap-1.5 justify-end">
            <span>{ordinal(r.row.final_standing)}</span>
            {isChamp && <Trophy label="Champ" tier="gold" />}
            {isSacko && <Trophy label="Loser" tier="sacko" />}
          </span>
        );
      },
    },
  ];

  type H2HRow = {
    opponentId: string;
    opponentName: string;
    games: number;
    wins: number;
    losses: number;
    ties: number;
    winPct: number;
    pointsFor: number;
    pointsAgainst: number;
  };
  const h2hRows: H2HRow[] = allOwners
    .map((o) => {
      const cell = h2hMap.get(`${ownerId}__${o.owner_id}`);
      if (!cell) return null;
      return {
        opponentId: o.owner_id,
        opponentName: o.display_name,
        games: cell.games,
        wins: cell.wins,
        losses: cell.losses,
        ties: cell.ties,
        winPct: cell.winPct,
        pointsFor: cell.pointsFor,
        pointsAgainst: cell.pointsAgainst,
      };
    })
    .filter((x): x is H2HRow => x !== null)
    .sort((a, b) => b.winPct - a.winPct || b.games - a.games);

  const h2hCols: Column<H2HRow>[] = [
    {
      key: "opp",
      header: "Opponent",
      render: (r) => (
        <Link
          href={`/head-to-head/${ownerSlug(ownerId)}/${ownerSlug(r.opponentId)}/`}
          className="text-ink no-underline hover:text-accent"
        >
          {r.opponentName}
        </Link>
      ),
    },
    {
      key: "rec",
      header: "Record",
      info: STAT_DEFS.h2hRecord,
      align: "right",
      render: (r) => fmtRecord(r.wins, r.losses, r.ties),
    },
    {
      key: "winpct",
      header: "Win %",
      info: STAT_DEFS.h2hWinPct,
      align: "right",
      render: (r) => {
        const cls =
          r.winPct > 0.5
            ? "text-accent-green"
            : r.winPct < 0.5
              ? "text-accent-red"
              : "text-ink-dim";
        return <span className={`${cls} font-medium`}>{fmtPct(r.winPct)}</span>;
      },
    },
    {
      key: "pf",
      header: "PF",
      info: STAT_DEFS.pf,
      align: "right",
      render: (r) => fmtNum(r.pointsFor),
    },
    {
      key: "pa",
      header: "PA",
      info: STAT_DEFS.pa,
      align: "right",
      render: (r) => fmtNum(r.pointsAgainst),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { href: "/owners/", label: "Owners" },
          { label: owner.display_name },
        ]}
      />
      <header className="flex flex-wrap items-center gap-4">
        <OwnerSwatch ownerId={ownerId} name={owner.display_name} size={64} />
        <div>
          <h1 className="text-2xl font-semibold">{owner.display_name}</h1>
          <p className="text-ink-dim text-sm">
            {owner.first_seen_year}–{owner.last_seen_year} • {owner.seasons.length} seasons
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {profile.championships > 0 && (
            <Trophy label={`${profile.championships}× Champion`} tier="gold" />
          )}
          {profile.runnerUps > 0 && (
            <Trophy label={`${profile.runnerUps}× 2nd`} tier="silver" />
          )}
          {profile.thirdPlaces > 0 && (
            <Trophy label={`${profile.thirdPlaces}× 3rd`} tier="bronze" />
          )}
          {profile.lastPlaces > 0 && (
            <Trophy label={`${profile.lastPlaces}× League Loser`} tier="sacko" />
          )}
        </div>
      </header>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <StatTile
          label="Record"
          value={fmtRecord(profile.wins, profile.losses, profile.ties)}
          info={STAT_DEFS.record}
        />
        <StatTile
          label="Win %"
          value={fmtPct(profile.winPct)}
          accent="green"
          info={STAT_DEFS.winPct}
        />
        <StatTile
          label="Points For"
          value={fmtNum(profile.pointsFor, 0)}
          info={STAT_DEFS.pf}
        />
        <StatTile
          label="Points Against"
          value={fmtNum(profile.pointsAgainst, 0)}
          info={STAT_DEFS.pa}
        />
        <StatTile
          label="PF / Game"
          value={fmtNum(profile.avgPF)}
          info={STAT_DEFS.pfPerGame}
        />
        <StatTile
          label="Avg Finish"
          value={profile.avgFinish != null ? fmtNum(profile.avgFinish, 1) : "—"}
          info={STAT_DEFS.avgFinish}
        />
        <StatTile
          label="Playoff App."
          value={profile.playoffAppearances}
          accent="purple"
          info={STAT_DEFS.playoffApp}
        />
        <StatTile
          label="Championships"
          value={profile.championships}
          accent="gold"
          info={STAT_DEFS.championship}
        />
        <StatTile
          label="Highest Week"
          value={profile.highestSingleWeek ? fmtNum(profile.highestSingleWeek.score) : "—"}
          hint={
            profile.highestSingleWeek
              ? `${profile.highestSingleWeek.year} W${profile.highestSingleWeek.week}`
              : undefined
          }
          info={STAT_DEFS.highestWeek}
        />
        <StatTile
          label="Lowest Week"
          value={profile.lowestSingleWeek ? fmtNum(profile.lowestSingleWeek.score) : "—"}
          hint={
            profile.lowestSingleWeek
              ? `${profile.lowestSingleWeek.year} W${profile.lowestSingleWeek.week}`
              : undefined
          }
          info={STAT_DEFS.lowestWeek}
        />
        <StatTile
          label="Biggest Win"
          value={profile.biggestWin ? `+${fmtNum(profile.biggestWin.margin)}` : "—"}
          hint={profile.biggestWin ? `${profile.biggestWin.year} W${profile.biggestWin.week}` : undefined}
          accent="green"
          info={STAT_DEFS.biggestWin}
        />
        <StatTile
          label="Worst Loss"
          value={profile.worstLoss ? `${fmtNum(profile.worstLoss.margin)}` : "—"}
          hint={profile.worstLoss ? `${profile.worstLoss.year} W${profile.worstLoss.week}` : undefined}
          accent="red"
          info={STAT_DEFS.worstLoss}
        />
      </div>

      <Card title="Year by Year">
        <StatTable
          rows={yearByYear}
          columns={yearCols}
          rowKey={(r) => String(r.year)}
        />
      </Card>

      <Card title="Weekly Scores" subtitle="Every game across every season">
        <LineChart
          data={chartData}
          xKey="x"
          series={[{ key: "score", label: "Points scored", color: swatch }]}
          height={260}
        />
      </Card>

      <Card
        title="Head-to-Head"
        subtitle="All-time record vs every other owner"
        info={STAT_DEFS.h2hRecord}
      >
        <StatTable rows={h2hRows} columns={h2hCols} rowKey={(r) => r.opponentId} />
      </Card>
    </div>
  );
}

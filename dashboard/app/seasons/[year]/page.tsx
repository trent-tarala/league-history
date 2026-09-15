import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Trophy } from "@/components/Trophy";
import { Badge } from "@/components/Badge";
import { WeeklyHeatmap } from "@/components/WeeklyHeatmap";
import { DraftBoardGrid } from "@/components/DraftBoardGrid";
import { getSeason, getYears } from "@/lib/data";
import { getSeasonChampions } from "@/lib/aggregations";
import { SeasonStatusBadge } from "@/components/SeasonStatusBadge";
import {
  getWeeksPlayed,
  isSeasonComplete,
  sortSeasonStandings,
} from "@/lib/season-status";
import {
  fmtNum,
  fmtRecord,
  isPlayoffMatchup,
  MATCHUP_TYPE_LABEL,
  ordinal,
} from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import type { Matchup, Standing } from "@/lib/types";

export function generateStaticParams() {
  return getYears().map((year) => ({ year }));
}

interface PageProps {
  params: Promise<{ year: string }>;
}

export default async function SeasonPage({ params }: PageProps) {
  const { year } = await params;
  const season = getSeason(year);
  if (!season) notFound();

  const yi = Number(year);
  const complete = isSeasonComplete(year);
  const champ = getSeasonChampions().find((c) => c.year === yi);
  const teamCount = season.standings.length;
  const weeksPlayed = getWeeksPlayed(year);

  const sortedStandings = sortSeasonStandings(season.standings, year);

  const standingsCols: Column<Standing>[] = [
    {
      key: "rank",
      header: "#",
      align: "right",
      className: "text-ink-faint w-8",
      render: (s, idx) =>
        complete && s.final_standing != null
          ? ordinal(s.final_standing)
          : ordinal(idx + 1),
    },
    {
      key: "owner",
      header: "Owner",
      render: (s) => (
        <OwnerLink ownerId={s.owner_id} name={s.owner} showAvatar />
      ),
    },
    {
      key: "team",
      header: "Team",
      render: (s) => <span className="text-ink-dim">{s.team_name ?? "—"}</span>,
    },
    {
      key: "div",
      header: "Div",
      render: (s) => s.division ?? "—",
    },
    {
      key: "rec",
      header: "Record",
      info: STAT_DEFS.record,
      align: "right",
      render: (s) => fmtRecord(s.wins, s.losses, s.ties),
    },
    {
      key: "pf",
      header: "PF",
      info: STAT_DEFS.pf,
      align: "right",
      render: (s) => fmtNum(s.points_for),
    },
    {
      key: "pa",
      header: "PA",
      info: STAT_DEFS.pa,
      align: "right",
      render: (s) => fmtNum(s.points_against),
    },
    {
      key: "diff",
      header: "+/-",
      info: STAT_DEFS.pointDiff,
      align: "right",
      render: (s) => {
        const diff = s.points_for - s.points_against;
        return (
          <span className={diff >= 0 ? "text-accent-green" : "text-accent-red"}>
            {diff >= 0 ? "+" : ""}
            {fmtNum(diff)}
          </span>
        );
      },
    },
    {
      key: "trophy",
      header: "",
      render: (s) =>
        complete && s.final_standing === 1 ? (
          <Trophy label="Champ" tier="gold" />
        ) : complete && s.final_standing === 2 ? (
          <Trophy label="2nd" tier="silver" />
        ) : complete && s.final_standing === 3 ? (
          <Trophy label="3rd" tier="bronze" />
        ) : complete && s.final_standing === teamCount ? (
          <Trophy label="Loser" tier="sacko" />
        ) : null,
    },
  ];

  const matchupCols: Column<Matchup>[] = [
    { key: "wk", header: "Wk", align: "right", render: (m) => m.week },
    {
      key: "type",
      header: "Type",
      info: STAT_DEFS.matchupType,
      render: (m) =>
        isPlayoffMatchup(m.matchup_type) ? (
          <Badge variant="playoff">PO</Badge>
        ) : (
          <span className="text-xs text-ink-faint">
            {MATCHUP_TYPE_LABEL[m.matchup_type] ?? "Reg"}
          </span>
        ),
    },
    {
      key: "home",
      header: "Home",
      render: (m) => <OwnerLink ownerId={m.home_owner_id} name={m.home_team ?? ""} />,
    },
    {
      key: "score",
      header: "Score",
      align: "center",
      render: (m) => (
        <span className="font-semibold tabular-nums">
          {fmtNum(m.home_score)} – {fmtNum(m.away_score)}
        </span>
      ),
    },
    {
      key: "away",
      header: "Away",
      render: (m) => <OwnerLink ownerId={m.away_owner_id} name={m.away_team ?? ""} />,
    },
    {
      key: "winner",
      header: "Winner",
      render: (m) => (
        <span className="text-ink-dim text-xs">{m.winner ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/seasons/" className="text-xs">
          ← All seasons
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h1 className="text-2xl font-semibold tracking-tight">{year} Season</h1>
          <SeasonStatusBadge year={year} />
        </div>
        <p className="text-ink-dim text-sm mt-1">
          {teamCount} teams • {season.matchups.length} matchups
          {!complete && weeksPlayed > 0 && ` • through week ${weeksPlayed}`}
        </p>
      </header>

      {complete && champ && (
        <div className="flex flex-wrap gap-2">
          {champ.champion && (
            <Trophy label={`Champ: ${champ.champion.owner}`} tier="gold" />
          )}
          {champ.runnerUp && (
            <Trophy label={`2nd: ${champ.runnerUp.owner}`} tier="silver" />
          )}
          {champ.third && (
            <Trophy label={`3rd: ${champ.third.owner}`} tier="bronze" />
          )}
          {champ.sacko && (
            <Trophy label={`League Loser: ${champ.sacko.owner}`} tier="sacko" />
          )}
        </div>
      )}

      {!complete && (
        <div className="rounded-xl border border-dashed border-accent-gold/20 bg-accent-gold/5 px-4 py-3 text-sm text-ink-dim">
          Season in progress — standings reflect the current week. Final placements
          and trophies are awarded after the championship.
        </div>
      )}

      <Card title={complete ? "Final Standings" : "Current Standings"}>
        <StatTable
          rows={sortedStandings}
          columns={standingsCols}
          rowKey={(s) => `${s.team_id}-${s.owner_id}`}
        />
      </Card>

      <Card
        title="Weekly Heatmap"
        subtitle={
          <>
            Each row is an owner and each column is a week of the season.
            Cell color runs cool to warm by points scored, so the hottest
            cells are the highest single-week totals of the year.
            A <span className="text-accent-green">green outline</span> marks
            a win that week and a <span className="text-accent-red">red outline</span>{" "}
            marks a loss. Rows are sorted top-to-bottom by{" "}
            {complete ? "final standing" : "current record"}.
          </>
        }
        info={STAT_DEFS.weeklyHeatmap}
      >
        <WeeklyHeatmap standings={season.standings} year={year} />
      </Card>

      <Card title="Matchup Log">
        <StatTable
          rows={season.matchups}
          columns={matchupCols}
          rowKey={(m, idx) => `${m.week}-${m.home_team_id}-${m.away_team_id}-${idx}`}
        />
      </Card>

      <Card title="Draft Board" subtitle={`Round-by-round, ${season.draft.length} picks`}>
        <DraftBoardGrid picks={season.draft} standings={season.standings} />
      </Card>
    </div>
  );
}

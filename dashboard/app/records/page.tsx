import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Badge } from "@/components/Badge";
import { getMatchupRecords } from "@/lib/aggregations";
import { fmtNum } from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import type { Matchup, OwnerId } from "@/lib/types";

type SideRecord = {
  score: number;
  opponentScore: number;
  year: number;
  week: number;
  ownerId: OwnerId | null;
  ownerName: string;
  teamName: string;
  matchup: Matchup & { year: number };
  isWin: boolean;
};

type PairRecord = {
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
};

const yearCol: Column<{ year: number; week: number }> = {
  key: "year",
  header: "Year/Wk",
  render: (r) => `${r.year} W${r.week}`,
};

const ownerCol: Column<SideRecord> = {
  key: "owner",
  header: "Owner",
  render: (r) => <OwnerLink ownerId={r.ownerId} name={r.ownerName} />,
};

const resultCol: Column<SideRecord> = {
  key: "result",
  header: "Result",
  align: "right",
  render: (r) => (
    <Badge variant={r.isWin ? "win" : "loss"}>{r.isWin ? "W" : "L"}</Badge>
  ),
};

const sideCols = (label: string): Column<SideRecord>[] => [
  yearCol as Column<SideRecord>,
  ownerCol,
  {
    key: "score",
    header: label,
    align: "right",
    render: (r) => fmtNum(r.score),
  },
  resultCol,
];

const sideColsWithOpp = (label: string): Column<SideRecord>[] => [
  yearCol as Column<SideRecord>,
  ownerCol,
  {
    key: "score",
    header: label,
    align: "right",
    render: (r) => fmtNum(r.score),
  },
  {
    key: "opp",
    header: "Opp",
    align: "right",
    render: (r) => fmtNum(r.opponentScore),
  },
  {
    key: "margin",
    header: "Margin",
    align: "right",
    render: (r) => fmtNum(Math.abs(r.score - r.opponentScore)),
  },
  resultCol,
];

const pairBaseCols: Column<PairRecord>[] = [
  yearCol as Column<PairRecord>,
  {
    key: "home",
    header: "Home",
    render: (r) => <OwnerLink ownerId={r.homeOwnerId} name={r.homeOwnerName} />,
  },
  {
    key: "score",
    header: "Score",
    align: "center",
    render: (r) => (
      <span className="font-semibold tabular-nums">
        {fmtNum(r.homeScore)} – {fmtNum(r.awayScore)}
      </span>
    ),
  },
  {
    key: "away",
    header: "Away",
    render: (r) => <OwnerLink ownerId={r.awayOwnerId} name={r.awayOwnerName} />,
  },
];

const pairColsWithMargin: Column<PairRecord>[] = [
  ...pairBaseCols,
  {
    key: "margin",
    header: "Margin",
    align: "right",
    render: (r) => fmtNum(r.margin),
  },
];

const pairColsWithCombined: Column<PairRecord>[] = [
  ...pairBaseCols,
  {
    key: "combined",
    header: "Combined",
    align: "right",
    render: (r) => fmtNum(r.combined),
  },
];

function recordSection(label: "all" | "regular" | "playoff", title: string) {
  const r = getMatchupRecords(label);
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Highest Single-Week Score" info={STAT_DEFS.highestScore}>
          <StatTable rows={r.highestScore as SideRecord[]} columns={sideCols("Score")} compact />
        </Card>
        <Card
          title="Lowest Single-Week Score"
          subtitle="Excludes 0-score forfeits"
          info={STAT_DEFS.lowestScore}
        >
          <StatTable rows={r.lowestScore as SideRecord[]} columns={sideCols("Score")} compact />
        </Card>
        <Card title="Biggest Blowouts" info={STAT_DEFS.biggestBlowout}>
          <StatTable rows={r.biggestBlowout as PairRecord[]} columns={pairColsWithMargin} compact />
        </Card>
        <Card title="Closest Games" info={STAT_DEFS.closestGame}>
          <StatTable rows={r.closestGame as PairRecord[]} columns={pairColsWithMargin} compact />
        </Card>
        <Card
          title="Highest Combined Score"
          subtitle="Pure scoring fests"
          info={STAT_DEFS.highestCombined}
        >
          <StatTable rows={r.highestCombined as PairRecord[]} columns={pairColsWithCombined} compact />
        </Card>
        <Card
          title="Lowest Combined Score"
          subtitle="Excludes byes"
          info={STAT_DEFS.lowestCombined}
        >
          <StatTable rows={r.lowestCombined as PairRecord[]} columns={pairColsWithCombined} compact />
        </Card>
        <Card
          title="Highest-Scoring Loss"
          subtitle="Cursed: scored a ton, still lost"
          info={STAT_DEFS.cursedLoss}
        >
          <StatTable rows={r.cursedLoss as SideRecord[]} columns={sideColsWithOpp("Score")} compact />
        </Card>
        <Card
          title="Lowest-Scoring Win"
          subtitle="Lucky: backed into a W"
          info={STAT_DEFS.luckyWin}
        >
          <StatTable rows={r.luckyWin as SideRecord[]} columns={sideColsWithOpp("Score")} compact />
        </Card>
      </div>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Single-Game Record Book</h1>
        <p className="text-ink-dim text-sm mt-1">
          Top-10 list for every category. Records broken out by all games, regular
          season, and playoffs.
        </p>
      </header>
      {recordSection("all", "All Games")}
      {recordSection("regular", "Regular Season")}
      {recordSection("playoff", "Playoffs")}
    </div>
  );
}

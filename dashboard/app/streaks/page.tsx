import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Badge } from "@/components/Badge";
import {
  getLongestStreaks,
  getPlayoffAppearanceStreaks,
  getPlayoffDroughts,
  type Streak,
  type PlayoffStreak,
} from "@/lib/streaks";
import { STAT_DEFS } from "@/lib/stat-definitions";

const streakCols: Column<Streak>[] = [
  {
    key: "rank",
    header: "#",
    align: "right",
    className: "text-ink-faint w-8",
    render: (_r, idx) => idx + 1,
  },
  {
    key: "owner",
    header: "Owner",
    render: (s) => <OwnerLink ownerId={s.ownerId} name={s.ownerName} />,
  },
  {
    key: "len",
    header: "Length",
    align: "right",
    render: (s) => (
      <span className="font-semibold tabular-nums">
        {s.length}
        {s.isActive && <Badge variant="warning" className="ml-2">Active</Badge>}
      </span>
    ),
  },
  {
    key: "from",
    header: "From",
    render: (s) => `${s.startYear} W${s.startWeek}`,
  },
  {
    key: "to",
    header: "To",
    render: (s) => `${s.endYear} W${s.endWeek}`,
  },
];

const playoffCols: Column<PlayoffStreak>[] = [
  {
    key: "rank",
    header: "#",
    align: "right",
    className: "text-ink-faint w-8",
    render: (_r, idx) => idx + 1,
  },
  {
    key: "owner",
    header: "Owner",
    render: (s) => <OwnerLink ownerId={s.ownerId} name={s.ownerName} />,
  },
  {
    key: "len",
    header: "Years",
    align: "right",
    render: (s) => (
      <span className="font-semibold tabular-nums">
        {s.length}
        {s.isActive && <Badge variant="warning" className="ml-2">Active</Badge>}
      </span>
    ),
  },
  {
    key: "from",
    header: "From",
    render: (s) => s.startYear,
  },
  {
    key: "to",
    header: "To",
    render: (s) => s.endYear,
  },
];

export default function StreaksPage() {
  const wins = getLongestStreaks("W");
  const losses = getLongestStreaks("L");
  const playoffApp = getPlayoffAppearanceStreaks();
  const droughts = getPlayoffDroughts();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Streaks</h1>
        <p className="text-ink-dim text-sm mt-1">
          Longest winning, losing, playoff, and drought streaks. Active streaks
          are highlighted.
        </p>
      </header>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card title="Longest Winning Streaks" info={STAT_DEFS.winStreak}>
          <StatTable rows={wins} columns={streakCols} rowKey={(s) => `${s.ownerId}-${s.length}-${s.startYear}`} />
        </Card>
        <Card title="Longest Losing Streaks" info={STAT_DEFS.loseStreak}>
          <StatTable rows={losses} columns={streakCols} rowKey={(s) => `${s.ownerId}-${s.length}-${s.startYear}`} />
        </Card>
        <Card title="Longest Playoff Appearance Streaks" info={STAT_DEFS.playoffStreak}>
          <StatTable rows={playoffApp} columns={playoffCols} rowKey={(s) => `${s.ownerId}-${s.length}-${s.startYear}`} />
        </Card>
        <Card title="Longest Playoff Droughts" info={STAT_DEFS.playoffDrought}>
          <StatTable rows={droughts} columns={playoffCols} rowKey={(s) => `${s.ownerId}-${s.length}-${s.startYear}`} />
        </Card>
      </div>
    </div>
  );
}

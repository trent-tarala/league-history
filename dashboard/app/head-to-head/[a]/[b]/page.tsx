import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, StatTile } from "@/components/Card";
import { OwnerLink, OwnerSwatch } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Badge } from "@/components/Badge";
import {
  getH2HCell,
  getH2HMatchups,
  type OwnerMatchup,
} from "@/lib/aggregations";
import { getOwner, getOwnerIds } from "@/lib/data";
import {
  fmtNum,
  fmtPct,
  fmtRecord,
  isPlayoffMatchup,
  MATCHUP_TYPE_LABEL,
  ownerIdFromSlug,
  ownerSlug,
} from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";

export function generateStaticParams() {
  const ids = getOwnerIds();
  const out: { a: string; b: string }[] = [];
  for (const a of ids) {
    for (const b of ids) {
      if (a !== b) {
        out.push({ a: ownerSlug(a), b: ownerSlug(b) });
      }
    }
  }
  return out;
}

interface PageProps {
  params: Promise<{ a: string; b: string }>;
}

export default async function H2HPage({ params }: PageProps) {
  const { a: rawA, b: rawB } = await params;
  const a = ownerIdFromSlug(rawA);
  const b = ownerIdFromSlug(rawB);
  const ownerA = getOwner(a);
  const ownerB = getOwner(b);
  if (!ownerA || !ownerB) notFound();

  const cellAB = getH2HCell(a, b);
  const cellBA = getH2HCell(b, a);
  const games = getH2HMatchups(a, b);

  const cols: Column<OwnerMatchup>[] = [
    {
      key: "year",
      header: "Year/Wk",
      render: (g) => `${g.year} W${g.week}`,
    },
    {
      key: "type",
      header: "Type",
      info: STAT_DEFS.matchupType,
      render: (g) =>
        isPlayoffMatchup(g.matchupType) ? (
          <Badge variant="playoff">PO</Badge>
        ) : (
          <span className="text-xs text-ink-faint">
            {MATCHUP_TYPE_LABEL[g.matchupType] ?? "Reg"}
          </span>
        ),
    },
    {
      key: "score",
      header: `${ownerA.display_name}`,
      align: "right",
      render: (g) => (
        <span
          className={
            g.result === "W" ? "text-accent-green font-semibold" : "text-ink-dim"
          }
        >
          {fmtNum(g.ownerScore)}
        </span>
      ),
    },
    {
      key: "oppscore",
      header: `${ownerB.display_name}`,
      align: "right",
      render: (g) => (
        <span
          className={
            g.result === "L" ? "text-accent-green font-semibold" : "text-ink-dim"
          }
        >
          {fmtNum(g.opponentScore)}
        </span>
      ),
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      render: (g) => (
        <span
          className={
            g.margin > 0
              ? "text-accent-green"
              : g.margin < 0
                ? "text-accent-red"
                : "text-ink-dim"
          }
        >
          {g.margin > 0 ? "+" : ""}
          {fmtNum(g.margin)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/head-to-head/" className="text-xs">
          ← Back to matrix
        </Link>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex flex-col items-center gap-2">
            <OwnerSwatch ownerId={a} name={ownerA.display_name} size={56} />
            <OwnerLink ownerId={a} name={ownerA.display_name} />
          </div>
          <span className="text-xl text-ink-faint font-bold">vs</span>
          <div className="flex flex-col items-center gap-2">
            <OwnerSwatch ownerId={b} name={ownerB.display_name} size={56} />
            <OwnerLink ownerId={b} name={ownerB.display_name} />
          </div>
        </div>
      </header>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatTile
          label="Series Record"
          value={
            cellAB
              ? fmtRecord(cellAB.wins, cellAB.losses, cellAB.ties)
              : "0-0"
          }
          hint={`From ${ownerA.display_name}'s side`}
          info={STAT_DEFS.seriesRecord}
        />
        <StatTile
          label="Win %"
          value={cellAB ? fmtPct(cellAB.winPct) : "—"}
          accent="green"
          info={STAT_DEFS.h2hWinPct}
        />
        <StatTile
          label={`${ownerA.display_name} PF`}
          value={cellAB ? fmtNum(cellAB.pointsFor, 0) : "—"}
          info={`Total points ${ownerA.display_name} has scored across all matchups in this series.`}
        />
        <StatTile
          label={`${ownerB.display_name} PF`}
          value={cellBA ? fmtNum(cellBA.pointsFor, 0) : "—"}
          info={`Total points ${ownerB.display_name} has scored across all matchups in this series.`}
        />
      </div>

      <Card title="Every Matchup" subtitle={`${games.length} games played`}>
        <StatTable
          rows={games}
          columns={cols}
          rowKey={(g, idx) => `${g.year}-${g.week}-${idx}`}
        />
      </Card>
    </div>
  );
}

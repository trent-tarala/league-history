import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import { Badge } from "@/components/Badge";
import { getCareerProfiles, type CareerProfile } from "@/lib/aggregations";
import { fmtNum, fmtPct, fmtRecord } from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";

function ownerCol(): Column<CareerProfile> {
  return {
    key: "owner",
    header: "Owner",
    render: (p) => (
      <OwnerLink ownerId={p.owner.owner_id} name={p.owner.display_name} showAvatar />
    ),
  };
}

function rankCol<T>(): Column<T> {
  return {
    key: "rank",
    header: "#",
    align: "right",
    className: "text-ink-faint w-8",
    render: (_r, idx) => idx + 1,
  };
}

function seasonsCol(): Column<CareerProfile> {
  return {
    key: "seasons",
    header: "Seasons",
    info: STAT_DEFS.seasons,
    align: "right",
    render: (p) => p.seasons,
  };
}

export default function LeaderboardsPage() {
  const profiles = Array.from(getCareerProfiles().values());

  const byWinPct = [...profiles].sort((a, b) => b.winPct - a.winPct);
  const byWins = [...profiles].sort((a, b) => b.wins - a.wins);
  const byPF = [...profiles].sort((a, b) => b.pointsFor - a.pointsFor);
  const byPFPerGame = [...profiles].sort((a, b) => b.avgPF - a.avgPF);
  const byChamps = [...profiles].sort(
    (a, b) =>
      b.championships - a.championships ||
      b.runnerUps - a.runnerUps ||
      b.thirdPlaces - a.thirdPlaces ||
      a.lastPlaces - b.lastPlaces
  );
  const byPlayoffs = [...profiles].sort(
    (a, b) => b.playoffAppearances - a.playoffAppearances
  );
  const byBestAvgFinish = [...profiles]
    .filter((p) => p.avgFinish != null)
    .sort((a, b) => (a.avgFinish ?? 999) - (b.avgFinish ?? 999));
  const byWorstAvgFinish = [...profiles]
    .filter((p) => p.avgFinish != null)
    .sort((a, b) => (b.avgFinish ?? -1) - (a.avgFinish ?? -1));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">All-Time Leaderboards</h1>
        <p className="text-ink-dim text-sm mt-1">
          Sortable rankings across every owner who has ever set foot in the league.
        </p>
      </header>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card title="Win Percentage" subtitle="Career W-L-T as a fraction">
          <StatTable
            rows={byWinPct}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
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
              seasonsCol(),
            ]}
          />
        </Card>

        <Card title="Total Wins" subtitle="Sheer accumulation of W's">
          <StatTable
            rows={byWins}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "wins",
                header: "Wins",
                info: STAT_DEFS.wins,
                align: "right",
                render: (p) => p.wins,
              },
              {
                key: "losses",
                header: "Losses",
                info: STAT_DEFS.losses,
                align: "right",
                render: (p) => p.losses,
              },
              seasonsCol(),
            ]}
          />
        </Card>

        <Card title="Career Points For" subtitle="The hoarders">
          <StatTable
            rows={byPF}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "pf",
                header: "Total PF",
                info: STAT_DEFS.pf,
                align: "right",
                render: (p) => fmtNum(p.pointsFor, 0),
              },
              {
                key: "pa",
                header: "Total PA",
                info: STAT_DEFS.pa,
                align: "right",
                render: (p) => fmtNum(p.pointsAgainst, 0),
              },
            ]}
          />
        </Card>

        <Card title="PF per Game" subtitle="Normalized for tenure">
          <StatTable
            rows={byPFPerGame}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "avgpf",
                header: "PF / G",
                info: STAT_DEFS.pfPerGame,
                align: "right",
                render: (p) => fmtNum(p.avgPF),
              },
              {
                key: "avgpa",
                header: "PA / G",
                info: STAT_DEFS.paPerGame,
                align: "right",
                render: (p) => fmtNum(p.avgPA),
              },
            ]}
          />
        </Card>

        <Card
          title="Trophies"
          subtitle="Champs, runners-up, bronzes, and last places — every owner"
        >
          <StatTable
            rows={byChamps}
            rowKey={(p) => p.owner.owner_id}
            emptyMessage="No owners on record."
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "champ",
                header: "Champ",
                info: STAT_DEFS.championship,
                align: "right",
                render: (p) =>
                  p.championships ? (
                    <Badge variant="warning">{p.championships}</Badge>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "ru",
                header: "2nd",
                info: STAT_DEFS.runnerUp,
                align: "right",
                render: (p) => p.runnerUps || "—",
              },
              {
                key: "third",
                header: "3rd",
                info: STAT_DEFS.thirdPlace,
                align: "right",
                render: (p) => p.thirdPlaces || "—",
              },
              {
                key: "sacko",
                header: "Last",
                info: STAT_DEFS.leagueLoser,
                align: "right",
                render: (p) =>
                  p.lastPlaces ? (
                    <Badge variant="loss">{p.lastPlaces}</Badge>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </Card>

        <Card title="Playoff Appearances" subtitle="Showed up when it mattered">
          <StatTable
            rows={byPlayoffs}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "po",
                header: "Playoff App.",
                info: STAT_DEFS.playoffApp,
                align: "right",
                render: (p) => p.playoffAppearances,
              },
              {
                key: "rate",
                header: "Rate",
                info: STAT_DEFS.playoffRate,
                align: "right",
                render: (p) =>
                  p.seasons > 0 ? fmtPct(p.playoffAppearances / p.seasons, 0) : "—",
              },
              seasonsCol(),
            ]}
          />
        </Card>

        <Card title="Best Average Finish" info={STAT_DEFS.avgFinish}>
          <StatTable
            rows={byBestAvgFinish}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "avg",
                header: "Avg Finish",
                info: STAT_DEFS.avgFinish,
                align: "right",
                render: (p) => (p.avgFinish != null ? fmtNum(p.avgFinish, 2) : "—"),
              },
              seasonsCol(),
            ]}
          />
        </Card>

        <Card title="Worst Average Finish" info={STAT_DEFS.avgFinish}>
          <StatTable
            rows={byWorstAvgFinish}
            rowKey={(p) => p.owner.owner_id}
            columns={[
              rankCol<CareerProfile>(),
              ownerCol(),
              {
                key: "avg",
                header: "Avg Finish",
                info: STAT_DEFS.avgFinish,
                align: "right",
                render: (p) => (p.avgFinish != null ? fmtNum(p.avgFinish, 2) : "—"),
              },
              seasonsCol(),
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

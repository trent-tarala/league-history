import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { StatTable, type Column } from "@/components/StatTable";
import {
  getAllPlayRecords,
  getCursedSeasons,
  getLuckIndex,
  getStrengthOfSchedule,
  type AllPlayRow,
  type CursedSeason,
  type LuckIndexRow,
  type SOSRow,
} from "@/lib/luck";
import { fmtNum, fmtPct, fmtRecord, ordinal } from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import { getSeason, getYears } from "@/lib/data";

const apCols: Column<AllPlayRow>[] = [
  { key: "year", header: "Year", render: (r) => r.year },
  {
    key: "owner",
    header: "Owner",
    render: (r) => <OwnerLink ownerId={r.ownerId} name={r.owner.display_name} />,
  },
  {
    key: "actual",
    header: "Actual",
    info: STAT_DEFS.record,
    align: "right",
    render: (r) =>
      `${fmtRecord(r.actualWins, r.actualLosses, r.actualTies)} (${fmtPct(r.actualWinPct)})`,
  },
  {
    key: "ap",
    header: "All-Play",
    info: STAT_DEFS.allPlay,
    align: "right",
    render: (r) =>
      `${fmtRecord(r.allPlayWins, r.allPlayLosses, r.allPlayTies)} (${fmtPct(r.allPlayWinPct)})`,
  },
  {
    key: "luck",
    header: "Luck",
    info: STAT_DEFS.luck,
    align: "right",
    render: (r) => (
      <span
        className={
          r.luck > 0.05
            ? "text-accent-red"
            : r.luck < -0.05
              ? "text-accent-green"
              : "text-ink-dim"
        }
      >
        {r.luck > 0 ? "+" : ""}
        {fmtPct(r.luck)}
      </span>
    ),
  },
];

const luckIndexCols: Column<LuckIndexRow>[] = [
  { key: "year", header: "Year", render: (r) => r.year },
  {
    key: "owner",
    header: "Owner",
    render: (r) => <OwnerLink ownerId={r.owner.owner_id} name={r.owner.display_name} />,
  },
  {
    key: "pf",
    header: "PF Rank",
    info: "Where this owner ranked in regular-season Points For that year (1 = most points).",
    align: "right",
    render: (r) => ordinal(r.pfRank),
  },
  {
    key: "fin",
    header: "Finish",
    info: STAT_DEFS.finish,
    align: "right",
    render: (r) => ordinal(r.finishRank),
  },
  {
    key: "delta",
    header: "Delta",
    info: STAT_DEFS.luckIndex,
    align: "right",
    render: (r) => (
      <span
        className={
          r.delta > 0
            ? "text-accent-green"
            : r.delta < 0
              ? "text-accent-red"
              : "text-ink-dim"
        }
      >
        {r.delta > 0 ? "+" : ""}
        {r.delta}
      </span>
    ),
  },
];

const cursedCols: Column<CursedSeason>[] = [
  { key: "year", header: "Year", render: (r) => r.year },
  {
    key: "owner",
    header: "Owner",
    render: (r) => <OwnerLink ownerId={r.owner.owner_id} name={r.owner.display_name} />,
  },
  { key: "pf", header: "PF", info: STAT_DEFS.pf, align: "right", render: (r) => fmtNum(r.pointsFor) },
  {
    key: "fin",
    header: "Finished",
    info: STAT_DEFS.finish,
    align: "right",
    render: (r) => `${ordinal(r.finalStanding)} of ${r.totalTeams}`,
  },
];

const sosCols: Column<SOSRow>[] = [
  { key: "year", header: "Year", render: (r) => r.year },
  {
    key: "owner",
    header: "Owner",
    render: (r) => <OwnerLink ownerId={r.owner.owner_id} name={r.owner.display_name} />,
  },
  {
    key: "sos",
    header: "Avg Opp PF/G",
    info: STAT_DEFS.strengthOfSchedule,
    align: "right",
    render: (r) => fmtNum(r.avgOpponentPF),
  },
];

export default function LuckPage() {
  const allPlay = getAllPlayRecords();
  const luck = getLuckIndex();
  const cursed = getCursedSeasons(15);
  const sos = getStrengthOfSchedule();

  const teamCounts = getYears()
    .map((y) => getSeason(y)?.standings.length ?? 0)
    .filter((n) => n > 0);
  const minTeams = Math.min(...teamCounts);
  const maxTeams = Math.max(...teamCounts);
  const teamCountLabel =
    minTeams === maxTeams ? `${minTeams}-team` : `${minTeams}-to-${maxTeams}-team`;
  const exampleTeams = maxTeams; // use largest league size for the worked example
  const exampleBeat = Math.max(1, Math.floor((exampleTeams - 1) / 3));

  const luckiest = [...allPlay].sort((a, b) => b.luck * -1 - a.luck * -1).slice(0, 10);
  // ^ luckiest = won more than expected = actualPct > apPct = luck < 0
  const luckiestSorted = [...allPlay].sort((a, b) => a.luck - b.luck).slice(0, 10);
  const unluckiest = [...allPlay].sort((a, b) => b.luck - a.luck).slice(0, 10);
  void luckiest;

  const luckOverachievers = [...luck].sort((a, b) => b.delta - a.delta).slice(0, 10);
  const luckUnderachievers = [...luck].sort((a, b) => a.delta - b.delta).slice(0, 10);

  const sosToughest = [...sos].sort((a, b) => b.avgOpponentPF - a.avgOpponentPF).slice(0, 10);
  const sosEasiest = [...sos].sort((a, b) => a.avgOpponentPF - b.avgOpponentPF).slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Luck-Adjusted Records</h1>
          <p className="text-ink-dim text-sm mt-1">
            Fantasy football has a lot of randomness baked in. Two teams can
            score the exact same total and one goes 10-3 while the other goes
            6-7 — just because of who they happened to be scheduled against
            each week. These tables strip the schedule out so you can see who
            actually deserved their record, and who got robbed.
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-bg-subtle/40 px-4 py-3 text-sm space-y-2 text-ink-dim">
          <div className="text-[10px] uppercase tracking-wider text-ink-faint">
            How this works
          </div>
          <p>
            Each week, the <span className="text-ink">all-play</span> stat asks:
            <span className="text-ink"> &ldquo;what if you played every other team that week instead of just the one on your schedule?&rdquo;</span>{" "}
            In a {exampleTeams}-team season, if you outscored {exampleBeat} of
            the other {exampleTeams - 1} teams in a given week, that&rsquo;s a{" "}
            {exampleBeat}-{exampleTeams - 1 - exampleBeat} all-play record for
            that week. Tally it up across the whole season and you get an
            &ldquo;all-play win %&rdquo; that ignores the schedule entirely.
          </p>
          <p>
            The league has been a {teamCountLabel} format depending on the
            year, and the owners themselves have rotated in and out across
            seasons. All-play and luck are always computed against{" "}
            <span className="text-ink">just the teams that actually played that year</span>,
            so a 2020 season is judged against the 2020 field and a 2024
            season against the 2024 field — never mixed.
          </p>
          <p>
            <span className="text-accent-green">Lucky</span> seasons happen
            when a team scores worse than most of the league but keeps drawing
            the few teams scoring{" "}
            <span className="italic">even worse</span> — they pad their actual
            record on cupcake matchups. {" "}
            <span className="text-accent-red">Unlucky</span> seasons are the
            opposite: a team outscores most of the league every week but keeps
            drawing whoever exploded that week, so they lose games their
            scoring deserved.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Luckiest Seasons"
          subtitle="Scored worse than most of the league, but happened to draw the few teams scoring even worse week after week. Padded their actual record on cupcake matchups."
          info={STAT_DEFS.luck}
        >
          <StatTable rows={luckiestSorted} columns={apCols} rowKey={(r) => `${r.year}-${r.ownerId}`} />
        </Card>
        <Card
          title="Unluckiest Seasons"
          subtitle="Outscored most of the league every week, but kept drawing whichever team exploded that week. Lost games their scoring should have won."
          info={STAT_DEFS.luck}
        >
          <StatTable rows={unluckiest} columns={apCols} rowKey={(r) => `${r.year}-${r.ownerId}`} />
        </Card>
        <Card
          title="Overachievers"
          subtitle="Finished much higher in the standings than where their total points scored ranked them. They closed games out and won the ones that mattered."
          info={STAT_DEFS.luckIndex}
        >
          <StatTable rows={luckOverachievers} columns={luckIndexCols} rowKey={(r) => `${r.year}-${r.owner.owner_id}`} />
        </Card>
        <Card
          title="Underachievers"
          subtitle="Top of the league in points but near the bottom in the standings. Talented rosters that never showed up when it counted."
          info={STAT_DEFS.luckIndex}
        >
          <StatTable rows={luckUnderachievers} columns={luckIndexCols} rowKey={(r) => `${r.year}-${r.owner.owner_id}`} />
        </Card>
        <Card
          title="Cursed Seasons"
          subtitle="Teams with monster Points For totals that still missed the playoffs entirely. Should have been a contender, ended up watching."
          info={STAT_DEFS.cursedSeason}
        >
          <StatTable rows={cursed} columns={cursedCols} rowKey={(r) => `${r.year}-${r.owner.owner_id}`} />
        </Card>
        <Card
          title="Toughest Schedule"
          subtitle="Faced the hardest gauntlet of opponents — highest average opponent Points For per game in the regular season."
          info={STAT_DEFS.strengthOfSchedule}
        >
          <StatTable rows={sosToughest} columns={sosCols} rowKey={(r) => `${r.year}-${r.owner.owner_id}`} />
        </Card>
        <Card
          title="Easiest Schedule"
          subtitle="Drew the softest slate — lowest average opponent Points For per game in the regular season."
          info={STAT_DEFS.strengthOfSchedule}
        >
          <StatTable rows={sosEasiest} columns={sosCols} rowKey={(r) => `${r.year}-${r.owner.owner_id}`} />
        </Card>
        <Card
          title="All-Play Records, Every Season"
          subtitle="What every team's record would have been if they played every other team every week instead of just one. The truest measure of who scored the most consistently."
          info={STAT_DEFS.allPlay}
        >
          <StatTable
            rows={[...allPlay].sort((a, b) => b.year - a.year || b.allPlayWinPct - a.allPlayWinPct)}
            columns={apCols}
            rowKey={(r) => `${r.year}-${r.ownerId}-all`}
            compact
          />
        </Card>
      </div>
    </div>
  );
}

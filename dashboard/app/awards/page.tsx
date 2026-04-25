import Link from "next/link";
import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { InfoIcon } from "@/components/InfoIcon";
import { getSeasonChampions } from "@/lib/aggregations";
import { getBiggestImprovements } from "@/lib/streaks";
import { fmtNum, fmtPct } from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import type { Standing } from "@/lib/types";

function ownerCellOrDash(s: Standing | null | undefined, suffix?: string) {
  if (!s) return <span className="text-ink-faint">—</span>;
  return (
    <span>
      <OwnerLink ownerId={s.owner_id} name={s.owner} />
      {suffix && <span className="text-ink-faint"> {suffix}</span>}
    </span>
  );
}

function PodiumPyramid({
  champion,
  runnerUp,
  third,
  sacko,
}: {
  champion: Standing | null | undefined;
  runnerUp: Standing | null | undefined;
  third: Standing | null | undefined;
  sacko: Standing | null | undefined;
}) {
  // Pyramid silhouette: a true triangular apex (Champion) plus three
  // trapezoidal tiers tapering down to a full-width base (League Loser).
  // Each tier shares its bottom edge with the next tier's top edge so the
  // outline is continuous. Geometry tapers linearly from a point (50%/50%)
  // at y=0 to (0%/100%) at y=276 inside a 100x276 SVG viewBox; the SVG
  // stretches to fill the card width via preserveAspectRatio="none".
  //
  // Each tier is rendered as an SVG <polygon> with a translucent fill and
  // a solid stroke in its accent color (GitHub-banner style). `vector-effect:
  // non-scaling-stroke` keeps the border 1.25px regardless of card width.
  const layers = [
    {
      key: "champ",
      label: "Champion",
      owner: champion,
      tint: "245, 196, 81", // accent.gold
      points: "50,0 65.22,84 34.78,84",
      top: 0,
      height: 84,
    },
    {
      key: "runner",
      label: "Runner-up",
      owner: runnerUp,
      tint: "154, 166, 199", // ink.dim — silvery
      points: "34.78,84 65.22,84 76.81,148 23.19,148",
      top: 84,
      height: 64,
    },
    {
      key: "third",
      label: "Third Place",
      owner: third,
      tint: "76, 201, 240", // accent.blue
      points: "23.19,148 76.81,148 88.41,212 11.59,212",
      top: 148,
      height: 64,
    },
    {
      key: "loser",
      label: "League Loser",
      owner: sacko,
      tint: "255, 93, 108", // accent.red
      points: "11.59,212 88.41,212 100,276 0,276",
      top: 212,
      height: 64,
    },
  ];
  return (
    <div className="relative my-3" style={{ height: 276 }}>
      <svg
        aria-hidden
        viewBox="0 0 100 276"
        preserveAspectRatio="none"
        className="absolute inset-0 block h-full w-full overflow-visible"
      >
        {layers.map((layer) => (
          <polygon
            key={layer.key}
            points={layer.points}
            fill={`rgba(${layer.tint}, 0.12)`}
            stroke={`rgba(${layer.tint}, 0.95)`}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="absolute inset-x-0 flex flex-col items-center justify-end text-center px-2 pb-1.5 leading-tight text-ink"
          style={{ top: layer.top, height: layer.height }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: `rgb(${layer.tint})` }}
          >
            {layer.label}
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {layer.owner ? (
              layer.owner.owner_id ? (
                <Link
                  href={`/owners/${encodeURIComponent(layer.owner.owner_id)}/`}
                  className="no-underline hover:underline"
                  style={{ color: "inherit" }}
                >
                  {layer.owner.owner}
                </Link>
              ) : (
                <span>{layer.owner.owner}</span>
              )
            ) : (
              "—"
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AwardsPage() {
  const seasons = getSeasonChampions().sort((a, b) => b.year - a.year);
  const improvements = getBiggestImprovements().slice(0, 10);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hall of Fame &amp; Hall of Shame
        </h1>
        <p className="text-ink-dim text-sm mt-1">
          Per-season honors and dishonors going back to the league&apos;s founding.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {seasons.map((s) => (
          <Card
            key={s.year}
            title={
              <Link
                href={`/seasons/${s.year}/`}
                className="text-ink no-underline hover:text-accent"
              >
                {s.year}
              </Link>
            }
          >
            <PodiumPyramid
              champion={s.champion}
              runnerUp={s.runnerUp}
              third={s.third}
              sacko={s.sacko}
            />
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                <Award label="Reg-season title" info={STAT_DEFS.regularSeasonTitle}>
                  {ownerCellOrDash(s.regularSeasonLeader)}
                </Award>
                <Award label="Points leader" info={STAT_DEFS.pointsLeader}>
                  {ownerCellOrDash(
                    s.pointsLeader,
                    s.pointsLeader ? `(${fmtNum(s.pointsLeader.points_for)})` : undefined
                  )}
                </Award>
                <Award label="Most screwed (PA leader)" info={STAT_DEFS.mostScrewed}>
                  {ownerCellOrDash(
                    s.pointsAgainstLeader,
                    s.pointsAgainstLeader
                      ? `(${fmtNum(s.pointsAgainstLeader.points_against)})`
                      : undefined
                  )}
                </Award>
                <Award label="Highest single week" info={STAT_DEFS.highestWeek}>
                  {s.highestWeek ? (
                    <span>
                      <OwnerLink ownerId={s.highestWeek.ownerId} name={s.highestWeek.ownerName} />
                      <span className="text-ink-faint">
                        {" "}
                        • {fmtNum(s.highestWeek.score)} • W{s.highestWeek.week}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </Award>
                <Award label="Most consistent" info={STAT_DEFS.mostConsistent}>
                  {s.mostConsistent ? (
                    <span>
                      <OwnerLink ownerId={s.mostConsistent.row.owner_id} name={s.mostConsistent.row.owner} />
                      <span className="text-ink-faint">
                        {" "}
                        • σ {fmtNum(s.mostConsistent.stdDev)}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </Award>
                <Award label="Most volatile" info={STAT_DEFS.mostVolatile}>
                  {s.mostVolatile ? (
                    <span>
                      <OwnerLink ownerId={s.mostVolatile.row.owner_id} name={s.mostVolatile.row.owner} />
                      <span className="text-ink-faint">
                        {" "}
                        • σ {fmtNum(s.mostVolatile.stdDev)}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </Award>
              </tbody>
            </table>
          </Card>
        ))}
      </div>

      <Card
        title="Biggest Comebacks (Year-over-year win % gain)"
        info={STAT_DEFS.biggestComeback}
      >
        <ul className="text-sm divide-y divide-white/5">
          {improvements.map((imp, idx) => (
            <li
              key={`${imp.owner.owner_id}-${imp.fromYear}-${imp.toYear}`}
              className="flex items-center gap-3 py-2"
            >
              <span className="text-ink-faint w-6 text-right">{idx + 1}.</span>
              <OwnerLink ownerId={imp.owner.owner_id} name={imp.owner.display_name} />
              <span className="text-ink-faint">
                {imp.fromYear} → {imp.toYear}
              </span>
              <span className="ml-auto text-accent-green font-semibold">
                +{fmtPct(imp.delta)}
              </span>
              <span className="text-ink-faint text-xs">
                {fmtPct(imp.fromWinPct)} → {fmtPct(imp.toWinPct)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Award({
  label,
  info,
  children,
}: {
  label: string;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="text-left text-[10px] font-medium uppercase tracking-wider text-ink-faint py-2 pr-4 align-top whitespace-normal"
      >
        <span className="inline-flex items-center">
          {label}
          {info && <InfoIcon label={info} />}
        </span>
      </th>
      <td className="py-2 text-right align-top">{children}</td>
    </tr>
  );
}

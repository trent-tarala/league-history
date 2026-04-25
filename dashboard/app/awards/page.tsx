import Link from "next/link";
import { Card } from "@/components/Card";
import { OwnerLink } from "@/components/OwnerLink";
import { Trophy } from "@/components/Trophy";
import { InfoIcon } from "@/components/InfoIcon";
import { getSeasonChampions } from "@/lib/aggregations";
import { getBiggestImprovements } from "@/lib/streaks";
import { fmtNum, fmtPct } from "@/lib/constants";
import { STAT_DEFS } from "@/lib/stat-definitions";
import { cn } from "@/lib/cn";
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
  // trapezoidal tiers tapering down to the full-width base (League Loser).
  // Each layer's bottom edge equals the next layer's top edge so the
  // outline is continuous. Heights total 276px and the geometry tapers
  // linearly from a point (50% / 50%) at y=0 to (0% / 100%) at y=276.
  const layers = [
    {
      key: "champ",
      label: "Champion",
      owner: champion,
      tint: "245, 196, 81", // accent.gold
      // True triangle: point at top, base 30.43% wide (centered).
      clip: "polygon(50% 0%, 65.22% 100%, 34.78% 100%)",
      heightClass: "h-[84px]",
    },
    {
      key: "runner",
      label: "Runner-up",
      owner: runnerUp,
      tint: "154, 166, 199", // ink.dim — silvery
      clip: "polygon(34.78% 0%, 65.22% 0%, 76.81% 100%, 23.19% 100%)",
      heightClass: "h-16",
    },
    {
      key: "third",
      label: "Third Place",
      owner: third,
      tint: "76, 201, 240", // accent.blue
      clip: "polygon(23.19% 0%, 76.81% 0%, 88.41% 100%, 11.59% 100%)",
      heightClass: "h-16",
    },
    {
      key: "loser",
      label: "League Loser",
      owner: sacko,
      tint: "255, 93, 108", // accent.red
      clip: "polygon(11.59% 0%, 88.41% 0%, 100% 100%, 0% 100%)",
      heightClass: "h-16",
    },
  ];
  return (
    <div className="my-3">
      {layers.map((layer) => (
        <div
          key={layer.key}
          className={cn("relative", layer.heightClass)}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(${layer.tint}, 0.18), rgba(${layer.tint}, 0.45))`,
              clipPath: layer.clip,
            }}
          />
          <div className="absolute inset-x-0 bottom-1.5 flex flex-col items-center text-center px-2 leading-tight text-ink">
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
            <ul className="text-sm space-y-2">
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
            </ul>
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
  tier,
  info,
  children,
}: {
  label: string;
  tier?: "gold" | "silver" | "bronze" | "sacko";
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-baseline gap-2">
      {tier ? (
        <span className="inline-flex items-center">
          <Trophy label={label} tier={tier} />
          {info && <InfoIcon label={info} />}
        </span>
      ) : (
        <span className="text-[10px] uppercase tracking-wider text-ink-faint w-32 inline-flex items-center">
          {label}
          {info && <InfoIcon label={info} />}
        </span>
      )}
      <span className="ml-auto text-right">{children}</span>
    </li>
  );
}

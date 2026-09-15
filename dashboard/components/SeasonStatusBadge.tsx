import { Badge } from "@/components/Badge";
import {
  getSeasonStatus,
  seasonStatusLabel,
  type SeasonStatus,
} from "@/lib/season-status";

export function SeasonStatusBadge({ year }: { year: number | string }) {
  const status = getSeasonStatus(year);
  if (status === "complete") return null;
  return <Badge variant={statusVariant(status)}>{seasonStatusLabel(status)}</Badge>;
}

function statusVariant(status: SeasonStatus): "warning" | "playoff" | "default" {
  if (status === "playoffs") return "playoff";
  return "warning";
}

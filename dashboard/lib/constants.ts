export const MEDAL_BY_FINISH: Record<number, { label: string; color: string }> = {
  1: { label: "Champion", color: "text-accent-gold" },
  2: { label: "Runner-up", color: "text-ink-dim" },
  3: { label: "Third place", color: "text-orange-300" },
};

export function ordinal(n: number): string {
  if (Number.isNaN(n) || n == null) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function fmtPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function fmtNum(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtInt(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Math.round(value).toLocaleString();
}

export function fmtRecord(w: number, l: number, t = 0): string {
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

/** Hash a string into a stable color from a small palette. */
export const OWNER_PALETTE = [
  "#7c5cff",
  "#4cc9f0",
  "#f5c451",
  "#3ddc84",
  "#ff5d6c",
  "#f48fb1",
  "#80deea",
  "#ffb74d",
  "#9fa8da",
  "#a5d6a7",
  "#ce93d8",
  "#ef9a9a",
  "#90caf9",
];

export function colorForOwner(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return OWNER_PALETTE[hash % OWNER_PALETTE.length];
}

export const MATCHUP_TYPE_LABEL: Record<string, string> = {
  REGULAR: "Regular Season",
  WINNERS_BRACKET: "Playoffs",
  LOSERS_BRACKET: "Losers Bracket",
  WINNERS_CONSOLATION_LADDER: "Consolation",
  LOSERS_CONSOLATION_LADDER: "Toilet Bowl",
};

export function isPlayoffMatchup(matchupType: string): boolean {
  return matchupType === "WINNERS_BRACKET" || matchupType === "LOSERS_BRACKET";
}

export function isConsolationMatchup(matchupType: string): boolean {
  return (
    matchupType === "WINNERS_CONSOLATION_LADDER" ||
    matchupType === "LOSERS_CONSOLATION_LADDER"
  );
}

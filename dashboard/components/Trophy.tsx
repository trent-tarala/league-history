import { cn } from "@/lib/cn";

const COLORS: Record<string, string> = {
  gold: "from-yellow-300 to-amber-500 text-amber-950",
  silver: "from-slate-200 to-slate-400 text-slate-900",
  bronze: "from-orange-400 to-amber-700 text-amber-950",
  sacko: "from-rose-700 to-rose-900 text-rose-100",
  default: "from-indigo-400 to-indigo-600 text-indigo-950",
};

interface TrophyProps {
  label: string;
  tier?: keyof typeof COLORS;
  detail?: string;
  className?: string;
}

export function Trophy({ label, tier = "default", detail, className }: TrophyProps) {
  const palette = COLORS[tier] ?? COLORS.default;
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5",
        "text-[10px] font-semibold uppercase tracking-wider",
        "bg-gradient-to-b shadow-sm",
        palette,
        className
      )}
      title={detail}
    >
      {label}
      {detail && (
        <span className="text-[9px] opacity-80 normal-case font-normal">{detail}</span>
      )}
    </span>
  );
}

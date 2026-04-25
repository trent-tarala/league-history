import Link from "next/link";
import { colorForOwner, initials } from "@/lib/constants";
import { cn } from "@/lib/cn";

interface OwnerLinkProps {
  ownerId: string | null | undefined;
  name: string;
  showAvatar?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function OwnerLink({
  ownerId,
  name,
  showAvatar = false,
  className,
  size = "md",
}: OwnerLinkProps) {
  if (!ownerId) {
    return <span className="text-ink-dim">{name}</span>;
  }
  const href = `/owners/${encodeURIComponent(ownerId)}/`;
  const swatch = colorForOwner(ownerId);
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 no-underline hover:no-underline group",
        className
      )}
    >
      {showAvatar && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold text-[10px]",
            size === "sm" ? "w-5 h-5" : "w-7 h-7 text-xs"
          )}
          style={{ backgroundColor: swatch, color: "#0b1220" }}
        >
          {initials(name)}
        </span>
      )}
      <span className="text-ink group-hover:text-accent">{name}</span>
    </Link>
  );
}

export function OwnerSwatch({
  ownerId,
  name,
  size = 32,
}: {
  ownerId: string;
  name: string;
  size?: number;
}) {
  const swatch = colorForOwner(ownerId);
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{
        backgroundColor: swatch,
        color: "#0b1220",
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </span>
  );
}

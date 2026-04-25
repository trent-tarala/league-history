import Link from "next/link";
import { assetPath, colorForOwner, initials } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { getOwner } from "@/lib/data";

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
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 no-underline hover:no-underline group",
        className
      )}
    >
      {showAvatar && (
        <OwnerAvatar
          ownerId={ownerId}
          name={name}
          size={size === "sm" ? 20 : 28}
        />
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
  return <OwnerAvatar ownerId={ownerId} name={name} size={size} aria-hidden />;
}

interface OwnerAvatarProps {
  ownerId: string;
  name: string;
  size: number;
  "aria-hidden"?: boolean;
}

/** Renders the owner's cached team logo when available, else falls back to a
 *  colored initials swatch. */
function OwnerAvatar({
  ownerId,
  name,
  size,
  "aria-hidden": ariaHidden,
}: OwnerAvatarProps) {
  const owner = getOwner(ownerId);
  const avatar = owner?.avatar_path ?? null;
  const swatch = colorForOwner(ownerId);

  if (avatar) {
    return (
      <span
        aria-hidden={ariaHidden}
        className="inline-flex items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10 bg-bg-card"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(avatar)}
          alt={ariaHidden ? "" : `${name} avatar`}
          width={size}
          height={size}
          className="block w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden={ariaHidden}
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

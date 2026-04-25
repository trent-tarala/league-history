import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/owners/", label: "Owners" },
  { href: "/leaderboards/", label: "Leaderboards" },
  { href: "/records/", label: "Record Book" },
  { href: "/head-to-head/", label: "Head-to-Head" },
  { href: "/seasons/", label: "Seasons" },
  { href: "/streaks/", label: "Streaks" },
  { href: "/awards/", label: "Awards" },
  { href: "/luck/", label: "Luck" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-bg/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4 flex-wrap">
        <Link
          href="/"
          className="font-semibold tracking-tight text-ink no-underline hover:no-underline"
        >
          <span className="text-accent">FF</span> League History
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm ml-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-ink-dim hover:text-ink hover:bg-white/5 no-underline hover:no-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantasy Football League History",
  description: "Historical records, leaderboards, and stats for the league.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-10 text-xs text-ink-faint">
          Built from ESPN Fantasy Football data via the espn_api library.
        </footer>
      </body>
    </html>
  );
}

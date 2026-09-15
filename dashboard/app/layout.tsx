import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { assetUrl, getSiteOrigin, getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const title = "Venice Idiots";
const description =
  "Historical records, leaderboards, rivalries, and stats for the Venice Idiots fantasy football league.";
const ogImage = assetUrl("/opengraph-image");

export const metadata: Metadata = {
  // Origin only — basePath is applied explicitly on URLs below so og:image
  // doesn't become /league-history/league-history/... on GitHub Pages.
  metadataBase: new URL(getSiteOrigin()),
  title,
  description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: title,
    title,
    description,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Venice Idiots — Fantasy Football League History",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  appleWebApp: {
    title,
  },
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
        <main className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-10 text-xs text-ink-faint">
          Built from ESPN Fantasy Football data via the espn_api library.
        </footer>
      </body>
    </html>
  );
}

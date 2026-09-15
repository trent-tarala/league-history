const PRODUCTION_ORIGIN = "https://trent-tarala.github.io";

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

/** Origin only — use with getBasePath() when building asset URLs to avoid double-prefixing. */
export function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const basePath = getBasePath();
  if (basePath) return PRODUCTION_ORIGIN;
  return "http://localhost:3000";
}

/** Full public site URL including GitHub Pages project subpath. */
export function getSiteUrl(): string {
  const origin = getSiteOrigin();
  const basePath = getBasePath();
  if (!basePath) return origin;
  return `${origin}${basePath}`;
}

/** Absolute URL for a static asset (OG image, etc.). */
export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

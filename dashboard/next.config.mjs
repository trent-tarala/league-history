import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// When deploying to a GitHub Pages project site (https://<user>.github.io/<repo>/)
// the app needs to know its subpath so all asset URLs and internal links are
// prefixed correctly. CI sets NEXT_PUBLIC_BASE_PATH (e.g. "/league-history").
// Locally it's unset so dev/build serves at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  devIndicators: false,
};

export default nextConfig;

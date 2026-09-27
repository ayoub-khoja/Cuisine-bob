import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { SENTRY_TUNNEL_PATH } from "./lib/monitoring/sentry-config";
import { buildNextProductionHeaderRules } from "./lib/vercel/production-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "robohash.org",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ["@/components", "@/lib"],
  },

  // Security + /_next/static immutable cache — see lib/vercel/production-headers.ts
  async headers() {
    return buildNextProductionHeaderRules();
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "arnob-mahmuds-org",
  project: process.env.SENTRY_PROJECT ?? "stock-inventory",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Quiet local + Vercel/CI plugin output (REQ-0230 / guide Step 6b)
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  // Soft-fail source-map upload so missing SENTRY_AUTH_TOKEN does not fail builds
  errorHandler: (err) => {
    console.warn("[sentry] build plugin:", err.message);
  },
  // First-party tunnel — must match `tunnel` in instrumentation-client.ts (SENTRY_TUNNEL_PATH)
  tunnelRoute: SENTRY_TUNNEL_PATH,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
  webpack: {
    automaticVercelMonitors: true,
  },
});

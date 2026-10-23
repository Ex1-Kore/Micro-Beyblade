import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside the CMS repo but must build independently:
  // pin the Turbopack root here so Next never picks up the CMS
  // (parent lockfile, parent proxy.ts, parent tsconfig paths).
  turbopack: {
    root: __dirname,
  },
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

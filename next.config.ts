import type { NextConfig } from "next";

/**
 * Next.js Configuration
 * 
 * Optimized for:
 * - Vercel deployment
 * - Docker containerization
 * - Server-side rendering
 * - API routes
 */

const nextConfig: NextConfig = {
  // ================================================
  // Output Configuration (for Docker & Self-Hosting)
  // ================================================
  // Enables standalone builds for smaller Docker images
  // and self-hosted deployments
  output: 'standalone',

  // ================================================
  // Image Optimization
  // ================================================
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    // Use modern image formats
    formats: ["image/avif", "image/webp"],
  },

  // ================================================
  // Compression & Performance
  // ================================================
  compress: true,
  poweredByHeader: false,

  // ================================================
  // Headers for Security & Caching
  // ================================================
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Cache static assets
      {
        source: "/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ================================================
  // Environment Variables
  // ================================================
  env: {
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
  },

  // ================================================
  // Vercel Deployment Optimization
  // ================================================
  // Maximum serverless function size: 50MB
  // Automatic static optimization
  // Incremental Static Regeneration support enabled
};

export default nextConfig;

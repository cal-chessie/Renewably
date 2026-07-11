import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Allow preview proxy domains to access the dev server (HMR WebSockets, RSC, etc.)
  // NOTE: hostnames only (no protocol), wildcards supported
  allowedDevOrigins: [
    "*.space.chatglm.site",
    "*.space.z.ai",
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // optimizeCss disabled — causes framer-motion "reducedMotion is not defined" runtime error
    // with Turbopack dev mode. Re-enable for production build only.
    // optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@tanstack/react-query',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      // NOTE: framer-motion removed — Turbopack tree-shakes too aggressively,
      // causing "reducedMotion is not defined" ReferenceError at runtime
    ],
  },
  serverExternalPackages: ['stripe', 'ioredis'],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      // Static assets — aggressive cache in production (content-hashed filenames),
      // no-cache in dev so browser always gets fresh Turbopack chunks
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-store, no-cache, must-revalidate, proxy-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Turbopack dev chunks — must never be cached (hot-reloading breaks otherwise)
      {
        source: '/_next/dev/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Next.js image optimization — long cache in production, short in dev
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'public, max-age=60, stale-while-revalidate=300'
              : 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          // ── Content Security Policy (environment-aware) ──────────────────
          // DEV:  unsafe-inline + unsafe-eval required by Turbopack HMR
          // PROD: strict — no unsafe-inline, no unsafe-eval, no object-src
          {
            key: "Content-Security-Policy",
            value: process.env.NODE_ENV === "development"
              ? [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com",
                  "img-src 'self' data: blob: https:",
                  "connect-src 'self' https: wss:",
                  "frame-ancestors 'self' https://*.space.chatglm.site https://*.space.z.ai",
                  "base-uri 'self'",
                  "form-action 'self' https:",
                ].join("; ")
              : [
                  "default-src 'self'"
                "script-src 'self' 'unsafe-inline' https://js.stripe.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com",
                  "img-src 'self' data: blob: https:",
                  "connect-src 'self' https: wss:",
                  "frame-ancestors 'self'",
                  "base-uri 'self'",
                  "form-action 'self' https:",
                  "object-src 'none'",
                  "frame-src https://js.stripe.com https://hooks.stripe.com",
                ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // 1 year — enable for production
          },
        ],
      },
    ];
  },
};

export default nextConfig;

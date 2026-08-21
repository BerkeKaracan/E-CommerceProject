import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.asos-media.com" },
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/feedback-portal-verify.txt",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/((?!feedback-portal-verify\\.txt).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://images.asos-media.com https://cdn.dummyjson.com https://api.qrserver.com https://picsum.photos https://i.imgur.com; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://backend:8000 https://*;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

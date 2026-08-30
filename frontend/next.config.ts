import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mirror the production same-origin API proxy so the app works in local dev
  // even without NEXT_PUBLIC_API_URL set (see vercel.json). NEXT_PUBLIC_API_URL
  // may include /api/v1, so strip it before appending the rewrite suffix.
  async rewrites() {
    const apiBase = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
    ).replace(/\/api\/v1\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

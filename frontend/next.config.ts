import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mirror the production same-origin API proxy so the app works in local dev
  // even without NEXT_PUBLIC_API_URL set (see vercel.json).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

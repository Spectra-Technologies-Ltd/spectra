import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server rejects cross-origin asset/HMR requests, which silently
  // breaks hydration when the app is opened from a phone via a LAN IP: the page
  // renders but nothing is interactive, so the login form falls back to a
  // native submit and just reloads. Allow the local network hosts.
  allowedDevOrigins: [
    '172.20.10.6',
    '172.20.112.1',
    'localhost',
    '127.0.0.1',
  ],
  // Mirror the production same-origin API proxy so the app works in local dev
  // even without NEXT_PUBLIC_API_URL set (see vercel.json). NEXT_PUBLIC_API_URL
  // may include /api/v1, so strip it before appending the rewrite suffix.
  async rewrites() {
    const apiBase = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
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

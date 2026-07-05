import type { NextConfig } from "next";

const backendUrl = (
  process.env.BACKEND_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/_/backend` : "http://localhost:3000")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

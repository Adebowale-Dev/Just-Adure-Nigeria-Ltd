import process from "node:process";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
    return [{ source: "/api/v1/:path*", destination: `${backendUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;

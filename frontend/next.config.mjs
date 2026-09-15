import process from "node:process";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const scriptSource = `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://accounts.google.com`;
    const connectSource = `connect-src 'self' https://accounts.google.com${isDevelopment ? " http://localhost:4000 http://127.0.0.1:4000 ws://localhost:* ws://127.0.0.1:*" : ""}`;
    const upgradeInsecureRequests = isDevelopment ? "" : "; upgrade-insecure-requests";
    const securityHeaders = [
      { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; ${scriptSource}; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com; font-src 'self' data:; ${connectSource}; frame-src https://accounts.google.com${upgradeInsecureRequests}` },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    ];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
    return [{ source: "/api/v1/:path*", destination: `${backendUrl}/api/v1/:path*` }];
  },
};

export default nextConfig;

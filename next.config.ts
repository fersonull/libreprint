import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next blocks dev assets requested through the laptop's LAN IP unless its hostname is allowed.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  serverExternalPackages: ["bun:sqlite", "node:sqlite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

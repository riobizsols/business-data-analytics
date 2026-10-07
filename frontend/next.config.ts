import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow production builds to proceed even if ESLint finds issues.
  // This does NOT disable ESLint in dev; it only skips failing the build.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

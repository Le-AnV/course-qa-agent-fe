import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal production bundle for the Docker runner (see Dockerfile)
  output: "standalone",
};

export default nextConfig;

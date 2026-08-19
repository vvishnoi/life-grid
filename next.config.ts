import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Dockerfile's `.next/standalone` COPY step — without this
  // the Cloud Run container build fails, standalone output isn't produced.
  output: 'standalone',
};

export default nextConfig;

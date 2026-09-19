import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Notes are read from disk at build time.
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
};

export default nextConfig;

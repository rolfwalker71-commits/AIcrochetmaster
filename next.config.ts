import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;

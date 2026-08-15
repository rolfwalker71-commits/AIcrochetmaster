import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.20.80.244",
    "10.255.255.254",
  ],
  experimental: {
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;

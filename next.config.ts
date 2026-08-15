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
    proxyClientMaxBodySize: "50mb",
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|icons/|sw\\.js|manifest\\.webmanifest).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cdninstagram.com"
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net"
      },
      {
        protocol: "https",
        hostname: "lookaside.instagram.com"
      }
    ]
  }
};

export default nextConfig;

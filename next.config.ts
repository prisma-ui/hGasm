import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hgasm1.com" },
      { protocol: "https", hostname: "hgasm2.com" },
      { protocol: "https", hostname: "hgasm3.com" },
    ],
  },
};

export default nextConfig;

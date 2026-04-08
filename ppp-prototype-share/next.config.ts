import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.coursera.org" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
};

export default config;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.naturalpavingstore.co.uk",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;

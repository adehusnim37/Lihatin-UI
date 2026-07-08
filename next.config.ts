import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    const sharedHeaders = Object.entries(SECURITY_HEADERS).map(
      ([key, value]) => ({
        key,
        value,
      })
    );

    return [
      {
        source: "/:path*",
        headers: sharedHeaders,
      },
      {
        source: "/robots.txt",
        headers: [
          ...sharedHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          ...sharedHeaders,
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

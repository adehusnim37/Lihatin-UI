import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/+$/, "") ||
  "https://lihat.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

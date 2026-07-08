import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/+$/, "") ||
  "https://lihat.in";

const publicRoutes = [
  "",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/privacy",
  "/terms",
  "/support",
  "/support/new",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}

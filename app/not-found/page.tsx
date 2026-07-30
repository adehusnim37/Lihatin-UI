import type { Metadata } from "next";

import { NotFoundExperience } from "@/components/errors/not-found-experience";

export const metadata: Metadata = {
  title: "Page not found · Lihat.in",
  description: "This page could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPreviewPage() {
  return <NotFoundExperience />;
}

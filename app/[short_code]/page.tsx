"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import NotFound from "@/app/not-found";
import {
  RedirectCheckingScreen,
  RedirectExperience,
} from "@/components/redirect/redirect-experience";
import { useCheckShortCodeQuery } from "@/lib/hooks/queries/useAdminQuery";

export default function ShortCodePage() {
  const params = useParams<{ short_code: string }>();
  const router = useRouter();
  const shortCode = params.short_code ?? "";
  const { data: result, isLoading } = useCheckShortCodeQuery(shortCode);

  useEffect(() => {
    if (result?.status === "needs_passcode") {
      router.replace(`/${shortCode}/enter-passcode`);
    }
  }, [result?.status, router, shortCode]);

  if (isLoading || !result || result.status === "needs_passcode") {
    return <RedirectCheckingScreen />;
  }

  if (result.status === "not_found") {
    return <NotFound />;
  }

  return (
    <RedirectExperience
      preview={result.preview}
      redirectPath={`/r/${encodeURIComponent(shortCode)}`}
    />
  );
}

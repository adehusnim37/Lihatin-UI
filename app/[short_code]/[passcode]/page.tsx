"use client";

import { useParams } from "next/navigation";

import NotFound from "@/app/not-found";
import {
  RedirectCheckingScreen,
  RedirectExperience,
} from "@/components/redirect/redirect-experience";
import { useCheckShortCodeQuery } from "@/lib/hooks/queries/useAdminQuery";

export default function ShortCodeWithPasscodePage() {
  const params = useParams<{ short_code: string; passcode: string }>();
  const shortCode = params.short_code ?? "";
  const passcode = params.passcode ?? "";
  const { data: result, isLoading } = useCheckShortCodeQuery(shortCode, passcode);

  if (isLoading || !result) {
    return <RedirectCheckingScreen />;
  }

  if (result.status === "not_found") {
    return <NotFound />;
  }

  if (result.status === "needs_passcode") {
    return <NotFound />;
  }

  return (
    <RedirectExperience
      preview={result.preview}
      redirectPath={`/r/${encodeURIComponent(shortCode)}/${encodeURIComponent(passcode)}`}
      protectedLink
    />
  );
}

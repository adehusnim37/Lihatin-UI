"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const errorConfig: Record<
  string,
  { emoji: string; title: string; description: string }
> = {
  not_found: {
    emoji: "🔍",
    title: "Link Not Found",
    description:
      "The short link you're looking for doesn't exist or may have been removed.",
  },
  expired: {
    emoji: "⏰",
    title: "Link Expired",
    description: "This link has expired or has been deactivated by the owner.",
  },
  forbidden: {
    emoji: "🚫",
    title: "Access Denied",
    description: "This link has been banned due to policy violations.",
  },
  invalid_passcode: {
    emoji: "🔐",
    title: "Invalid Passcode",
    description: "The passcode you entered is incorrect. Please try again.",
  },
  rate_limit: {
    emoji: "🐌",
    title: "Too Many Requests",
    description:
      "You've made too many requests. Please wait a moment and try again.",
  },
  network: {
    emoji: "📡",
    title: "Connection Error",
    description:
      "Unable to connect to the server. Please check your connection.",
  },
  error: {
    emoji: "😢",
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again later.",
  },
};

function LinkErrorContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "";
  const type = searchParams.get("type") || "error";
  const message = searchParams.get("message");

  const config = errorConfig[type] || errorConfig.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6">{config.emoji}</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {config.title}
        </h1>
        <p className="text-muted-foreground mb-2">{config.description}</p>
        {message && (
          <p className="text-sm text-muted-foreground/70 mb-6 italic">
            {message}
          </p>
        )}
        {code && (
          <p className="text-xs text-muted-foreground/50 mb-6">
            Short code: /{code}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {type === "invalid_passcode" && code && (
            <Link
              href={`/${code}/enter-passcode`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LinkErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LinkErrorContent />
    </Suspense>
  );
}

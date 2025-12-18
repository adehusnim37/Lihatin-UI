"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShortCodePage() {
  const params = useParams<{ short_code: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const redirectToShortUrl = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

        // First check if the short link exists
        const response = await fetch(
          `${backendUrl}/short/${params.short_code}`,
          {
            method: "HEAD",
            redirect: "manual", // Don't follow redirects automatically
          }
        );

        if (response.status === 404 || response.status === 400) {
          setError("Short link not found or has expired");
          setIsLoading(false);
          return;
        }

        if (response.status === 429) {
          setError("Too many requests. Please try again later.");
          setIsLoading(false);
          return;
        }   

        // Wait 5 seconds before redirect with countdown
        for (let i = 5; i > 0; i--) {
          setCountdown(i);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // If valid, redirect
        window.location.href = `${backendUrl}/short/${params.short_code}`;
      } catch (err) {
        // Network error - still try to redirect after delay
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
        window.location.href = `${backendUrl}/short/${params.short_code}`;
      }
    };

    redirectToShortUrl();
  }, [params.short_code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Oops! Link Not Found
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="text-center">
        {/* Cycling Animation */}
        <div className="relative w-48 h-24 mx-auto mb-6 overflow-hidden">
          {/* Road */}
          <div className="absolute bottom-2 left-0 right-0 h-1 bg-muted-foreground/30 rounded-full" />

          {/* Cyclist Container - Moving */}
          <div className="absolute bottom-3 animate-ride">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              {/* Bicycle */}
              <circle cx="5" cy="17" r="3" />
              <circle cx="19" cy="17" r="3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              <path d="M12 17V5" />
              <path d="M5 17L12 5L19 17" />
              <path d="M12 5L8 9" />
              {/* Person body */}
              <circle cx="14" cy="4" r="1.5" />
              <path d="M12 5L14 8" />
              <path d="M14 8L16 6" />
            </svg>
          </div>

          {/* Dust particles */}
          <div className="absolute bottom-4 left-4 animate-dust">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full animate-pulse delay-100" />
              <div className="w-1 h-1 bg-muted-foreground/20 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2">
          Redirecting in {countdown}s...
        </h1>
        <p className="text-muted-foreground text-sm">
          Taking you to your destination 🚀
        </p>
        <p className="text-xs text-muted-foreground/60 mt-4">
          /{params.short_code}
        </p>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes ride {
          0% {
            left: -20%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes dust {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-ride {
          animation: ride 2s linear infinite;
        }

        .animate-dust {
          animation: dust 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

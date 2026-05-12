"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import NotFound from "@/app/not-found";
import { useCheckShortCodeQuery } from "@/lib/hooks/queries/useAdminQuery";

export default function ShortCodePage() {
  const params = useParams<{ short_code: string }>();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  const { data: status, isLoading } = useCheckShortCodeQuery(params.short_code ?? "");

  useEffect(() => {
    if (status === "needs_passcode") {
      router.replace(`/${params.short_code}/enter-passcode`);
    }
  }, [status, params.short_code, router]);

  useEffect(() => {
    if (status !== "valid") return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, status]);

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (status === "valid" && countdown === 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      window.location.href = `/r/${params.short_code}`;
    }
  }, [countdown, status, params.short_code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Checking link...</p>
        </div>
      </div>
    );
  }

  // Not found - show the NotFound component
  if (status === "not_found") {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="text-center">
        {/* Cycling Animation */}
        <div className="relative w-48 h-24 mx-auto mb-6 overflow-hidden">
          <div className="absolute bottom-2 left-0 right-0 h-1 bg-muted-foreground/30 rounded-full" />
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
              <circle cx="5" cy="17" r="3" />
              <circle cx="19" cy="17" r="3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              <path d="M12 17V5" />
              <path d="M5 17L12 5L19 17" />
              <path d="M12 5L8 9" />
              <circle cx="14" cy="4" r="1.5" />
              <path d="M12 5L14 8" />
              <path d="M14 8L16 6" />
            </svg>
          </div>
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

        <div className="w-48 h-1 bg-muted rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
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

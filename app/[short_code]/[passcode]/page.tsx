"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import NotFound from "@/app/not-found";

type LinkStatus = "loading" | "valid" | "not_found" | "error";

export default function ShortCodeWithPasscodePage() {
  const params = useParams<{ short_code: string; passcode: string }>();
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);
  const [status, setStatus] = useState<LinkStatus>("loading");

  // First, validate if the short code exists
  useEffect(() => {
    const validateShortCode = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

        const response = await fetch(
          `${apiUrl}/short/check/${params.short_code}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok || response.status === 401) {
          // Short code exists - show countdown and redirect
          setStatus("valid");
        } else if (response.status === 404) {
          // Short code doesn't exist - show 404 UI
          setStatus("not_found");
        } else {
          // Other error - still try to redirect
          setStatus("valid");
        }
      } catch (error) {
        // API unreachable - fallback
        setStatus("valid");
      }
    };

    if (params.short_code) {
      validateShortCode();
    }
  }, [params.short_code, router]);

  // Countdown timer - only starts when status is "valid"
  useEffect(() => {
    if (status !== "valid") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(`/r/${params.short_code}/${params.passcode}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [params.short_code, params.passcode, router, status]);

  // Loading state
  if (status === "loading") {
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
        <div className="relative w-48 h-24 mx-auto mb-6 overflow-hidden">
          <div className="absolute bottom-2 left-0 right-0 h-1 bg-muted-foreground/30 rounded-full" />
          <div className="absolute bottom-3 animate-walk">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary animate-bounce-subtle"
            >
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v6" />
              <path d="M9 10l3 2 3-2" />
              <path d="M12 13l-3 5" />
              <path d="M12 13l3 5" />
            </svg>
          </div>
          <div className="absolute bottom-3 left-8 flex gap-4 animate-footprints">
            <div className="w-2 h-1 bg-muted-foreground/20 rounded-full" />
            <div className="w-2 h-1 bg-muted-foreground/15 rounded-full" />
            <div className="w-2 h-1 bg-muted-foreground/10 rounded-full" />
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2">Verifying passcode...</h1>
        <p className="text-muted-foreground text-sm">Checking your access 🔐</p>
        <p className="text-xs text-muted-foreground/60 mt-4">
          /{params.short_code}/****
        </p>

        <div className="w-48 h-1 bg-muted rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${((2 - countdown) / 2) * 100}%` }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes walk {
          0% {
            left: -10%;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @keyframes footprints {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-walk {
          animation: walk 3s linear infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 0.4s ease-in-out infinite;
        }
        .animate-footprints {
          animation: footprints 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

"use client";

import BlobDefault from "@/components/blob/blob-default";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const errorConfig: Record<string, { title: string; description: string }> = {
  token_required: {
    title: "Revoke Link Invalid",
    description: "Revoke token is required. Please use the original link from your email.",
  },
  token_expired: {
    title: "Revoke Link Expired",
    description: "This revoke link has expired. Please secure your account from the settings page.",
  },
  token_not_found: {
    title: "Revoke Link Not Found",
    description: "This revoke link is invalid or has already been used.",
  },
  invalid_request: {
    title: "Invalid Revoke Request",
    description: "This request cannot be processed for the current email change state.",
  },
  revoke_failed: {
    title: "Revoke Failed",
    description: "We couldn't revoke the email change. Please try again or contact support.",
  },
};

function RevokeEmailChangeContent() {
  const searchParams = useSearchParams();

  const status = searchParams.get("status");
  const error = searchParams.get("error") || "revoke_failed";
  const isSuccess = status === "success";
  const errorDetails = errorConfig[error] || errorConfig.revoke_failed;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <BlobDefault />

      <Card className="relative z-10 w-full max-w-xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="relative mx-auto h-52 w-full max-w-md">
            <Image
              src={isSuccess ? "/Completed-bro.svg" : "/404.svg"}
              alt={isSuccess ? "Email change revoked" : "Revoke failed"}
              fill
              className="object-contain"
            />
          </div>

          <div className="flex justify-center">
            <div
              className={`rounded-full p-3 ${
                isSuccess
                  ? "bg-green-500/10 text-green-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
          </div>

          <CardTitle className="text-2xl font-bold">
            {isSuccess ? "Email Change Revoked" : errorDetails.title}
          </CardTitle>
          <CardDescription className="text-base">
            {isSuccess
              ? "Email change has been revoked. Your original email has been restored and verified."
              : errorDetails.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-3 pb-8">
          <Link href="/auth/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full min-w-[200px]">
              Go to Login
            </Button>
          </Link>

          {!isSuccess && (
            <Link href="/main" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full min-w-[200px]">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RevokeEmailChangePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RevokeEmailChangeContent />
    </Suspense>
  );
}

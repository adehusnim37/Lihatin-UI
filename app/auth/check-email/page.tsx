"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BlobDefault from "@/components/blob/blob-default";
import {
  checkVerificationStatusByIdentifier,
  resendVerificationEmail,
} from "@/lib/api/auth";
import { decodeIdentifierFromQuery } from "@/lib/utils/identifier";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

function formatCooldown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const encodedIdentifier = useMemo(
    () => searchParams.get("identifier")?.trim() || "",
    [searchParams]
  );
  const autoResend = useMemo(
    () => searchParams.get("auto_resend") === "1",
    [searchParams]
  );
  const decodedIdentifier = useMemo(
    () => decodeIdentifierFromQuery(encodedIdentifier),
    [encodedIdentifier]
  );

  const cooldownStorageKey = useMemo(
    () => `verify_cooldown_until:${encodedIdentifier}`,
    [encodedIdentifier]
  );

  const [isSending, setIsSending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const pollingInFlightRef = useRef(false);
  const redirectedRef = useRef(false);
  const autoResendTriggeredRef = useRef(false);

  useEffect(() => {
    autoResendTriggeredRef.current = false;
  }, [encodedIdentifier]);

  const syncCooldownFromStorage = useCallback(() => {
    if (!encodedIdentifier) {
      setCooldownLeft(0);
      return;
    }

    const cooldownUntilRaw = sessionStorage.getItem(cooldownStorageKey);
    const cooldownUntil = Number(cooldownUntilRaw || "0");
    const secondsRemaining = Math.max(
      0,
      Math.ceil((cooldownUntil - Date.now()) / 1000)
    );
    setCooldownLeft(secondsRemaining);
  }, [cooldownStorageKey, encodedIdentifier]);

  const startCooldown = useCallback(
    (seconds: number) => {
      const cooldownUntil = Date.now() + seconds * 1000;
      sessionStorage.setItem(cooldownStorageKey, String(cooldownUntil));
      syncCooldownFromStorage();
    },
    [cooldownStorageKey, syncCooldownFromStorage]
  );

  const resolveCooldownFromResponse = useCallback((data: unknown): number => {
    if (!data || typeof data !== "object") {
      return 0;
    }

    const payload = data as Record<string, unknown>;

    const remaining = payload.cooldown_remaining_seconds;
    if (typeof remaining === "number" && remaining > 0) {
      return Math.ceil(remaining);
    }

    const cooldown = payload.cooldown_seconds;
    if (typeof cooldown === "number" && cooldown > 0) {
      return Math.ceil(cooldown);
    }

    return 0;
  }, []);

  const triggerResend = useCallback(
    async (showToast = true, bypassLocalCooldown = false) => {
      if (!encodedIdentifier || !decodedIdentifier) {
        if (showToast) {
          toast.error("Validation Error", {
            description: "Invalid verification session. Please login and try again.",
            duration: 3000,
          });
        }
        return;
      }

      if (!bypassLocalCooldown && cooldownLeft > 0) {
        return;
      }

      try {
        setIsSending(true);
        const response = await resendVerificationEmail({
          identifier: encodedIdentifier,
        });

        const cooldownFromServer = resolveCooldownFromResponse(response.data);
        if (cooldownFromServer > 0) {
          startCooldown(cooldownFromServer);
        }

        if (showToast) {
          toast.success("Verification Email Sent", {
            description:
              response.message ||
              "If account exists and not verified, new link has been sent.",
            duration: 4000,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to resend verification email.";

        if (showToast) {
          toast.error("Resend Failed", {
            description: message,
            duration: 4000,
          });
        }
      } finally {
        setIsSending(false);
      }
    },
    [
      cooldownLeft,
      decodedIdentifier,
      encodedIdentifier,
      resolveCooldownFromResponse,
      startCooldown,
    ]
  );

  const handleResend = async () => {
    await triggerResend(true);
  };

  useEffect(() => {
    if (!encodedIdentifier) return;
    syncCooldownFromStorage();
  }, [encodedIdentifier, syncCooldownFromStorage]);

  useEffect(() => {
    if (!encodedIdentifier) return;

    const timer = setInterval(syncCooldownFromStorage, 1000);
    return () => clearInterval(timer);
  }, [encodedIdentifier, syncCooldownFromStorage]);

  useEffect(() => {
    if (!autoResend || !encodedIdentifier || !decodedIdentifier) return;
    if (autoResendTriggeredRef.current) return;

    autoResendTriggeredRef.current = true;
    void triggerResend(false, true);
  }, [
    autoResend,
    decodedIdentifier,
    encodedIdentifier,
    triggerResend,
  ]);

  useEffect(() => {
    if (!encodedIdentifier || !decodedIdentifier) return;

    const pollStatus = async () => {
      if (pollingInFlightRef.current || redirectedRef.current) return;

      pollingInFlightRef.current = true;
      setIsCheckingStatus(true);
      try {
        const verified = await checkVerificationStatusByIdentifier(
          encodedIdentifier
        );
        if (verified && !redirectedRef.current) {
          redirectedRef.current = true;
          toast.success("Email Verified", {
            description: "Verification detected. Redirecting...",
            duration: 2000,
          });
          router.push("/auth/success-verify-email");
        }
      } finally {
        pollingInFlightRef.current = false;
        setIsCheckingStatus(false);
      }
    };

    void pollStatus();
    const interval = setInterval(() => {
      void pollStatus();
    }, 12000);

    return () => clearInterval(interval);
  }, [decodedIdentifier, encodedIdentifier, router]);

  const resendButtonLabel = useMemo(() => {
    if (isSending) return "Sending...";
    if (cooldownLeft > 0) return `Wait ${formatCooldown(cooldownLeft)}`;
    return "Resend verification email";
  }, [cooldownLeft, isSending]);

  return (
    <div className="relative flex min-h-full items-center justify-center bg-background p-6 overflow-hidden">
      <BlobDefault />
      <Card className="w-full max-w-xl relative z-10 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="Lihatin Logo"
              width={100}
              height={100}
              className="h-16 w-16 rounded"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <MailIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold">
              <h1 className="text-2xl font-bold">Check your email</h1>
            </CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent a verification link to your email address. Please
              check your inbox and click link to verify your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground text-center">
            {!decodedIdentifier && (
              <p className="text-destructive text-xs">
                Missing or invalid identifier. Go back to login then try again.
              </p>
            )}
            {decodedIdentifier && (
              <>
                <p>
                  {isCheckingStatus
                    ? "Checking verification status..."
                    : "Waiting for email verification..."}
                </p>
              </>
            )}
            <Button
              variant="outline"
              className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={isSending || !decodedIdentifier || cooldownLeft > 0}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {resendButtonLabel}
                </>
              ) : (
                resendButtonLabel
              )}
            </Button>
            {decodedIdentifier && cooldownLeft === 0 && (
              <p className="text-xs">You can resend now.</p>
            )}
          </div>
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}

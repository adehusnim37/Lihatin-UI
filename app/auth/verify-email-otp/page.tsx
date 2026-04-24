"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import BlobDefault from "@/components/blob/blob-default";
import { OTPForm } from "@/components/otp-form";
import {
  resendLoginEmailOTP,
  requiresEmailOTP,
  requiresTOTP,
  saveUserData,
  verifyLoginEmailOTP,
} from "@/lib/api/auth";
import {
  buildAuthSupportURL,
  getAuthSupportReasonFromMessage,
} from "@/lib/auth-support";
import { useAuth } from "@/app/context/AuthContext";
const TOTP_PROMPT_PENDING_KEY = "totp_migration_prompt_pending";

function VerifyEmailOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportLink, setSupportLink] = useState<string | null>(null);

  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/main",
    [searchParams]
  );

  useEffect(() => {
    const token = sessionStorage.getItem("pending_email_otp_challenge") || "";
    const pendingEmail = sessionStorage.getItem("pending_email_otp_email") || "";

    if (!token) {
      toast.error("Verification Session Missing", {
        description: "Please login again.",
        duration: 3000,
      });
      router.push("/auth/login");
      return;
    }

    setChallengeToken(token);
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [router]);

  const cleanupPendingOTP = () => {
    sessionStorage.removeItem("pending_email_otp_challenge");
    sessionStorage.removeItem("pending_email_otp_email");
  };

  const continueAfterLogin = () => {
    router.push(redirectTo);
  };

  const handleVerify = async (otp: string) => {
    if (!challengeToken) return;

    setIsSubmitting(true);
    setError(null);
    setSupportLink(null);

    try {
      const response = await verifyLoginEmailOTP({
        challenge_token: challengeToken,
        otp_code: otp,
      });

      if (response.success && response.data) {
        if (requiresTOTP(response.data)) {
          sessionStorage.setItem(
            "pending_auth_token",
            response.data.pending_auth_token
          );
          sessionStorage.setItem("pending_user", JSON.stringify(response.data.user));
          cleanupPendingOTP();
          router.push("/auth/verify-login");
          return;
        }

        if (requiresEmailOTP(response.data)) {
          // Defensive fallback, should not happen on verify endpoint.
          sessionStorage.setItem(
            "pending_email_otp_challenge",
            response.data.challenge_token
          );
          return;
        }

        saveUserData(response.data.user);
        cleanupPendingOTP();
        await auth.login();
        sessionStorage.setItem(TOTP_PROMPT_PENDING_KEY, "1");

        toast.success("Login Successful", {
          description: `Welcome back, ${response.data.user.first_name}!`,
          duration: 2500,
        });
        continueAfterLogin();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid verification code";
      setError(message);
      toast.error("Verification Failed", {
        description: message,
        duration: 4000,
      });
      const supportReason = getAuthSupportReasonFromMessage(message);
      if (supportReason) {
        setSupportLink(buildAuthSupportURL(supportReason, email));
      }

      if (message.toLowerCase().includes("expired")) {
        router.push("/auth/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!challengeToken) return;

    setIsResending(true);
    try {
      const response = await resendLoginEmailOTP({
        challenge_token: challengeToken,
      });

      const remaining = response.data?.cooldown_remaining_seconds;
      if (typeof remaining === "number" && remaining > 0) {
        toast.info("Please Wait", {
          description: `You can resend in ${remaining} seconds`,
          duration: 2500,
        });
        return remaining;
      }

      toast.success("Code Resent", {
        description: "A new verification code has been sent to your email",
        duration: 2500,
      });
      return response.data?.cooldown_seconds || 60;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend code";
      toast.error("Resend Failed", {
        description: message,
        duration: 3500,
      });
      return;
    } finally {
      setIsResending(false);
    }
  };

  if (!challengeToken) {
    return null;
  }

  return (
    <div className="bg-background flex min-h-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <BlobDefault />
      <div className="w-full max-w-sm">
        <OTPForm
          email={email}
          description="Enter the 6-digit code sent to your email"
          onVerify={handleVerify}
          onResend={handleResend}
          isSubmitting={isSubmitting}
          isResending={isResending}
          resendCooldown={60}
          error={error}
        />
        {supportLink && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Need help accessing your account?
            </p>
            <Link href={supportLink} className="text-sm text-primary hover:underline">
              Contact Support →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailOTPContent />
    </Suspense>
  );
}

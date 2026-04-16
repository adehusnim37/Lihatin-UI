"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import BlobDefault from "@/components/blob/blob-default";
import { OTPForm } from "@/components/otp-form";
import {
  signupResendOTP,
  signupVerifyOTP,
} from "@/lib/api/auth";

function VerifySignupOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const challengeFromQuery = useMemo(
    () => searchParams.get("challenge_token")?.trim() || "",
    [searchParams]
  );

  useEffect(() => {
    const storedToken = sessionStorage.getItem("pending_signup_challenge") || "";
    const resolvedToken = challengeFromQuery || storedToken;

    if (!resolvedToken) {
      toast.error("Signup Session Missing", {
        description: "Please restart signup from the registration page.",
        duration: 3500,
      });
      router.push("/auth/register");
      return;
    }

    sessionStorage.setItem("pending_signup_challenge", resolvedToken);
    setChallengeToken(resolvedToken);

    const storedEmail = sessionStorage.getItem("pending_signup_email") || "";
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, [challengeFromQuery, router]);

  const handleVerify = async (otp: string) => {
    if (!challengeToken) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await signupVerifyOTP({
        challenge_token: challengeToken,
        otp_code: otp,
      });

      if (response.success && response.data) {
        sessionStorage.removeItem("pending_signup_challenge");
        toast.success("Email Verified", {
          description: "Continue to complete your profile",
          duration: 2500,
        });

        router.push(
          `/auth/complete-profile?signup_token=${encodeURIComponent(
            response.data.signup_token
          )}`
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code";
      setError(message);
      toast.error("Verification Failed", {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!challengeToken) return;

    setIsResending(true);
    try {
      const response = await signupResendOTP({ challenge_token: challengeToken });
      const remaining = response.data?.cooldown_remaining_seconds;
      if (typeof remaining === "number" && remaining > 0) {
        toast.info("Please Wait", {
          description: `You can resend in ${remaining} seconds`,
          duration: 2500,
        });
        return remaining;
      }

      toast.success("Verification Code Resent", {
        description: "Please check your inbox",
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
          description="Enter the 6-digit code sent to your email to continue signup"
          onVerify={handleVerify}
          onResend={handleResend}
          isSubmitting={isSubmitting}
          isResending={isResending}
          resendCooldown={60}
          error={error}
        />
      </div>
    </div>
  );
}

export default function VerifySignupOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifySignupOTPContent />
    </Suspense>
  );
}

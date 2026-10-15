"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import BlobDefault from "@/components/blob/blob-default";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPForm } from "@/components/otp-form";
import { AuthenticatedTransition } from "@/components/auth/authenticated-transition";
import { verifyTOTPLogin, saveUserData } from "@/lib/api/auth";
import { buildAuthSupportURL, getAuthSupportReasonFromMessage } from "@/lib/auth-support";
import { useAuth } from "@/app/context/AuthContext";

const subscribe = () => () => {};

export default function VerifyLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingAuthToken = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => sessionStorage.getItem("pending_auth_token"),
    () => undefined,
  );
  const pendingUser = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => sessionStorage.getItem("pending_user"),
    () => undefined,
  );
  let userEmail: string | undefined;
  try {
    userEmail = pendingUser ? JSON.parse(pendingUser).email : undefined;
  } catch {
    /* Invalid stored identity is optional. */
  }
  const [supportLink, setSupportLink] = useState<string | null>(null);
  const [isAuthenticatedTransitioning, setIsAuthenticatedTransitioning] = useState(false);

  useEffect(() => {
    if (pendingAuthToken === null) {
      toast.error("Session Expired", { description: "Please login again", duration: 3000 });
      router.replace("/auth/login");
    }
  }, [pendingAuthToken, router]);

  const handleVerify = async (otp: string) => {
    if (!pendingAuthToken) {
      toast.error("Session Expired", {
        description: "Please login again",
        duration: 3000,
      });
      router.push("/auth/login");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSupportLink(null);

    try {
      // Call new endpoint that issues JWT tokens ONLY after TOTP verification
      const response = await verifyTOTPLogin({
        pending_auth_token: pendingAuthToken,
        ...(recoveryMode ? { recovery_code: otp } : { totp_code: otp }),
      });

      if (response.success && response.data) {
        // Clear pending auth data
        sessionStorage.removeItem("pending_auth_token");
        sessionStorage.removeItem("pending_user");

        // Save user data
        saveUserData(response.data.user);

        toast.success("Verification Successful!", {
          description: "You are now logged in.",
          duration: 3000,
        });

        // Update auth context
        await auth.login(response.data);

        setIsAuthenticatedTransitioning(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid verification code";
      setError(message);
      toast.error("Verification Failed", {
        description: message,
        duration: 4000,
      });
      const supportReason = getAuthSupportReasonFromMessage(message);
      if (supportReason) {
        setSupportLink(buildAuthSupportURL(supportReason, userEmail, "totp"));
      }

      if (message.toLowerCase().includes("expired") || message === "Authentication expired") {
        router.push("/auth/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until we check for pending token
  if (!pendingAuthToken) {
    return null;
  }

  return (
    <div className="bg-background flex min-h-full flex-col items-center justify-center gap-6 p-4 sm:p-6 md:p-10">
      <BlobDefault />
      <div className="w-full max-w-sm">
        {recoveryMode ? (
          <form
            className="space-y-5 rounded-xl border bg-card p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleVerify(recoveryCode);
            }}
          >
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Use a recovery code</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Enter one of the codes you saved when setting up your authenticator. Each code works
                once.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-code">Recovery code</Label>
              <Input
                id="recovery-code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABCD-1234"
                maxLength={9}
                value={recoveryCode}
                onChange={(event) =>
                  setRecoveryCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))
                }
                disabled={isSubmitting}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || recoveryCode.replace(/-/g, "").length !== 8}
            >
              {isSubmitting ? "Verifying…" : "Verify recovery code"}
            </Button>
          </form>
        ) : (
          <OTPForm
            verificationMethod="totp"
            onVerify={handleVerify}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
        <Button
          variant="link"
          className="mt-3 min-h-11 w-full"
          disabled={isSubmitting}
          onClick={() => {
            setRecoveryMode(!recoveryMode);
            setError(null);
            setRecoveryCode("");
          }}
        >
          {recoveryMode ? "Use an authenticator code instead" : "Use a recovery code instead"}
        </Button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Lost your authenticator and recovery codes?{" "}
          <Link
            href={buildAuthSupportURL("LOST_2FA", userEmail, "totp")}
            className="font-medium text-primary-ink underline-offset-4 hover:underline"
          >
            Get account recovery help
          </Link>
        </p>
        {supportLink && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground mb-2">Need help accessing your account?</p>
            <Link href={supportLink} className="text-sm text-primary-ink hover:underline">
              Contact Support →
            </Link>
          </div>
        )}
      </div>
      <AuthenticatedTransition
        active={isAuthenticatedTransitioning}
        onComplete={() => router.push("/main")}
      />
    </div>
  );
}

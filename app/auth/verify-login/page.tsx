"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BlobDefault from "@/components/blob/blob-default";
import { OTPForm } from "@/components/otp-form";
import { verifyTOTPLogin, saveUserData } from "@/lib/api/auth";
import { useAuth } from "@/app/context/AuthContext";

export default function VerifyLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAuthToken, setPendingAuthToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    // Get pending auth token from sessionStorage (set during login)
    const token = sessionStorage.getItem("pending_auth_token");
    const pendingUser = sessionStorage.getItem("pending_user");

    if (!token) {
      // No pending auth - redirect to login
      toast.error("Session Expired", {
        description: "Please login again",
        duration: 3000,
      });
      router.push("/auth/login");
      return;
    }

    setPendingAuthToken(token);

    if (pendingUser) {
      try {
        const user = JSON.parse(pendingUser);
        setUserEmail(user.email);
      } catch {
        // ignore parse error
      }
    }
  }, [router]);

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

    try {
      // Call new endpoint that issues JWT tokens ONLY after TOTP verification
      const response = await verifyTOTPLogin({
        pending_auth_token: pendingAuthToken,
        totp_code: otp,
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
        await auth.login();

        // Redirect to main page
        router.push("/main");
      }
    } catch (err: any) {
      const message = err.message || "Invalid verification code";
      setError(message);
      toast.error("Verification Failed", {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until we check for pending token
  if (pendingAuthToken === null) {
    return null;
  }

  return (
    <div className="bg-background flex min-h-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <BlobDefault />
      <div className="w-full max-w-sm">
        <OTPForm
          email={userEmail}
          onVerify={handleVerify}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}

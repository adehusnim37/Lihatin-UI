"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { TermsDialog } from "@/components/auth/terms-dialog";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signupStart, startGoogleOAuth } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 48 48"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.5 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.6l.1-.1 6.2 5.2C37.1 39 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Ensure loading flags are cleared when returning from external OAuth flow.
  useEffect(() => {
    const resetLoadingState = () => {
      setIsLoading(false);
      setIsGoogleLoading(false);
    };

    // pageshow covers browser back/forward (including bfcache restore)
    const handlePageShow = () => {
      resetLoadingState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetLoadingState();
      }
    };

    resetLoadingState();
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  const [formData, setFormData] = useState({
    email: "",
    agree_terms: false,
  });
  const isAnyLoading = isLoading || isGoogleLoading;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email) {
      toast.error("Validation Error", {
        description: "Please enter your email",
        duration: 3000,
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Validation Error", {
        description: "Please enter a valid email address",
        duration: 3000,
      });
      return false;
    }

    if (!formData.agree_terms) {
      toast.error("Validation Error", {
        description: "You must agree to the Terms & Conditions",
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  const handleStartSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await signupStart({
        email: formData.email.trim(),
      });

      if (response.success && response.data) {
        sessionStorage.setItem(
          "pending_signup_email",
          formData.email.trim().toLowerCase()
        );

        if (
          response.data.requires_profile_completion &&
          response.data.signup_token
        ) {
          toast.success("Signup Session Found", {
            description: "Email already verified. Continue completing your profile.",
            duration: 3500,
          });
          router.push(
            `/auth/complete-profile?signup_token=${encodeURIComponent(
              response.data.signup_token
            )}`
          );
          return;
        }

        if (!response.data.challenge_token) {
          throw new Error("Signup challenge is missing. Please try again.");
        }

        toast.success("Verification Code Sent", {
          description: "Please check your email and enter the 6-digit code.",
          duration: 3500,
        });

        router.push(
          `/auth/verify-signup-otp?challenge_token=${encodeURIComponent(
            response.data.challenge_token
          )}`
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.";

      toast.error("Signup Failed", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!formData.agree_terms) {
      toast.error("Validation Error", {
        description: "You must agree to the Terms & Conditions",
        duration: 3000,
      });
      return;
    }

    setIsGoogleLoading(true);

    try {
      const response = await startGoogleOAuth({ intent: "signup" });
      const authorizationURL = response.data?.authorization_url;

      if (!authorizationURL) {
        throw new Error("Google OAuth URL is not available");
      }

      sessionStorage.setItem("post_login_redirect", "/main");
      window.location.assign(authorizationURL);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start Google sign-up.";

      toast.error("Google Sign-up Failed", {
        description: errorMessage,
        duration: 4000,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Start for free"
      title="Create your account"
      description="Start with your email. We’ll send a one-time verification code—no password setup yet."
      visualTitle="One short link can open a clearer view."
      visualDescription="Create memorable links, understand every visit, and keep control of where your audience lands."
    >
      <form onSubmit={handleStartSignup} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="you@example.com"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isAnyLoading}
            className="h-11"
            required
          />
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="agree_terms"
            checked={formData.agree_terms}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({
                ...prev,
                agree_terms: checked as boolean,
              }))
            }
            disabled={isAnyLoading}
            className="mt-0.5"
          />
          <Label htmlFor="agree_terms" className="text-sm font-normal leading-5">
            I agree to the <TermsDialog>Terms & Conditions</TermsDialog>
          </Label>
        </div>

        <Button
          className="h-11 w-full"
          disabled={isAnyLoading}
          type="submit"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Sending code...
            </>
          ) : (
            "Continue with email"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        className="h-11 w-full"
        variant="outline"
        onClick={handleGoogleSignup}
        disabled={isAnyLoading}
        type="button"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Redirecting to Google...
          </>
        ) : (
          <>
            <GoogleIcon />
            Sign up with Google
          </>
        )}
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-semibold text-foreground underline-offset-4 hover:underline"
          href="/auth/login"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  login,
  saveUserData,
  requiresTOTP,
  requiresEmailOTP,
  LoginResponse,
  startGoogleOAuth,
} from "@/lib/api/auth";
import {
  buildAuthSupportURL,
  getAuthSupportReasonFromMessage,
} from "@/lib/auth-support";
import { useAuth } from "@/app/context/AuthContext";

const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || "https://lihat.in";

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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [supportLink, setSupportLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email_or_username: "",
    password: "",
    keepSignedIn: false,
  });
  const isAnyLoading = isLoading || isGoogleLoading;

  // Check for error query parameters from email verification
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "token_required") {
      toast.error("Verification Failed", {
        description: "Verification token is required",
        duration: 4000,
      });
    } else if (error === "verification_failed") {
      toast.error("Verification Failed", {
        description:
          "Email verification failed. The link may be expired or invalid.",
        duration: 4000,
      });
    } else if (error === "session_expired") {
      toast.error("Session Expired", {
        description: "Your session has expired. Please login again.",
        duration: 4000,
      });
    }

    if (searchParams.get("email_verified") === "1") {
      toast.success("Email Verified", {
        description: "Verification completed. Please sign in.",
        duration: 3000,
      });
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email_or_username) {
      toast.error("Validation Error", {
        description: "Please enter your email",
        duration: 3000,
      });
      return;
    }

    if (!formData.password) {
      toast.error("Validation Error", {
        description: "Please enter your password",
        duration: 3000,
      });
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Validation Error", {
        description: "Password must be at least 8 characters",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        email_or_username: formData.email_or_username,
        password: formData.password,
      });

      if (response.success && response.data) {
        setSupportLink(null);
        // Check if TOTP verification is required (NO tokens issued yet!)
        if (requiresTOTP(response.data)) {
          // Save pending auth token and user info for TOTP verification
          sessionStorage.setItem(
            "pending_auth_token",
            response.data.pending_auth_token
          );
          sessionStorage.setItem(
            "pending_user",
            JSON.stringify(response.data.user)
          );

          toast.success("Verification Required", {
            description: "Please enter your 2FA code",
            duration: 2000,
          });
          router.push("/auth/verify-login");
          return;
        }

        if (requiresEmailOTP(response.data)) {
          sessionStorage.setItem(
            "pending_email_otp_challenge",
            response.data.challenge_token
          );
          sessionStorage.setItem("pending_email_otp_email", response.data.email);

          toast.success("Verification Required", {
            description: "We sent a 6-digit code to your email",
            duration: 2500,
          });

          const redirectTo = searchParams.get("redirect") || "/main";
          router.push(
            `/auth/verify-email-otp?redirect=${encodeURIComponent(redirectTo)}`
          );
          return;
        }

        // Normal login (no TOTP) - tokens are in cookies
        const loginData = response.data as LoginResponse;
        saveUserData(loginData.user);

        // Success toast
        toast.success("Login Successful!", {
          description: `Welcome back, ${loginData.user.first_name}!`,
          duration: 3000,
        });

        // Update auth context (triggers recheck of authentication)
        await auth.login();

        // Redirect to main or redirect URL from query params
        const redirectTo = searchParams.get("redirect") || "/main";
        router.push(redirectTo);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again.";

      // Avoid noisy console logs for expected auth/business errors
      if (
        process.env.NODE_ENV !== "production" &&
        ![
          "User not found",
          "Too many requests, please try again later",
        ].includes(errorMessage)
      ) {
        console.error("Login error:", error);
      }

      // Show error toast
      toast.error("Login Failed", {
        description: errorMessage,
        duration: 4000,
      });

      const supportReason = getAuthSupportReasonFromMessage(errorMessage);
      if (supportReason) {
        const emailForSupport = formData.email_or_username.includes("@")
          ? formData.email_or_username.trim()
          : undefined;
        setSupportLink(buildAuthSupportURL(supportReason, emailForSupport));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      const response = await startGoogleOAuth({ intent: "login" });
      const authorizationURL = response.data?.authorization_url;
      const redirectTo = searchParams.get("redirect") || "/main";

      if (!authorizationURL) {
        throw new Error("Google OAuth URL is not available");
      }

      sessionStorage.setItem("post_login_redirect", redirectTo);
      window.location.assign(authorizationURL);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start Google sign-in.";

      toast.error("Google Sign-in Failed", {
        description: errorMessage,
        duration: 4000,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="md:flex md:min-h-full bg-background md:p-6 py-6 gap-x-6">
      {/* Left side: Sign-in form */}
      <div className="md:w-1/2 flex items-center justify-center">
        <div className="max-w-sm px-6 py-16 md:p-0 w-full ">
          {/* Header section with logo and title */}
          <div className="space-y-6 mb-6">
            <Link href={BRAND_URL} target="_blank">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={100}
                height={100}
                className="mx-auto mb-4 rounded"
              />
            </Link>
            {/* Title and description */}
            <div className="flex flex-col gap-y-3">
              <h1 className="text-2xl md:text-3xl font-bold">Sign in</h1>
              <p className="text-muted-foreground text-sm">
                Log in to unlock tailored content and stay connected with your
                Short URL &#39;s performance.
              </p>
            </div>
          </div>
          {/* Sign-in form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email_or_username">Email</Label>
              <Input
                id="email_or_username"
                placeholder="Email"
                type="text"
                value={formData.email_or_username}
                onChange={handleInputChange}
                disabled={isAnyLoading}
                required
              />
            </div>
            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isAnyLoading}
                required
              />
            </div>
            {/* Remember me checkbox and Forgot password link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keepSignedIn"
                  checked={formData.keepSignedIn}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      keepSignedIn: checked as boolean,
                    }))
                  }
                  disabled={isAnyLoading}
                />
                <Label htmlFor="keepSignedIn" className="text-sm font-medium">
                  Keep me signed in
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>
          {/* Sign-in button and Sign-up link */}
          <div className="flex flex-col space-y-4">
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isAnyLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
              type="button"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Google...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link className="underline text-foreground" href="/auth/register">
                Sign up
              </Link>
            </p>
            {supportLink && (
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help accessing your account?
                </p>
                <Link
                  href={supportLink}
                  className="text-sm text-primary hover:underline"
                >
                  Contact Support →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="/sign-in.svg"
        alt="Image"
        width={600}
        height={800}
        priority
        loading="eager"
        className="w-1/2 rounded-xl object-contain md:block hidden"
        style={{ transform: "scale(0.70)" }} // ← Custom scale
      />
    </div>
  );
}

// Wrapper component with Suspense boundary for useSearchParams
export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="md:flex md:min-h-full bg-background md:p-6 py-6 gap-x-6 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

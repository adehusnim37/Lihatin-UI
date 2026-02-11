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
  LoginResponse,
} from "@/lib/api/auth";
import { useAuth } from "@/app/context/AuthContext";

const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || "https://lihat.in";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email_or_username: "",
    password: "",
    keepSignedIn: false,
  });

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
        description: "Please enter your email or username",
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
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again.";

      // Show error toast
      toast.error("Login Failed", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
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
              <Label htmlFor="email_or_username">Email or Username</Label>
              <Input
                id="email_or_username"
                placeholder="Email or Username"
                type="text"
                value={formData.email_or_username}
                onChange={handleInputChange}
                disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
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
              disabled={isLoading}
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
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link className="underline text-foreground" href="/auth/register">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="/sign-in.svg"
        alt="Image"
        width="600"
        height="800"
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

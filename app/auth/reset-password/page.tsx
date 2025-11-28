"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { validateResetToken, resetPassword } from "@/lib/api/auth";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import PasswordIndicator, { calculatePasswordStrength } from "@/components/forms/input/PasswordIndicator";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Calculate password strength using existing component logic
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password, 8),
    [password]
  );

  // Validate token on mount
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    
    if (!tokenParam) {
      toast.error("Invalid Request", {
        description: "No reset token provided",
        duration: 3000,
      });
      setTimeout(() => router.push("/auth/forgot-password"), 2000);
      return;
    }

    setToken(tokenParam);

    // Validate token with backend
    validateResetToken(tokenParam)
      .then(() => {
        setIsValidToken(true);
        setIsValidating(false);
      })
      .catch((error) => {
        toast.error("Invalid Token", {
          description: error.message || "This reset link is invalid or expired",
          duration: 4000,
        });
        setIsValidating(false);
        setTimeout(() => router.push("/auth/forgot-password"), 3000);
      });
  }, [searchParams, router]);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password) {
      toast.error("Validation Error", {
        description: "Please enter a new password",
        duration: 3000,
      });
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error("Weak Password", {
        description: "Please choose a stronger password",
        duration: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Validation Error", {
        description: "Passwords do not match",
        duration: 3000,
      });
      return;
    }

    if (!token) {
      toast.error("Invalid Request", {
        description: "Reset token is missing",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword({
        token,
        new_password: password,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        toast.success("Password Reset Successful!", {
          description: "You can now login with your new password",
          duration: 5000,
        });

        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Reset password error:", error);

      toast.error("Reset Failed", {
        description:
          error.message || "Unable to reset password. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Validating reset token...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <XCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Button onClick={() => router.push("/auth/forgot-password")}>
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:flex md:min-h-full bg-background md:p-6 py-6 gap-x-6">
      {/* Left side: Reset password form */}
      <div className="md:w-1/2 flex items-center justify-center">
        <div className="max-w-sm px-6 py-16 md:p-0 w-full">
          {/* Header section with logo and title */}
          <div className="space-y-6 mb-6">
            <Link href="https://www.shadcndesign.com/" target="_blank">
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
              <h1 className="text-2xl md:text-3xl font-bold">
                Reset Your Password
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your new password below. Make sure it&apos;s strong and
                secure.
              </p>
            </div>
          </div>

          {/* Reset password form */}
          <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
            {/* New Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="Enter new password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <PasswordIndicator password={password} />
            </div>

            {/* Confirm Password input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
          </form>

          {/* Reset password button and back to login link */}
          <div className="flex flex-col space-y-4">
            <Button
              className="w-full"
              onClick={handleResetPassword}
              disabled={isLoading || passwordStrength.score < 3 || password !== confirmPassword}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link className="underline text-foreground" href="/auth/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="/reset-password.svg"
        alt="Reset Password"
        width="600"
        height="600"
        className="w-1/2 rounded-xl object-contain md:block hidden"
        style={{ transform: "scale(0.75)" }}
      />
    </div>
  );
}
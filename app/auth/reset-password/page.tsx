"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import PasswordIndicator, {
  calculatePasswordStrength,
} from "@/components/forms/input/PasswordIndicator";
import { validateResetToken, resetPassword } from "@/lib/api/auth";

const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || "https://lihat.in";

// Zod schema for form validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (val) => calculatePasswordStrength(val, 8).score >= 3,
        "Password is too weak. Add uppercase, numbers, or symbols."
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // React Hook Form setup with Zod resolver
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

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
      });
  }, [searchParams, router]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
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
        new_password: data.password,
        confirm_password: data.confirmPassword,
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
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to reset password. Please try again.";
      toast.error("Reset Failed", {
        description: errorMessage,
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
            <Link href={BRAND_URL} target="_blank">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={100}
                height={100}
                className="mx-auto mb-4 rounded"
              />
            </Link>
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

          {/* Reset password form using React Hook Form + Shadcn */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mb-6"
            >
              {/* New Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Enter new password"
                          type={showPassword ? "text" : "password"}
                          disabled={isLoading}
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
                    </FormControl>
                    <PasswordIndicator password={password} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Confirm new password"
                          type={showConfirmPassword ? "text" : "password"}
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    {/* Visual match indicator */}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                className="w-full"
                type="submit"
                disabled={isLoading || !form.formState.isValid}
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
            </form>
          </Form>

          <p className="text-sm text-center text-muted-foreground">
            Remember your password?{" "}
            <Link className="underline text-foreground" href="/auth/login">
              Sign in
            </Link>
          </p>
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

// Wrapper component with Suspense boundary for useSearchParams
export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { TermsDialog } from "@/components/auth/terms-dialog";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signupStart } from "@/lib/api/auth";

const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || "https://lihat.in";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    agree_terms: false,
  });

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

  return (
    <div className="md:flex md:min-h-full bg-background md:p-6 py-6 gap-x-6">
      <div className="md:w-1/2 flex items-center justify-center">
        <div className="max-w-sm px-6 py-16 md:p-0 w-full">
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
              <h1 className="text-2xl md:text-3xl font-bold">Create an account</h1>
              <p className="text-muted-foreground text-sm">
                Start with your email. We&apos;ll send a one-time verification code.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartSignup} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="you@example.com"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="agree_terms"
                checked={formData.agree_terms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    agree_terms: checked as boolean,
                  }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="agree_terms" className="text-sm font-normal">
                I agree to the <TermsDialog>Terms & Conditions</TermsDialog>
              </Label>
            </div>
          </form>

          <div className="flex flex-col space-y-4">
            <Button
              className="w-full"
              onClick={handleStartSignup}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Continue"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have account?{" "}
              <Link className="underline text-foreground" href="/auth/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Image
        src="/sign-up.svg"
        alt="Image"
        width={1000}
        height={1000}
        className="w-1/2 rounded-xl object-cover md:block hidden"
      />
    </div>
  );
}

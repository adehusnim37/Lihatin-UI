"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupComplete } from "@/lib/api/auth";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || "https://lihat.in";

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupToken = useMemo(
    () => searchParams.get("signup_token")?.trim() || "",
    [searchParams],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    confirm_password: "",
    secret_code: "",
    promotional_emails: false,
    weekly_summary_emails: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    if (!signupToken) {
      toast.error("Signup Session Missing", {
        description: "Please restart signup from register page.",
        duration: 3000,
      });
      return false;
    }

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.username ||
      !formData.password ||
      !formData.confirm_password
    ) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
        duration: 3000,
      });
      return false;
    }

    if (formData.first_name.length < 3 || formData.first_name.length > 50) {
      toast.error("Validation Error", {
        description: "First name must be between 3-50 characters",
        duration: 3000,
      });
      return false;
    }

    if (formData.last_name.length < 3 || formData.last_name.length > 50) {
      toast.error("Validation Error", {
        description: "Last name must be between 3-50 characters",
        duration: 3000,
      });
      return false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      toast.error("Validation Error", {
        description: "Username must contain only letters and numbers",
        duration: 3000,
      });
      return false;
    }

    if (formData.password.length < 8 || formData.password.length > 50) {
      toast.error("Validation Error", {
        description: "Password must be between 8-50 characters",
        duration: 3000,
      });
      return false;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      toast.error("Validation Error", {
        description:
          "Password must contain uppercase, lowercase, number, and special character",
        duration: 3500,
      });
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error("Validation Error", {
        description: "Passwords do not match",
        duration: 3000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await signupComplete({
        signup_token: signupToken,
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        password: formData.password,
        secret_code: formData.secret_code || undefined,
        opt_in_promotional_emails: formData.promotional_emails,
        opt_in_weekly_summary_emails: formData.weekly_summary_emails,
        consent_source: "signup_page",
      });

      if (response.success) {
        sessionStorage.removeItem("pending_signup_email");
        toast.success("Account Created", {
          description: "Signup completed. Please login to continue.",
          duration: 3500,
        });
        router.push("/auth/login");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to complete signup";
      toast.error("Signup Failed", {
        description: message,
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
              <h1 className="text-2xl md:text-3xl font-bold">
                Complete your profile
              </h1>
              <p className="text-muted-foreground text-sm">
                Your email is verified. Set up your account details to finish
                signup.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="First Name"
                type="text"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Last Name"
                type="text"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                placeholder="Confirm Password"
                type="password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_code">Secret Code (Optional)</Label>
              <Input
                id="secret_code"
                placeholder="Secret Code"
                type="text"
                value={formData.secret_code}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="promotional_emails"
                checked={formData.promotional_emails}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    promotional_emails: checked === true,
                  }))
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="promotional_emails"
                className="text-sm font-normal flex items-center gap-1"
              >
                I agree to receive promotional emails.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center text-muted-foreground hover:text-foreground"
                      aria-label="What are promotional emails?"
                    >
                      <Info className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="top" sideOffset={6}>
                    Updates about offers, new features, and campaigns sent by
                    admins. Only active and verified users who opt in will
                    receive them, and you can unsubscribe anytime.
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="weekly_summary_emails"
                checked={formData.weekly_summary_emails}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    weekly_summary_emails: checked === true,
                  }))
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="weekly_summary_emails"
                className="text-sm font-normal flex items-center gap-1"
              >
                I agree to receive weekly summary emails.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center text-muted-foreground hover:text-foreground"
                      aria-label="What are weekly summary emails?"
                    >
                      <Info className="size-4" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="top" sideOffset={6}>
                    A recap of your previous full Monday to Sunday activity.
                    The system sends at most one successful summary per week,
                    and includes one-click unsubscribe.
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
          </form>

          <div className="flex flex-col space-y-4">
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Finishing signup...
                </>
              ) : (
                "Complete signup"
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
        loading="eager"
      />
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfileContent />
    </Suspense>
  );
}

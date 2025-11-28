"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/api/auth";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [switchOn, setSwitchOn] = useState(false);
  const [username, setUsername] = useState("");

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();

    // Validate based on mode: email (default) or username (switchOn === true)
    if (!switchOn) {
      // Email mode
      if (!email) {
        toast.error("Validation Error", {
          description: "Please enter your email address",
          duration: 3000,
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Validation Error", {
          description: "Please enter a valid email address",
          duration: 3000,
        });
        return;
      }
    } else {
      // Username mode
      if (!username) {
        toast.error("Validation Error", {
          description: "Please enter your username",
          duration: 3000,
        });
        return;
      }
      // optional: basic username rules
      if (username.length < 3) {
        toast.error("Validation Error", {
          description: "Username must be at least 3 characters",
          duration: 3000,
        });
        return;
      }
    }
    setIsLoading(true);

    try {
      const response = await forgotPassword({
        email: !switchOn ? email : undefined,
        username: switchOn ? username : undefined,
      });

      if (response.success) {
        // Success toast
        toast.success("Reset Link Sent!", {
          description:
            response.message ||
            "If an account with that email exists, a password reset link has been sent",
          duration: 5000,
        });

        // Redirect to check email page
        setTimeout(() => {
          router.push("/auth/check-email");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);

      // Show error toast
      toast.error("Request Failed", {
        description:
          error.message || "Unable to send reset link. Please try again.",
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
                Forgot Password ?
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your email address or username below and we&apos;ll send
                you a link to reset your password.
              </p>
            </div>
          </div>
          {/* Forgot password form */}
          <form onSubmit={handleForgotPassword} className="space-y-4 mb-6">
            {/* Email input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {!switchOn && <Label htmlFor="email">Email</Label>}
                {switchOn && <Label htmlFor="username">Username</Label>}
                <Switch
                  id="airplane-mode"
                  checked={switchOn}
                  onCheckedChange={setSwitchOn}
                />
              </div>
              {!switchOn && (
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              )}
              {switchOn && (
                <Input
                  id="username"
                  placeholder="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              )}
            </div>
          </form>
          {/* Send reset link button and Sign-up link */}
          <div className="flex flex-col space-y-4">
            <Button
              className="w-full"
              onClick={handleForgotPassword}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
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
        src="/forgot-password.svg"
        alt="Image"
        width="600"
        height="800"
        className="w-1/2 rounded-xl object-contain md:block hidden"
        style={{ transform: "scale(0.85)" }} // ← Custom scale
      />
    </div>
  );
}

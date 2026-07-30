"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthenticatedTransition } from "@/components/auth/authenticated-transition";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [switchOn, setSwitchOn] = useState(false);
  const [username, setUsername] = useState("");
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isRecoveryTransitioning, setIsRecoveryTransitioning] =
    useState(false);

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();

    if (!switchOn) {
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
      if (!username) {
        toast.error("Validation Error", {
          description: "Please enter your username",
          duration: 3000,
        });
        return;
      }

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
        toast.success("Reset Link Sent!", {
          description:
            response.message ||
            "If an account with that email exists, a password reset link has been sent",
          duration: 5000,
        });
        setIsRecoveryTransitioning(true);
      }
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to send reset link. Please try again.";

      toast.error("Request Failed", {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Choose email or username and we’ll send reset instructions to the email connected to your account."
      visualTitle="A quick reset. Then you’re back in control."
      visualDescription="Recover access securely without losing your links, analytics, or account settings."
    >
      {isRequestSent ? (
        <div className="rounded-2xl border bg-primary/5 p-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            <MailCheck className="size-7" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-[-0.03em] text-foreground">
            Check your inbox
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            If an account matches{" "}
            <span className="font-semibold text-foreground">
              {switchOn ? username : email}
            </span>
            , reset instructions are on the way.
          </p>
          <div className="mt-5 grid gap-2">
            <Button asChild className="h-11">
              <Link href="/auth/login">Return to sign in</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10"
              onClick={() => setIsRequestSent(false)}
            >
              Try another account
            </Button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Find account by
                </p>
                <p className="text-xs text-muted-foreground">
                  {switchOn ? "Username" : "Email address"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Email
                </span>
                <Switch
                  id="recovery-mode"
                  aria-label="Use username instead of email"
                  checked={switchOn}
                  onCheckedChange={setSwitchOn}
                  disabled={isLoading}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  Username
                </span>
              </div>
            </div>

            {!switchOn ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  className="h-11"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="your-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={isLoading}
                  className="h-11"
                  required
                />
              </div>
            )}

            <Button
              className="h-11 w-full"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset instructions"
              )}
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>
              Remembered your password?{" "}
              <Link
                className="font-semibold text-foreground underline-offset-4 hover:underline"
                href="/auth/login"
              >
                Sign in
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{" "}
              <Link
                className="font-semibold text-foreground underline-offset-4 hover:underline"
                href="/auth/register"
              >
                Sign up
              </Link>
            </p>
          </div>
        </>
      )}

      <AuthenticatedTransition
        active={isRecoveryTransitioning}
        statusLabel="Recovery request sent"
        finalTitle="Check your inbox"
        finalDescription="Your secure reset link is on the way"
        prepareMainEntry={false}
        exitAfterComplete
        onComplete={() => {
          setIsRecoveryTransitioning(false);
          setIsRequestSent(true);
        }}
      />
    </AuthShell>
  );
}

"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OTPFormProps extends React.ComponentProps<"div"> {
  onVerify?: (otp: string) => Promise<void> | void;
  onResend?: () => Promise<void> | void;
  email?: string;
  description?: React.ReactNode;
  isSubmitting?: boolean;
  isResending?: boolean;
  resendCooldown?: number;
  error?: string | null;
}

export function OTPForm({
  className,
  onVerify,
  onResend,
  email,
  description,
  isSubmitting = false,
  isResending = false,
  resendCooldown = 60,
  error,
  ...props
}: OTPFormProps) {
  const [otpValue, setOtpValue] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Mask email for display
  const maskedEmail = useMemo(() => {
    if (!email) return null;
    const [local, domain] = email.split("@");
    if (!domain) return email;
    if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }, [email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6 || isSubmitting) return;
    await onVerify?.(otpValue);
  };

  const handleResend = async () => {
    if (!onResend || cooldown > 0 || isResending) return;
    await onResend();
    setCooldown(resendCooldown);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="/auth/login"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Lihatin</span>
            </a>
            <h1 className="text-xl font-bold">Enter verification code</h1>
            <FieldDescription>
              {description ? (
                description
              ) : maskedEmail ? (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-foreground">
                    {maskedEmail} or your authenticator app
                  </span>
                </>
              ) : (
                "Open your authenticator app and enter the 6-digit code"
              )}
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <InputOTP
              value={otpValue}
              onChange={(value) => setOtpValue(value)}
              maxLength={6}
              id="otp"
              containerClassName="gap-4 justify-center"
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="mt-2 text-sm text-destructive text-center">
                {error}
              </p>
            )}

            {onResend && (
              <FieldDescription className="text-center">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  className="font-semibold text-primary underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : isResending
                    ? "Sending..."
                    : "Resend"}
                </button>
              </FieldDescription>
            )}
          </Field>

          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || otpValue.length !== 6}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        By clicking Verify, you agree to our{" "}
        <a href="#" className="underline">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}

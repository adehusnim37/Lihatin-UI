"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OTPFormProps extends React.ComponentProps<"div"> {
  onVerify?: (otp: string) => Promise<void> | void;
  onResend?: () => Promise<number | void> | number | void;
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
  const formRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [otpValue, setOtpValue] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const isComplete = otpValue.length === 6;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((previous) => Math.max(previous - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const root = formRef.current;
    if (
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-otp-card]", {
          autoAlpha: 0,
          y: 18,
          scale: 0.985,
          duration: 0.55,
        })
        .from(
          "[data-otp-reveal]",
          {
            autoAlpha: 0,
            y: 10,
            duration: 0.4,
            stagger: 0.05,
          },
          "-=0.28",
        );
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (
      !input ||
      !error ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    gsap.fromTo(
      input,
      { x: -7 },
      {
        x: 0,
        duration: 0.08,
        ease: "none",
        repeat: 5,
        yoyo: true,
      },
    );
  }, [error]);

  useEffect(() => {
    const input = inputRef.current;
    if (
      !input ||
      !isComplete ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    gsap.fromTo(
      input.querySelectorAll("[data-filled=true]"),
      { scale: 0.9 },
      {
        scale: 1,
        duration: 0.35,
        ease: "back.out(2)",
        stagger: 0.035,
      },
    );
  }, [isComplete]);

  const maskedEmail = useMemo(() => {
    if (!email) return null;
    const [local, domain] = email.split("@");
    if (!domain) return email;
    if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }, [email]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isComplete || isSubmitting) return;
    await onVerify?.(otpValue);
  };

  const handleResend = async () => {
    if (!onResend || cooldown > 0 || isResending) return;
    const nextCooldown = await onResend();
    if (typeof nextCooldown === "number" && nextCooldown > 0) {
      setCooldown(nextCooldown);
      return;
    }
    setCooldown(resendCooldown);
  };

  return (
    <div
      ref={formRef}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div
        data-otp-card
        className="relative overflow-hidden rounded-[1.75rem] border bg-card/95 p-5 shadow-xl shadow-primary/5 backdrop-blur sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 size-44 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 size-40 rounded-full bg-third/20 blur-3xl" />

        <div
          data-otp-reveal
          className="relative flex items-center justify-between"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={30}
              height={30}
              className="size-7 rounded-lg"
            />
            Lihat.in
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            <ShieldCheck className="size-3.5" />
            Secure check
          </span>
        </div>

        <div data-otp-reveal className="relative mt-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
            {isComplete ? (
              <Check className="size-5" strokeWidth={2.5} />
            ) : (
              <ShieldCheck className="size-5" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-[-0.035em] text-foreground">
            Check your code
          </h1>
          <FieldDescription className="mx-auto mt-2 max-w-xs leading-5">
            {description ? (
              description
            ) : maskedEmail ? (
              <>Enter the 6-digit code we sent to continue securely.</>
            ) : (
              "Open your authenticator app and enter the 6-digit code."
            )}
          </FieldDescription>
          {maskedEmail && (
            <span className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
              {maskedEmail}
            </span>
          )}
        </div>

        <form
          data-otp-reveal
          onSubmit={handleSubmit}
          className="relative mt-7"
        >
          <FieldLabel htmlFor="otp" className="sr-only">
            Verification code
          </FieldLabel>

          <div ref={inputRef}>
            <InputOTP
              value={otpValue}
              onChange={setOtpValue}
              maxLength={6}
              id="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "otp-error" : "otp-hint"}
              containerClassName="justify-center"
            >
              <InputOTPGroup className="w-full justify-between gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className={cn(
                      "h-12 w-9 rounded-xl text-lg sm:h-14 sm:w-11 sm:text-xl",
                      index === 3 && "ml-1.5 sm:ml-2",
                    )}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p
              id="otp-hint"
              className="text-[11px] text-muted-foreground"
            >
              Paste or type your code
            </p>
            <div
              className="flex items-center gap-1"
              aria-label={`${otpValue.length} of 6 digits entered`}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 w-3 rounded-full transition-colors duration-200",
                    index < otpValue.length ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>

          {error && (
            <div
              id="otp-error"
              role="alert"
              className="mt-4 rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-center text-xs font-medium text-destructive"
            >
              {error}
            </div>
          )}

          {onResend && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-muted/55 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Didn&apos;t receive it?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary outline-none transition-colors hover:text-primary/75 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                <RefreshCw
                  className={cn("size-3.5", isResending && "animate-spin")}
                />
                {cooldown > 0
                  ? `Try again in ${cooldown}s`
                  : isResending
                    ? "Sending..."
                    : "Resend code"}
              </button>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full rounded-xl"
            disabled={isSubmitting || !isComplete}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & continue
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <FieldDescription
        data-otp-reveal
        className="px-5 text-center text-[11px] leading-5 text-muted-foreground"
      >
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}

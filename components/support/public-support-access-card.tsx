"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconKey, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportTurnstileField } from "@/components/support/support-turnstile-field";
import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type TrackSupportTicketResponse,
} from "@/lib/api/support";
import {
  useRequestSupportAccessOTPMutation,
  useResendSupportAccessOTPMutation,
  useTrackSupportTicketMutation,
  useVerifySupportAccessCodeMutation,
  useVerifySupportAccessOTPMutation,
} from "@/lib/hooks/queries/useSupportQuery";
import {
  buildPublicSupportConversationURL,
  storePublicSupportAccessToken,
} from "@/lib/support/public-access";
import { formatSupportDateTime } from "@/lib/support/public-support";

const IS_DEV = process.env.NODE_ENV === "development";

export function PublicSupportAccessCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = (searchParams.get("email") || "").trim();
  const queryTicket = (searchParams.get("ticket") || "").trim().toUpperCase();
  const queryCode = (searchParams.get("code") || "").trim();

  const [trackTicket, setTrackTicket] = useState(queryTicket);
  const [trackEmail, setTrackEmail] = useState(queryEmail);
  const [trackResult, setTrackResult] = useState<TrackSupportTicketResponse | null>(null);

  const [linkCode, setLinkCode] = useState(queryCode);
  const [otpChallengeToken, setOtpChallengeToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldownRemaining, setOtpCooldownRemaining] = useState(0);
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  const [otpSource, setOtpSource] = useState<{ ticket: string; email: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [showOTPSection, setShowOTPSection] = useState(false);
  const trackTicketMutation = useTrackSupportTicketMutation();
  const verifyCodeMutation = useVerifySupportAccessCodeMutation();
  const requestOTPMutation = useRequestSupportAccessOTPMutation();
  const verifyOTPMutation = useVerifySupportAccessOTPMutation();
  const resendOTPMutation = useResendSupportAccessOTPMutation();

  useEffect(() => {
    if (!otpSource) {
      return;
    }

    const normalizedTicket = trackTicket.trim().toUpperCase();
    const normalizedEmail = trackEmail.trim().toLowerCase();
    if (otpSource.ticket === normalizedTicket && otpSource.email === normalizedEmail) {
      return;
    }

    setOtpChallengeToken("");
    setOtpCode("");
    setOtpCooldownRemaining(0);
    setOtpTargetEmail("");
    setOtpSource(null);
    setCaptchaToken("");
    setCaptchaResetSignal((previous) => previous + 1);
  }, [otpSource, trackEmail, trackTicket]);

  useEffect(() => {
    if (otpCooldownRemaining <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setOtpCooldownRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [otpCooldownRemaining]);

  const openConversation = (ticket: string, ticketEmail: string, accessToken: string) => {
    storePublicSupportAccessToken(ticket, ticketEmail, accessToken);
    router.push(buildPublicSupportConversationURL(ticket, ticketEmail));
  };

  const handleTrackTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (!trackTicket.trim() || !trackEmail.trim()) {
      toast.error("Ticket code and email are required");
      return;
    }

    try {
      const response = await trackTicketMutation.mutateAsync({
        ticket: trackTicket.trim().toUpperCase(),
        email: trackEmail.trim(),
      });

      setTrackResult(response);
      toast.success("Ticket found", {
        description: "Continue with access code or OTP to open conversation page.",
      });
    } catch (error: unknown) {
      setTrackResult(null);
      toast.error("Ticket not found", {
        description: error instanceof Error ? error.message : "Please check ticket and email.",
      });
    }
  };

  const handleVerifyCode = async () => {
    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();
    const code = linkCode.trim();

    if (!ticket || !ticketEmail || !code) {
      toast.error("Ticket, email, and access code are required");
      return;
    }

    try {
      const response = await verifyCodeMutation.mutateAsync({
        ticket,
        email: ticketEmail,
        code,
      });

      const token = response.access_token || "";
      if (!token) {
        throw new Error("Access token missing in response");
      }

      toast.success("Secure access granted", {
        description: "Opening conversation page...",
      });
      openConversation(ticket, ticketEmail, token);
    } catch (error: unknown) {
      toast.error("Failed to verify access code", {
        description: error instanceof Error ? error.message : "Please request OTP instead.",
      });
    }
  };

  const handleRequestOTP = async () => {
    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();

    if (!ticket || !ticketEmail) {
      toast.error("Ticket code and email are required");
      return;
    }

    const skipCaptcha = IS_DEV && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!skipCaptcha && !captchaToken.trim()) {
      toast.error("Please complete captcha first");
      return;
    }

    try {
      const response = await requestOTPMutation.mutateAsync({
        ticket,
        email: ticketEmail,
        captcha_token: skipCaptcha ? "dev-bypass" : captchaToken.trim(),
      });

      setOtpChallengeToken(response.challenge_token || "");
      setOtpCooldownRemaining(Math.max(0, response.cooldown_seconds || 0));
      setOtpTargetEmail(ticketEmail);
      setOtpSource({
        ticket,
        email: ticketEmail.toLowerCase(),
      });
      toast.success("OTP sent", {
        description: "Check your email inbox for verification code.",
      });
    } catch (error: unknown) {
      toast.error("Failed to request OTP", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((previous) => previous + 1);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpChallengeToken.trim() || !otpCode.trim()) {
      toast.error("Challenge token and OTP are required");
      return;
    }

    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();

    try {
      const response = await verifyOTPMutation.mutateAsync({
        challenge_token: otpChallengeToken.trim(),
        otp_code: otpCode.trim(),
      });

      const token = response.access_token || "";
      if (!token) {
        throw new Error("Access token missing in response");
      }

      toast.success("Secure access granted", {
        description: "Opening conversation page...",
      });
      openConversation(ticket, ticketEmail, token);
    } catch (error: unknown) {
      toast.error("Failed to verify OTP", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleResendOTP = async () => {
    if (!otpChallengeToken.trim()) {
      toast.error("Request OTP first");
      return;
    }

    const skipCaptcha = IS_DEV && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!skipCaptcha && !captchaToken.trim()) {
      toast.error("Please complete captcha first");
      return;
    }

    try {
      const response = await resendOTPMutation.mutateAsync({
        challenge_token: otpChallengeToken.trim(),
        captcha_token: skipCaptcha ? "dev-bypass" : captchaToken.trim(),
      });

      const nextChallengeToken = response.challenge_token?.trim();
      const nextCooldown = Math.max(0, response.cooldown_seconds ?? 0);
      if (nextChallengeToken) {
        setOtpChallengeToken(nextChallengeToken);
      }
      setOtpCooldownRemaining(nextCooldown);
      setOtpTargetEmail(trackEmail.trim());
      setOtpSource({
        ticket: trackTicket.trim().toUpperCase(),
        email: trackEmail.trim().toLowerCase(),
      });
      toast.success("OTP resent", {
        description: nextCooldown > 0 ? `You can request another resend in ${nextCooldown} seconds.` : undefined,
      });
    } catch (error: unknown) {
      toast.error("Failed to resend OTP", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((previous) => previous + 1);
    }
  };

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Secure Access</p>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconSearch className="h-5 w-5" />
          Track & Open Ticket
        </CardTitle>
        <CardDescription>
          Check existing ticket, then continue to secure conversation page with access code or OTP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleTrackTicket} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="track-ticket">Ticket Code</Label>
            <Input
              id="track-ticket"
              value={trackTicket}
              onChange={(event) => setTrackTicket(event.target.value.toUpperCase())}
              placeholder="LHTK-XXXXXX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="track-email">Email</Label>
            <Input
              id="track-email"
              type="email"
              value={trackEmail}
              onChange={(event) => setTrackEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <Button type="submit" variant="outline" className="w-full" disabled={trackTicketMutation.isPending}>
            {trackTicketMutation.isPending ? "Checking..." : "Check Ticket"}
          </Button>
        </form>

        <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verify Access</p>
            <p className="text-sm text-muted-foreground">
              Use secure access code from email first. OTP is fallback if link code is unavailable.
            </p>
          </div>
          {!showOTPSection ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="support-link-code">Access Code (from email link)</Label>
                <Input
                  id="support-link-code"
                  value={linkCode}
                  onChange={(event) => setLinkCode(event.target.value)}
                  placeholder="Paste code from ticket email"
                />
              </div>

              <Button onClick={() => void handleVerifyCode()} className="w-full" disabled={verifyCodeMutation.isPending}>
                <IconKey className="mr-2 h-4 w-4" />
                {verifyCodeMutation.isPending ? "Verifying..." : "Open with Access Code"}
              </Button>

              <div className="pt-4 border-t border-border/50 flex flex-wrap items-center justify-center gap-1.5 text-sm">
                <p className="font-medium text-foreground">Have you lost the access code?</p>
                <p onClick={() => setShowOTPSection(true)} className="font-medium text-primary hover:underline cursor-pointer">
                  Verify with OTP instead
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <p className="text-sm font-medium">OTP Verification</p>
                <Button variant="ghost" size="sm" onClick={() => setShowOTPSection(false)} className="h-8 text-xs">
                  Use Access Code
                </Button>
              </div>

              {!otpChallengeToken ? (
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Complete the security check below to receive a 6-digit verification code in your email.
                  </p>

                  <div className="flex justify-center py-2">
                    <SupportTurnstileField
                      token={captchaToken}
                      onTokenChange={setCaptchaToken}
                      resetSignal={captchaResetSignal}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => void handleRequestOTP()}
                    disabled={requestOTPMutation.isPending}
                  >
                    {requestOTPMutation.isPending ? "Sending OTP..." : "Send OTP to Email"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 py-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                    <p className="text-sm">
                      Code sent to <span className="font-semibold">{otpTargetEmail}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="otp-input" className="sr-only">Enter OTP</Label>
                    <Input
                      id="otp-input"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      placeholder="• • • • • •"
                      className="h-12 text-center text-2xl tracking-[0.5em] font-medium transition-all focus:tracking-[0.7em]"
                      maxLength={6}
                    />
                    <Button 
                      onClick={() => void handleVerifyOTP()} 
                      className="w-full h-11"
                      disabled={verifyOTPMutation.isPending || otpCode.trim().length < 6}
                    >
                      {verifyOTPMutation.isPending ? "Verifying..." : "Verify & Open Ticket"}
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">Didn't receive the code?</p>
                      
                      {otpCooldownRemaining <= 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <SupportTurnstileField
                            token={captchaToken}
                            onTokenChange={setCaptchaToken}
                            resetSignal={captchaResetSignal}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleResendOTP()}
                            disabled={resendOTPMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            {resendOTPMutation.isPending ? "Resending..." : "Resend OTP Code"}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                          Resend available in {otpCooldownRemaining}s
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {trackResult && (
          <div className="rounded-lg border p-4 text-sm space-y-2">
            <p className="font-medium">{trackResult.ticket_code}</p>
            <p className="text-muted-foreground">{trackResult.subject}</p>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <SupportStatusBadge status={trackResult.status} />
            </div>
            <p className="text-xs text-muted-foreground">Created: {formatSupportDateTime(trackResult.created_at)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

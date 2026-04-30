"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconKey, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestSupportAccessOTP,
  resendSupportAccessOTP,
  trackSupportTicket,
  verifySupportAccessCode,
  verifySupportAccessOTP,
  type TrackSupportTicketResponse,
} from "@/lib/api/support";
import {
  buildPublicSupportConversationURL,
  storePublicSupportAccessToken,
} from "@/lib/support/public-access";
import { formatSupportDateTime } from "@/lib/support/public-support";

export function PublicSupportAccessCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [trackTicket, setTrackTicket] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackResult, setTrackResult] = useState<TrackSupportTicketResponse | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const [linkCode, setLinkCode] = useState("");
  const [otpChallengeToken, setOtpChallengeToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [otpCooldownRemaining, setOtpCooldownRemaining] = useState(0);
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  const [otpSource, setOtpSource] = useState<{ ticket: string; email: string } | null>(null);

  useEffect(() => {
    const queryEmail = (searchParams.get("email") || "").trim();
    const queryTicket = (searchParams.get("ticket") || "").trim().toUpperCase();
    const queryCode = (searchParams.get("code") || "").trim();

    if (queryEmail) {
      setTrackEmail(queryEmail);
    }
    if (queryTicket) {
      setTrackTicket(queryTicket);
    }
    if (queryCode) {
      setLinkCode(queryCode);
    }
  }, [searchParams]);

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

    setIsTracking(true);
    try {
      const response = await trackSupportTicket({
        ticket: trackTicket.trim().toUpperCase(),
        email: trackEmail.trim(),
      });

      setTrackResult(response.data || null);
      toast.success("Ticket found", {
        description: "Continue with access code or OTP to open conversation page.",
      });
    } catch (error: unknown) {
      setTrackResult(null);
      toast.error("Ticket not found", {
        description: error instanceof Error ? error.message : "Please check ticket and email.",
      });
    } finally {
      setIsTracking(false);
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

    setIsVerifyingCode(true);
    try {
      const response = await verifySupportAccessCode({
        ticket,
        email: ticketEmail,
        code,
      });

      const token = response.data?.access_token || "";
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
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleRequestOTP = async () => {
    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();

    if (!ticket || !ticketEmail) {
      toast.error("Ticket code and email are required");
      return;
    }

    setIsRequestingOTP(true);
    try {
      const response = await requestSupportAccessOTP({
        ticket,
        email: ticketEmail,
      });

      setOtpChallengeToken(response.data?.challenge_token || "");
      setOtpCooldownRemaining(Math.max(0, response.data?.cooldown_seconds || 0));
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
      setIsRequestingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpChallengeToken.trim() || !otpCode.trim()) {
      toast.error("Challenge token and OTP are required");
      return;
    }

    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();

    setIsVerifyingOTP(true);
    try {
      const response = await verifySupportAccessOTP({
        challenge_token: otpChallengeToken.trim(),
        otp_code: otpCode.trim(),
      });

      const token = response.data?.access_token || "";
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
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (!otpChallengeToken.trim()) {
      toast.error("Request OTP first");
      return;
    }

    setIsResendingOTP(true);
    try {
      const response = await resendSupportAccessOTP({
        challenge_token: otpChallengeToken.trim(),
      });

      const remaining = response.data?.cooldown_remaining_seconds;
      const nextCooldown = Math.max(0, remaining ?? response.data?.cooldown_seconds ?? 0);
      setOtpCooldownRemaining(nextCooldown);
      setOtpTargetEmail(trackEmail.trim());
      setOtpSource({
        ticket: trackTicket.trim().toUpperCase(),
        email: trackEmail.trim().toLowerCase(),
      });
      if (nextCooldown > 0) {
        toast.message("Please wait", {
          description: `Retry in ${nextCooldown} seconds.`,
        });
      } else {
        toast.success("OTP resent");
      }
    } catch (error: unknown) {
      toast.error("Failed to resend OTP", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsResendingOTP(false);
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

          <Button type="submit" variant="outline" className="w-full" disabled={isTracking}>
            {isTracking ? "Checking..." : "Check Ticket"}
          </Button>
        </form>

        <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verify Access</p>
            <p className="text-sm text-muted-foreground">
              Use secure access code from email first. OTP is fallback if link code is unavailable.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-link-code">Access Code (from email link)</Label>
            <Input
              id="support-link-code"
              value={linkCode}
              onChange={(event) => setLinkCode(event.target.value)}
              placeholder="Paste code from ticket email"
            />
          </div>

          <Button onClick={() => void handleVerifyCode()} className="w-full" disabled={isVerifyingCode}>
            <IconKey className="mr-2 h-4 w-4" />
            {isVerifyingCode ? "Verifying..." : "Open with Access Code"}
          </Button>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() => void handleRequestOTP()}
              disabled={isRequestingOTP || Boolean(otpChallengeToken)}
            >
              {isRequestingOTP ? "Requesting..." : otpChallengeToken ? "OTP Sent" : "Send OTP"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleResendOTP()}
              disabled={!otpChallengeToken || isResendingOTP || otpCooldownRemaining > 0}
            >
              {isResendingOTP
                ? "Resending..."
                : otpCooldownRemaining > 0
                  ? `Resend in ${otpCooldownRemaining}s`
                  : "Resend OTP"}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder="Enter 6-digit OTP"
            />
            <Button onClick={() => void handleVerifyOTP()} disabled={!otpChallengeToken || isVerifyingOTP}>
              {isVerifyingOTP ? "Verifying..." : "Open with OTP"}
            </Button>
          </div>

          {otpChallengeToken && otpTargetEmail ? (
            <p className="text-xs text-muted-foreground">
              OTP sent to <span className="font-medium text-foreground">{otpTargetEmail}</span>.
            </p>
          ) : null}
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

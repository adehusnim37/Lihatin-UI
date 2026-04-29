"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconClock,
  IconKey,
  IconLifebuoy,
  IconMail,
  IconPaperclip,
  IconSearch,
  IconSend,
  IconTicket,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createSupportTicket,
  getPublicSupportAttachmentURL,
  listPublicSupportConversation,
  requestSupportAccessOTP,
  resendSupportAccessOTP,
  sendPublicSupportMessage,
  trackSupportTicket,
  verifySupportAccessCode,
  verifySupportAccessOTP,
  type SupportCategory,
  type SupportConversationResponse,
  type SupportMessageResponse,
  type TrackSupportTicketResponse,
} from "@/lib/api/support";
import type { AuthSupportReason } from "@/lib/auth-support";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const IS_DEV = process.env.NODE_ENV === "development";

type SupportPreset = {
  category: SupportCategory;
  subject: string;
  descriptionHint: string;
};

const reasonPresetMap: Record<AuthSupportReason, SupportPreset> = {
  ACCOUNT_LOCKED: {
    category: "account_locked",
    subject: "My account is locked",
    descriptionHint:
      "I cannot log in because my account is temporarily locked. Please help me review access.",
  },
  USER_LOCKED: {
    category: "account_locked",
    subject: "My account has been locked by admin",
    descriptionHint:
      "I believe my account was manually locked. Please help verify account status.",
  },
  ACCOUNT_DEACTIVATED: {
    category: "account_deactivated",
    subject: "My account has been deactivated",
    descriptionHint:
      "I cannot log in because my account is deactivated. Please assist reactivation process.",
  },
  EMAIL_NOT_VERIFIED: {
    category: "email_verification",
    subject: "I can't verify my email",
    descriptionHint:
      "I cannot complete login because my email is not verified. Please resend verification guidance.",
  },
};

const categoryOptions: { value: SupportCategory; label: string }[] = [
  { value: "account_locked", label: "Account Locked" },
  { value: "account_deactivated", label: "Account Deactivated" },
  { value: "email_verification", label: "Email Verification" },
  { value: "lost_2fa", label: "Lost 2FA Device" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function SupportContent() {
  const searchParams = useSearchParams();
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);
  const autoVerifyRef = useRef(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<SupportCategory>("other");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

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

  const [supportAccessToken, setSupportAccessToken] = useState("");
  const [conversation, setConversation] = useState<SupportConversationResponse | null>(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);

  const [draftMessage, setDraftMessage] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const reason = useMemo(() => {
    const raw = (searchParams.get("reason") || "").trim().toUpperCase();
    if (
      raw === "ACCOUNT_LOCKED" ||
      raw === "USER_LOCKED" ||
      raw === "ACCOUNT_DEACTIVATED" ||
      raw === "EMAIL_NOT_VERIFIED"
    ) {
      return raw as AuthSupportReason;
    }
    return null;
  }, [searchParams]);

  const preset = reason ? reasonPresetMap[reason] : null;

  useEffect(() => {
    const queryEmail = (searchParams.get("email") || "").trim();
    const queryTicket = (searchParams.get("ticket") || "").trim();
    const queryCode = (searchParams.get("code") || "").trim();

    if (queryEmail) {
      setEmail(queryEmail);
      setTrackEmail(queryEmail);
    }

    if (queryTicket) {
      setTrackTicket(queryTicket.toUpperCase());
    }

    if (queryCode) {
      setLinkCode(queryCode);
    }

    if (preset) {
      setCategory(preset.category);
      setSubject((previous) => (previous ? previous : preset.subject));
      setDescription((previous) => (previous ? previous : preset.descriptionHint));
    }
  }, [preset, searchParams]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !captchaRef.current) {
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !captchaRef.current) return;
      if (captchaWidgetIdRef.current) {
        window.turnstile.remove(captchaWidgetIdRef.current);
      }

      captchaWidgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        "error-callback": () => setCaptchaToken(""),
        "expired-callback": () => setCaptchaToken(""),
      });
    };

    const scriptId = "support-turnstile-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existing.addEventListener("load", renderWidget, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget, { once: true });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", renderWidget);
    };
  }, []);

  const loadConversation = async (ticket: string, emailAddress: string, accessToken: string) => {
    setIsConversationLoading(true);
    try {
      const response = await listPublicSupportConversation({
        ticket,
        email: emailAddress,
        accessToken,
      });

      setConversation(response.data || null);
    } catch (error: unknown) {
      setConversation(null);
      toast.error("Failed to load conversation", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsConversationLoading(false);
    }
  };

  const handleSubmitTicket = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !subject.trim() || !description.trim()) {
      toast.error("Please complete required fields");
      return;
    }

    const skipCaptcha = IS_DEV && !TURNSTILE_SITE_KEY;
    if (!skipCaptcha && !captchaToken.trim()) {
      toast.error("Please complete captcha first");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createSupportTicket({
        email: email.trim(),
        category,
        subject: subject.trim(),
        description: description.trim(),
        captcha_token: skipCaptcha ? "dev-bypass" : captchaToken.trim(),
      });

      const code = response.data?.ticket_code || null;
      setSubmittedCode(code);
      if (code) {
        setTrackTicket(code);
        setTrackEmail(email.trim());
      }

      toast.success("Support ticket submitted", {
        description: code
          ? `Ticket ${code} created. Open email for secure access link.`
          : "Ticket created successfully",
      });

      setCaptchaToken("");
      if (captchaWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(captchaWidgetIdRef.current);
      }
    } catch (error: unknown) {
      toast.error("Failed to submit ticket", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        description: "Continue with access code or OTP to open conversation.",
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

  const handleVerifyCode = async (codeFromAuto?: string) => {
    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();
    const code = (codeFromAuto || linkCode).trim();

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

      setSupportAccessToken(token);
      setTrackResult(response.data?.ticket || null);
      setOtpChallengeToken("");
      setOtpCode("");
      await loadConversation(ticket, ticketEmail, token);
      toast.success("Secure access granted");
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

      setSupportAccessToken(token);
      setTrackResult(response.data?.ticket || null);
      await loadConversation(ticket, ticketEmail, token);
      toast.success("Secure access granted");
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
      if (remaining && remaining > 0) {
        toast.message("Please wait", {
          description: `Retry in ${remaining} seconds.`,
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

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();
    if (!ticket || !ticketEmail || !supportAccessToken.trim()) {
      toast.error("Secure access required first");
      return;
    }

    if (!draftMessage.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file");
      return;
    }

    setIsSendingMessage(true);
    try {
      await sendPublicSupportMessage(
        {
          ticket,
          email: ticketEmail,
          accessToken: supportAccessToken,
        },
        {
          body: draftMessage.trim(),
          attachments: draftFiles,
        },
      );

      setDraftMessage("");
      setDraftFiles([]);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      await loadConversation(ticket, ticketEmail, supportAccessToken);
      toast.success("Message sent");
    } catch (error: unknown) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    if (autoVerifyRef.current) {
      return;
    }

    if (!trackTicket.trim() || !trackEmail.trim() || !linkCode.trim()) {
      return;
    }

    autoVerifyRef.current = true;
    const ticket = trackTicket.trim().toUpperCase();
    const ticketEmail = trackEmail.trim();
    const code = linkCode.trim();

    const run = async () => {
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

        setSupportAccessToken(token);
        setTrackResult(response.data?.ticket || null);
        setOtpChallengeToken("");
        setOtpCode("");
        await loadConversation(ticket, ticketEmail, token);
        toast.success("Secure access granted");
      } catch (error: unknown) {
        toast.error("Failed to verify access code", {
          description: error instanceof Error ? error.message : "Please request OTP instead.",
        });
      } finally {
        setIsVerifyingCode(false);
      }
    };

    void run();
  }, [linkCode, trackEmail, trackTicket]);

  const conversationStatus = conversation?.status || trackResult?.status;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Lihatin" width={40} height={40} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Public Access</p>
                <h1 className="text-2xl font-semibold">Lihatin Support</h1>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </div>
        </header>

        {reason === "ACCOUNT_LOCKED" && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-6 text-sm text-amber-900">
              <p className="font-medium">Auto unlock info</p>
              <p className="mt-2">
                Account lock from failed login attempts auto-expire by lockout tier: 15 minutes (5 attempts), 30
                minutes (6), 45 minutes (7), and so on.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLifebuoy className="h-5 w-5" />
                Submit Support Ticket
              </CardTitle>
              <CardDescription>Public form. No login required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input
                    id="support-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Short summary of your issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-description">Description</Label>
                  <textarea
                    id="support-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={
                      preset?.descriptionHint ||
                      "Include what happened, last successful login time, and exact error message if any."
                    }
                    className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Captcha</Label>
                  {TURNSTILE_SITE_KEY ? (
                    <div ref={captchaRef} />
                  ) : IS_DEV ? (
                    <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                      Dev mode: captcha bypass enabled.
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-red-300 bg-red-50 p-3 text-sm text-red-700">
                      Turnstile site key missing (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>

                {submittedCode && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm break-words">
                    Ticket submitted. Code: <strong>{submittedCode}</strong>. Check email for secure conversation link.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconSearch className="h-5 w-5" />
                  Track & Open Ticket
                </CardTitle>
                <CardDescription>
                  Verify ticket, then open conversation using link code or OTP.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleTrackTicket} className="space-y-3">
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

                <div className="rounded-lg border p-3 space-y-3">
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
                    {isVerifyingCode ? "Verifying..." : "Verify Access Code"}
                  </Button>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="secondary" onClick={() => void handleRequestOTP()} disabled={isRequestingOTP}>
                      {isRequestingOTP ? "Requesting..." : "Send OTP"}
                    </Button>
                    <Button variant="outline" onClick={() => void handleResendOTP()} disabled={!otpChallengeToken || isResendingOTP}>
                      {isResendingOTP ? "Resending..." : "Resend OTP"}
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value)}
                      placeholder="Enter 6-digit OTP"
                    />
                    <Button onClick={() => void handleVerifyOTP()} disabled={!otpChallengeToken || isVerifyingOTP}>
                      {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </div>

                {trackResult && (
                  <div className="rounded-lg border p-4 text-sm space-y-2">
                    <p className="font-medium">{trackResult.ticket_code}</p>
                    <p className="text-muted-foreground">{trackResult.subject}</p>
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      <SupportStatusBadge status={trackResult.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">Created: {formatDateTime(trackResult.created_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Support Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5 pt-2">
                <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <IconClock className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Response</p>
                    <p className="mt-0.5 text-sm font-semibold">Within 24 hours (business day)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <IconTicket className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Support Hours</p>
                    <p className="mt-0.5 text-sm font-semibold">Mon - Fri, 09:00 - 18:00 WIB</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <IconMail className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email Fallback</p>
                    <p className="mt-0.5 text-sm font-semibold">support@lihat.in</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">Conversation</CardTitle>
            <CardDescription>
              {supportAccessToken
                ? "Secure thread active. You can reply and upload files."
                : "Verify ticket access to open 2-way conversation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              {conversationStatus ? <SupportStatusBadge status={conversationStatus} /> : <span className="text-muted-foreground">-</span>}
            </div>

            {isConversationLoading ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">Loading conversation...</div>
            ) : conversation ? (
              <>
                <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                  {(conversation.messages ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    (conversation.messages ?? []).map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        ticketCode={conversation.ticket_code}
                        email={trackEmail.trim()}
                        accessToken={supportAccessToken}
                      />
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="space-y-3 rounded-lg border p-3">
                  <textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Write message to support team"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => setDraftFiles(Array.from(event.target.files || []))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <IconPaperclip className="mr-2 h-4 w-4" />
                      Attach Files
                    </Button>
                    <Button type="submit" disabled={isSendingMessage}>
                      <IconSend className="mr-2 h-4 w-4" />
                      {isSendingMessage ? "Sending..." : "Send"}
                    </Button>
                  </div>

                  {draftFiles.length > 0 && (
                    <div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
                      {draftFiles.map((file) => file.name).join(", ")}
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                No active conversation. Verify access code or OTP first.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          Keep ticket code private. Support team will never ask your OTP or password.
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  ticketCode,
  email,
  accessToken,
}: {
  message: SupportMessageResponse;
  ticketCode: string;
  email: string;
  accessToken: string;
}) {
  const attachments = message.attachments ?? [];
  const mine = message.sender_type === "public" || message.sender_type === "user";
  const senderLabel = mine ? "You" : message.sender_type === "admin" ? "Support Team" : "System";

  return (
    <div className={`rounded-lg border p-3 text-sm ${mine ? "bg-white" : "bg-blue-50/50"}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-medium">{senderLabel}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</p>
      </div>
      <p className="whitespace-pre-wrap break-words text-foreground/90">{message.body}</p>

      {attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={getPublicSupportAttachmentURL({
                ticket: ticketCode,
                email,
                accessToken,
                attachmentID: attachment.id,
              })}
              className="block text-xs text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {attachment.file_name} ({formatBytes(attachment.size_bytes)})
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleString();
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Loading support page...
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}

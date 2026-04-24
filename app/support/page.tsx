"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  IconClock,
  IconLifebuoy,
  IconMail,
  IconSearch,
  IconTicket,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSupportTicket,
  trackSupportTicket,
  type SupportCategory,
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
        }
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

  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<SupportCategory>("other");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const [trackTicket, setTrackTicket] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<TrackSupportTicketResponse | null>(null);

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
    if (queryEmail) {
      setEmail(queryEmail);
      setTrackEmail(queryEmail);
    }

    if (preset) {
      setCategory(preset.category);
      setSubject((previous) => (previous ? previous : preset.subject));
      setDescription((previous) => (previous ? previous : preset.descriptionHint));
    }

    const queryTicket = (searchParams.get("ticket") || "").trim();
    if (queryTicket) {
      setTrackTicket(queryTicket.toUpperCase());
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

  const handleSubmitTicket = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
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
        description: code ? `Ticket code: ${code}` : "Ticket created successfully",
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

      if (response.data) {
        setTrackResult(response.data);
      }
    } catch (error: unknown) {
      setTrackResult(null);
      toast.error("Ticket not found", {
        description: error instanceof Error ? error.message : "Please check ticket and email.",
      });
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Lihatin" width={40} height={40} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Public Access
                </p>
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
                Account lock from failed login attempts auto-expire by lockout tier:
                15 minutes (5 attempts), 30 minutes (6), 45 minutes (7), and so on.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconLifebuoy className="h-5 w-5" />
                Submit Support Ticket
              </CardTitle>
              <CardDescription>
                Public form. No login required.
              </CardDescription>
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
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as SupportCategory)}
                  >
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
                      "Include what happened, last successful login time, and any exact error message."
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
                      ⚠️ Dev mode — captcha bypassed (no site key configured).
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-red-300 bg-red-50 p-3 text-sm text-red-700">
                      Turnstile site key missing in frontend env (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>

                {submittedCode && (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    Ticket submitted successfully. Your ticket code: <strong>{submittedCode}</strong>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconSearch className="h-5 w-5" />
                  Track Ticket
                </CardTitle>
                <CardDescription>
                  Already submitted? Check current status here.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {isTracking ? "Checking..." : "Track"}
                  </Button>
                </form>

                {trackResult && (
                  <div className="mt-4 rounded-lg border p-4 text-sm space-y-2">
                    <p className="font-medium">{trackResult.ticket_code}</p>
                    <p className="text-muted-foreground">{trackResult.subject}</p>
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      <SupportStatusBadge status={trackResult.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDateTime(trackResult.created_at)}
                    </p>
                    {trackResult.resolved_at && (
                      <p className="text-xs text-muted-foreground">
                        Resolved: {formatDateTime(trackResult.resolved_at)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Support Info</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-5">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <IconClock className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Estimated Response
                      </p>
                      <p className="text-sm font-semibold mt-0.5">Within 24 hours (business day)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <IconTicket className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Support Hours
                      </p>
                      <p className="text-sm font-semibold mt-0.5">Mon - Fri, 09:00 - 18:00 WIB</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <IconMail className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email Fallback
                      </p>
                      <p className="text-sm font-semibold mt-0.5">support@lihat.in</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Keep ticket code private. Support team will never ask your OTP or password.
        </div>
      </div>
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

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
          Loading support page...
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}

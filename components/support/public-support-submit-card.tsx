"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconLifebuoy } from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportTurnstileField } from "@/components/support/support-turnstile-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSupportTicket, type SupportCategory } from "@/lib/api/support";
import {
  categoryOptions,
  getSupportReasonFromSearch,
  reasonPresetMap,
} from "@/lib/support/public-support";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const IS_DEV = process.env.NODE_ENV === "development";

export function PublicSupportSubmitCard() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<SupportCategory>("other");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const reason = useMemo(() => getSupportReasonFromSearch(searchParams.get("reason")), [searchParams]);
  const preset = reason ? reasonPresetMap[reason] : null;

  useEffect(() => {
    const queryEmail = (searchParams.get("email") || "").trim();
    if (queryEmail) {
      setEmail(queryEmail);
    }

    if (preset) {
      setCategory(preset.category);
      setSubject((previous) => (previous ? previous : preset.subject));
      setDescription((previous) => (previous ? previous : preset.descriptionHint));
    }
  }, [preset, searchParams]);

  const handleSubmitTicket = async (event: ChangeEvent) => {
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

      toast.success("Support ticket submitted", {
        description: code
          ? `Ticket ${code} created. Open email for secure access link.`
          : "Ticket created successfully",
      });

      setCaptchaToken("");
      setCaptchaResetSignal((previous) => previous + 1);
    } catch (error: unknown) {
      toast.error("Failed to submit ticket", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="min-w-0 shadow-sm">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">New Request Form</p>
        <CardTitle className="flex items-center gap-2">
          <IconLifebuoy className="h-5 w-5" />
          Submit Support Ticket
        </CardTitle>
        <CardDescription>Public form. No login required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitTicket} className="space-y-5">
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
            <SupportTurnstileField
              token={captchaToken}
              onTokenChange={setCaptchaToken}
              resetSignal={captchaResetSignal}
            />
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
  );
}

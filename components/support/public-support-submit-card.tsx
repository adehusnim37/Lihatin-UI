"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconLifebuoy } from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportTurnstileField } from "@/components/support/support-turnstile-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type SupportCategory } from "@/lib/api/support";
import { useCreateSupportTicketMutation } from "@/lib/hooks/queries/useSupportQuery";
import {
  categoryOptions,
  getSupportReasonFromSearch,
  reasonPresetMap,
} from "@/lib/support/public-support";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const IS_DEV = process.env.NODE_ENV === "development";

export function PublicSupportSubmitCard() {
  const searchParams = useSearchParams();
  const queryEmail = useMemo(
    () => (searchParams.get("email") || "").trim(),
    [searchParams],
  );
  const reason = useMemo(() => getSupportReasonFromSearch(searchParams.get("reason")), [searchParams]);
  const preset = reason ? reasonPresetMap[reason] : null;

  const [email, setEmail] = useState(queryEmail);
  const [category, setCategory] = useState<SupportCategory>(preset?.category || "other");
  const [subject, setSubject] = useState(preset?.subject || "");
  const [description, setDescription] = useState(preset?.descriptionHint || "");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const createTicketMutation = useCreateSupportTicketMutation();

  const handleSubmitTicket = async (event: FormEvent<HTMLFormElement>) => {
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

    try {
      const response = await createTicketMutation.mutateAsync({
        email: email.trim(),
        category,
        subject: subject.trim(),
        description: description.trim(),
        captcha_token: skipCaptcha ? "dev-bypass" : captchaToken.trim(),
      });

      const code = response.ticket_code || null;
      setSubmittedCode(code);

      toast.success("Support ticket submitted", {
        description: code
          ? `Ticket ${code} created. Open email for secure access link.`
          : "Ticket created successfully",
      });

      setCategory(preset?.category || "other");
      setSubject("");
      setDescription("");
      setCaptchaToken("");
      setCaptchaResetSignal((previous) => previous + 1);
    } catch (error: unknown) {
      toast.error("Failed to submit ticket", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
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
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <SelectTrigger className="w-full">
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

          <Button type="submit" className="w-full" disabled={createTicketMutation.isPending}>
            {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
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

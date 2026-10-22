"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { IconCircleCheck, IconMail } from "@tabler/icons-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupportConversationResponse, SupportRecoveryTarget } from "@/lib/api/support";
import { useSupportRecoveryMutation } from "@/lib/hooks/queries/useSupportQuery";

// The OTP form exists only after the conversation's own authorization succeeded.
export function SupportRecoveryVerification({
  conversation,
  target,
}: {
  conversation: SupportConversationResponse;
  target: SupportRecoveryTarget;
}) {
  const id = useId();
  const [now, setNow] = useState(Date.now);
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useSupportRecoveryMutation();
  useEffect(() => {
    if (conversation.category !== "lost_2fa" || conversation.status !== "in_progress") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [conversation.category, conversation.status]);
  if (conversation.category !== "lost_2fa" || conversation.status !== "in_progress") return null;
  const status = conversation.recovery_verification;
  const requestedAt = Date.parse(status?.requested_at ?? "");
  const expiresAt = Date.parse(status?.expires_at ?? "");
  const verifiedAt = Date.parse(status?.verified_at ?? "");
  const verified = verifiedAt > now - 24 * 60 * 60 * 1000 && verifiedAt <= now;
  const remaining = Math.max(0, Math.ceil((requestedAt + 60_000 - now) / 1000)) || 0;
  const active = expiresAt > now;

  const resend = async () => {
    if (mutation.isPending || remaining > 0) return;
    setError(null);
    try {
      await mutation.mutateAsync({ target });
      setCode("");
      setConfirmed(false);
      toast.success("Recovery code sent", {
        description: "Check the email address registered to this ticket. Use the newest code.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The code could not be sent. Try again.");
    }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!confirmed || code.length !== 6 || mutation.isPending) return;
    setError(null);
    try {
      await mutation.mutateAsync({ target, code });
      setCode("");
      toast.success("Recovery email verified", {
        description: "Support will review your request before approving any reset.",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Check the latest code and try again.",
      );
    }
  };

  return (
    <section className="space-y-3 border-y py-4" aria-labelledby={`${id}-title`}>
      <div className="flex items-start gap-2.5">
        {verified ? (
          <IconCircleCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        ) : (
          <IconMail className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="space-y-1">
          <h2 id={`${id}-title`} className="text-sm font-semibold">
            {verified ? "Recovery email verified" : "Verify your recovery request"}
          </h2>
          <p className="max-w-prose text-sm leading-6 text-muted-foreground">
            {verified
              ? "Support must still review and approve your reset. Your authenticator and passkeys have not been changed."
              : !status?.requested_at
                ? "Support will request email verification after reviewing your Lost 2FA ticket. This section updates automatically."
                : active
                  ? "Support sent a 6-digit code to the email address on this ticket. Enter it here within 10 minutes. Never send the code to staff or post it in a message."
                  : "Request a new recovery code below. Enter it only in this form; never share it in a message."}
          </p>
        </div>
      </div>
      {!verified && status?.requested_at && (
        <form className="space-y-3" onSubmit={verify}>
          {active && (
            <>
              <div className="max-w-xs space-y-2">
                <Label htmlFor={`${id}-code`}>Recovery email code</Label>
                <Input
                  id={`${id}-code`}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  disabled={mutation.isPending}
                  placeholder="6-digit code"
                  aria-describedby={`${id}-notice`}
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id={`${id}-consent`}
                  checked={confirmed}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                  disabled={mutation.isPending}
                />
                <Label htmlFor={`${id}-consent`} className="text-sm leading-5">
                  I requested account recovery for this ticket.
                </Label>
              </div>
              <p id={`${id}-notice`} className="text-xs leading-5 text-muted-foreground">
                This verifies email ownership. An administrator must approve any credential reset
                separately.
              </p>
            </>
          )}
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {active && (
              <Button
                type="submit"
                disabled={!confirmed || code.length !== 6 || mutation.isPending}
              >
                {mutation.isPending ? "Processing…" : "Verify recovery email"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => void resend()}
              disabled={mutation.isPending || remaining > 0}
            >
              {remaining > 0
                ? `Resend in ${remaining}s`
                : active
                  ? "Resend recovery code"
                  : "Send new recovery code"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

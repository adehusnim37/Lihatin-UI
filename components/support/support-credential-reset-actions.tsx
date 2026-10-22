"use client";

import { useEffect, useState } from "react";
import { IconKeyOff, IconShieldOff } from "@tabler/icons-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminSupportTicketDetailResponse, SupportResetMethod } from "@/lib/api/support";
import { verifySecurityAction, verifyWithPasskey } from "@/lib/api/security";
import { useApproveSupportCredentialResetMutation } from "@/lib/hooks/queries/useSupportQuery";

export function SupportCredentialResetActions({
  ticket,
  disabled = false,
}: {
  ticket: AdminSupportTicketDetailResponse;
  disabled?: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [method, setMethod] = useState<SupportResetMethod | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [approved, setApproved] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useApproveSupportCredentialResetMutation();
  if (ticket.category !== "lost_2fa") return null;

  const verifiedAt = ticket.requester_verified_at ? Date.parse(ticket.requester_verified_at) : 0;
  const recentlyVerified = verifiedAt > now - 24 * 60 * 60 * 1000 && verifiedAt <= now;
  const unavailable =
    disabled ||
    busy ||
    ticket.status !== "in_progress" ||
    !ticket.user_id ||
    !recentlyVerified ||
    Boolean(ticket.credential_reset);
  const ready =
    approved &&
    reason.trim().length >= 20 &&
    reason.trim().length <= 1000 &&
    confirmation.trim() === ticket.ticket_code &&
    !unavailable;

  const open = (value: SupportResetMethod) => {
    setMethod(value);
    setReason("");
    setConfirmation("");
    setApproved(false);
    setCode("");
    setError(null);
  };
  const execute = async (withPasskey: boolean) => {
    if (!method || !ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const proof = withPasskey
        ? await verifyWithPasskey()
        : await verifySecurityAction({ totp_code: code });
      await mutation.mutateAsync({
        id: ticket.id,
        payload: {
          method,
          approved: true,
          reason: reason.trim(),
          ticket_code: confirmation.trim(),
          verification_token: proof.verification_token,
        },
      });
      toast.success("Recovery approved", {
        description:
          "Credentials removed and sessions revoked. A security email is queued for the user.",
      });
      setMethod(null);
      setCode("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Recovery could not be approved. Verify again to retry.",
      );
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => open("totp")}
        disabled={unavailable}
        className="h-11 justify-start rounded-lg px-3 text-destructive"
      >
        <IconShieldOff className="mr-2 size-4" />
        Reset Authenticator (TOTP)
      </Button>
      <Button
        variant="ghost"
        onClick={() => open("passkeys")}
        disabled={unavailable}
        className="h-11 justify-start rounded-lg px-3 text-destructive"
      >
        <IconKeyOff className="mr-2 size-4" />
        Remove All Passkeys
      </Button>
      <p className="px-3 text-xs text-muted-foreground">
        {ticket.credential_reset
          ? `Recovery approved (${ticket.credential_reset.method}). Security email ${ticket.credential_reset.notification_sent_at ? "sent" : "queued"}.`
          : "Requires In Progress status, requester email OTP verification within 24 hours, and your explicit approval. Admin accounts are excluded."}
      </p>
      <Dialog
        open={method !== null}
        onOpenChange={(next) => {
          if (!next && !busy) {
            setMethod(null);
            setCode("");
          }
        }}
      >
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Approve account recovery</DialogTitle>
            <DialogDescription>
              Review ownership of {ticket.email} before removing sign-in protection. This action
              resolves {ticket.ticket_code} and signs out all existing sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Verify ownership using your support review procedure. A submitted ticket or its
                status alone does not authorize a reset. Removing passkeys requires another sign-in
                method.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="recovery-method">Remove</Label>
              <Select
                value={method ?? "totp"}
                onValueChange={(value) => setMethod(value as SupportResetMethod)}
                disabled={busy}
              >
                <SelectTrigger id="recovery-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totp">Authenticator and recovery codes</SelectItem>
                  <SelectItem value="passkeys">All passkeys</SelectItem>
                  <SelectItem value="all">
                    Authenticator, recovery codes, and all passkeys
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-reason">Ownership verification and approval reason</Label>
              <textarea
                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                id="recovery-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={20}
                maxLength={1000}
                disabled={busy}
                placeholder="Describe the evidence reviewed. Do not enter passwords, codes, or sensitive identity documents."
              />
              <p className="text-xs text-muted-foreground">
                20–1000 characters. Saved in the internal audit record.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="recovery-approval"
                checked={approved}
                onCheckedChange={(value) => setApproved(value === true)}
                disabled={busy}
              />
              <Label htmlFor="recovery-approval" className="text-sm leading-5">
                I verified this requester owns the linked account and explicitly approve this reset.
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-confirmation">Type {ticket.ticket_code} to confirm</Label>
              <Input
                id="recovery-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={busy}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-totp">Your admin authenticator code</Label>
              <Input
                id="admin-totp"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={busy}
                placeholder="6-digit code"
              />
            </div>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                disabled={!ready || code.length !== 6 || busy}
                onClick={() => void execute(false)}
              >
                {busy ? "Processing…" : "Approve and reset with authenticator"}
              </Button>
              <Button
                variant="outline"
                disabled={!ready || busy}
                onClick={() => void execute(true)}
              >
                Approve and reset with my passkey
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setMethod(null);
                  setCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

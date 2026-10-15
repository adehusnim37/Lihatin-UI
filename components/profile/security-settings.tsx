"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Fingerprint,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import SetupTOTPModal from "./modal/setupTOTP";
import DisableTOTPModal from "./modal/disableTOTP";
import { useAuth } from "@/app/context/AuthContext";
import { profileKeys } from "@/lib/hooks/queries/useProfileQuery";
import {
  getPasskeys,
  getTOTPStatus,
  passkeyError,
  registerPasskey,
  regenerateRecoveryCodes,
  removePasskey,
  renamePasskey,
  verifySecurityAction,
  verifyWithPasskey,
  type Passkey,
} from "@/lib/api/security";
import { buildAuthSupportURL } from "@/lib/auth-support";

const queryKey = ["account-security"];
const subscribe = () => () => {};
function date(value?: string) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not used yet";
}
type Task =
  { kind: "add" } | { kind: "remove" | "rename"; passkey: Passkey } | { kind: "recovery" };

export function SecuritySettings() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const client = useQueryClient();
  const supported = useSyncExternalStore(
    subscribe,
    () => Boolean(window.isSecureContext && window.PublicKeyCredential && navigator.credentials),
    () => false,
  );
  const statusQuery = useQuery({
    queryKey: [...queryKey, "totp", user?.id],
    queryFn: getTOTPStatus,
    enabled: !!user,
  });
  const passkeyQuery = useQuery({
    queryKey: [...queryKey, "passkeys", user?.id],
    queryFn: getPasskeys,
    enabled: !!user,
  });
  const [task, setTask] = useState<Task | null>(null);
  const [name, setName] = useState("");
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const status = statusQuery.data;
  const passkeys = passkeyQuery.data?.passkeys ?? [];
  const admin = user?.role === "admin" || user?.role === "super_admin";
  const refresh = () => {
    void client.invalidateQueries({ queryKey });
    void client.invalidateQueries({ queryKey: profileKeys.all });
  };
  const open = (next: Task) => {
    setTask(next);
    setError(null);
    setProof("");
    setCodes([]);
    setCopied(false);
    setName(next.kind === "rename" ? next.passkey.name : "");
  };
  const close = () => {
    if (!busy) {
      setTask(null);
      setProof("");
      setCodes([]);
      setError(null);
    }
  };
  const execute = async (withPasskey = false) => {
    if (!task) return;
    setBusy(true);
    setError(null);
    try {
      if (task.kind === "rename") {
        await renamePasskey(task.passkey.id, name.trim());
      } else {
        const verification = withPasskey
          ? await verifyWithPasskey()
          : await verifySecurityAction(
              status?.enabled ? { totp_code: proof } : { password: proof },
            );
        if (task.kind === "add")
          await registerPasskey(name.trim(), verification.verification_token);
        if (task.kind === "remove")
          await removePasskey(task.passkey.id, verification.verification_token);
        if (task.kind === "recovery") {
          const result = await regenerateRecoveryCodes(verification.verification_token);
          setCodes(result.recovery_codes);
        }
      }
      refresh();
      setProof("");
      if (task.kind !== "recovery") {
        toast.success(
          task.kind === "add"
            ? "Passkey added"
            : task.kind === "remove"
              ? "Passkey removed"
              : "Passkey renamed",
        );
        setTask(null);
      }
    } catch (err) {
      setError(passkeyError(err));
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          `Lihat.in recovery codes\n\n${codes.join("\n")}\n\nEach code works once. Keep these codes private.\n`,
        ],
        { type: "text/plain" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "lihatin-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user || statusQuery.isPending)
    return (
      <div role="status" aria-label="Loading security settings" className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  if (statusQuery.isError)
    return (
      <div role="alert" className="rounded-xl border p-6">
        <p className="font-medium">Security settings could not be loaded.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try again before making changes to your sign-in methods.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => void statusQuery.refetch()}>
          Try again
        </Button>
      </div>
    );

  return (
    <>
      <div className="@container min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground">
        <div className="flex items-start gap-3 border-b bg-muted/30 px-5 py-4 sm:px-6">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary-ink" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {status?.enabled
                ? "Two-factor authentication is enabled"
                : "Strengthen your account security"}
            </p>
            <p className="max-w-prose text-sm leading-6 text-muted-foreground">
              {status?.enabled
                ? "Your authenticator adds a verification step after password or passkey sign-in."
                : "Add an authenticator for two-factor verification, or a passkey for device-based sign-in."}
            </p>
          </div>
        </div>
        <div className="divide-y px-5 sm:px-6">
          <section aria-labelledby="authenticator-title" className="py-6">
            <div className="flex flex-col gap-4 @min-[640px]:flex-row @min-[640px]:items-start @min-[640px]:justify-between @min-[640px]:gap-6">
              <div className="flex min-w-0 gap-3">
                <Smartphone
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="authenticator-title" className="text-base font-semibold">
                      Authenticator app
                    </h2>
                    <StatusBadge tone={status?.enabled ? "success" : "neutral"} withIcon={false}>
                      {status?.enabled ? "Enabled" : "Not set up"}
                    </StatusBadge>
                  </div>
                  <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                    Get verification codes from Google Authenticator, 1Password, or a similar app.
                  </p>
                  {status?.enabled && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {status.friendly_name || "Authenticator"} · Last used {date(status.last_used)}
                    </p>
                  )}
                  {admin && status?.enabled && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Required for administrator accounts.
                    </p>
                  )}
                </div>
              </div>
              {!(admin && status?.enabled) && (
                <div className="w-full shrink-0 @min-[640px]:w-48 [&>button]:w-full">
                  {status?.enabled ? (
                    <DisableTOTPModal onDisableComplete={refresh} />
                  ) : (
                    <SetupTOTPModal
                      onSetupComplete={refresh}
                      openOnMount={searchParams.get("setup") === "authenticator"}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="passkeys-title" className="space-y-4 py-6">
            <div className="flex flex-col gap-4 @min-[640px]:flex-row @min-[640px]:items-start @min-[640px]:justify-between @min-[640px]:gap-6">
              <div className="flex min-w-0 gap-3">
                <Fingerprint
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="passkeys-title" className="text-base font-semibold">
                      Passkeys
                    </h2>
                    {passkeyQuery.isSuccess && (
                      <span className="text-xs text-muted-foreground">
                        {passkeys.length} of 10 added
                      </span>
                    )}
                  </div>
                  <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                    Use your fingerprint, face, device screen lock, or a security key to sign in.
                  </p>
                </div>
              </div>
              <Button
                className="w-full shrink-0 @min-[640px]:w-48"
                onClick={() => open({ kind: "add" })}
                disabled={
                  !supported ||
                  !passkeyQuery.data?.available ||
                  passkeyQuery.isError ||
                  passkeys.length >= 10
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add passkey
              </Button>
            </div>
            {!supported && (
              <p className="text-sm text-muted-foreground">
                Passkeys need a supported browser and a secure connection.
              </p>
            )}
            {passkeyQuery.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : passkeyQuery.isError ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-4"
              >
                <p className="text-sm">Passkeys could not be loaded.</p>
                <Button variant="outline" onClick={() => void passkeyQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : passkeys.length ? (
              <ul className="divide-y sm:ml-8" aria-label="Registered passkeys">
                {passkeys.map((passkey) => (
                  <li
                    key={passkey.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="text-sm font-medium [overflow-wrap:anywhere]">{passkey.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Added {date(passkey.created_at)} · Last used {date(passkey.last_used_at)}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${passkey.name}`}
                        onClick={() => open({ kind: "rename", passkey })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${passkey.name}`}
                        onClick={() => open({ kind: "remove", passkey })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg bg-muted/40 px-4 py-3 sm:ml-8">
                <p className="text-sm font-medium">No passkeys yet</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Add your first passkey to sign in without typing your password.
                </p>
              </div>
            )}
            {passkeyQuery.data && !passkeyQuery.data.available && (
              <p className="text-sm text-muted-foreground">
                Passkeys are not configured for this environment. Your existing sign-in methods
                still work.
              </p>
            )}
          </section>

          <section
            aria-labelledby="recovery-title"
            className="flex flex-col gap-4 py-6 @min-[640px]:flex-row @min-[640px]:items-start @min-[640px]:justify-between @min-[640px]:gap-6"
          >
            <div className="flex min-w-0 gap-3">
              <KeyRound
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="recovery-title" className="text-base font-semibold">
                    Recovery codes
                  </h2>
                  {status?.enabled && (
                    <StatusBadge
                      tone={status.recovery_codes_left ? "neutral" : "warning"}
                      withIcon={false}
                    >
                      {status.recovery_codes_left ?? 0} remaining
                    </StatusBadge>
                  )}
                </div>
                <p className="max-w-prose text-sm leading-6 text-muted-foreground">
                  One-time codes for when you can’t access your authenticator.
                </p>
                <p className="max-w-prose text-xs leading-5 text-muted-foreground">
                  {status?.enabled
                    ? "Generating a new set replaces your current codes. Save them before closing."
                    : "Set up your authenticator to receive recovery codes."}
                </p>
              </div>
            </div>
            {status?.enabled && (
              <Button
                variant="outline"
                className="w-full shrink-0 @min-[640px]:w-48"
                onClick={() => open({ kind: "recovery" })}
              >
                Generate new codes
              </Button>
            )}
          </section>
        </div>
      </div>

      <section aria-labelledby="help-title" className="space-y-3 px-1">
        <h2 id="help-title" className="text-sm font-semibold">
          Devices & account recovery
        </h2>
        <div className="flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:flex-wrap">
          <Link
            href="/profile/sessions"
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-primary-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Review active sessions
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
          <Link
            href={buildAuthSupportURL("LOST_2FA", user.email, "totp")}
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-primary-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Lost access? Get help
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
        <p className="max-w-prose text-xs leading-5 text-muted-foreground">
          Support reviews account ownership. A support request does not disable two-factor
          authentication.
        </p>
      </section>
      <Dialog
        open={!!task}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {codes.length
                ? "Save your new recovery codes"
                : task?.kind === "add"
                  ? "Add a passkey"
                  : task?.kind === "remove"
                    ? "Remove this passkey?"
                    : task?.kind === "rename"
                      ? "Rename passkey"
                      : "Replace recovery codes?"}
            </DialogTitle>
            <DialogDescription>
              {codes.length
                ? "These codes are shown once. Each code can be used for one sign-in."
                : task?.kind === "remove"
                  ? `Remove “${task.passkey.name}” from your account. You can still use your other sign-in methods.`
                  : task?.kind === "recovery"
                    ? "Your current recovery codes will stop working. Save the new set before closing this window."
                    : task?.kind === "add"
                      ? "Choose a name, verify your identity, then follow your device’s prompt."
                      : "Use a name that helps you recognize this passkey."}
            </DialogDescription>
          </DialogHeader>
          {codes.length ? (
            <>
              <ul
                className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm tabular-nums"
                aria-label="New recovery codes"
              >
                {codes.map((code) => (
                  <li key={code} className="py-1 text-center">
                    {code}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(codes.join("\n"));
                      setCopied(true);
                    } catch {
                      setError("Could not copy codes. Download them instead.");
                    }
                  }}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={download}>
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
              <Button onClick={close}>I&apos;ve saved these codes</Button>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void execute();
              }}
              className="space-y-4"
            >
              {(task?.kind === "add" || task?.kind === "rename") && (
                <div className="space-y-2">
                  <Label htmlFor="passkey-name">Passkey name</Label>
                  <Input
                    id="passkey-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    autoComplete="off"
                    placeholder="e.g. MacBook or password manager"
                    required
                    disabled={busy}
                  />
                </div>
              )}
              {task?.kind !== "rename" && (
                <div className="space-y-3">
                  {passkeys.length > 0 && supported && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Use an existing passkey to verify your identity.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={busy || (task?.kind === "add" && !name.trim())}
                        onClick={() => void execute(true)}
                      >
                        <Fingerprint className="size-4" />
                        Verify with an existing passkey
                      </Button>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="security-proof">
                      {status?.enabled ? "Authenticator code" : "Current password"}
                    </Label>
                    <Input
                      id="security-proof"
                      type={status?.enabled ? "text" : "password"}
                      inputMode={status?.enabled ? "numeric" : undefined}
                      autoComplete={status?.enabled ? "one-time-code" : "current-password"}
                      maxLength={status?.enabled ? 6 : undefined}
                      value={proof}
                      onChange={(event) =>
                        setProof(
                          status?.enabled
                            ? event.target.value.replace(/\D/g, "")
                            : event.target.value,
                        )
                      }
                      required
                      disabled={busy}
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      {status?.enabled
                        ? "Enter the current 6-digit code from your authenticator."
                        : "If your account has no password, set up an authenticator first."}
                    </p>
                  </div>
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={busy} onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={task?.kind === "remove" ? "destructive" : "default"}
                  disabled={
                    busy ||
                    ((task?.kind === "add" || task?.kind === "rename") && !name.trim()) ||
                    (task?.kind !== "rename" && (status?.enabled ? proof.length !== 6 : !proof))
                  }
                >
                  {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}
                  {busy
                    ? "Verifying…"
                    : task?.kind === "add"
                      ? "Continue"
                      : task?.kind === "remove"
                        ? "Remove passkey"
                        : task?.kind === "rename"
                          ? "Save name"
                          : "Generate new codes"}
                </Button>
              </DialogFooter>
            </form>
          )}
          {codes.length > 0 && error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

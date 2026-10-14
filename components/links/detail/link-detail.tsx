"use client";

import { useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  Info,
  Pencil,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ShortLink, UpdateShortLinkRequest } from "@/lib/api/shortlinks";
import { useUpdateLink } from "@/lib/hooks/queries/useLinksQuery";
import { LinkStatusBadge } from "@/components/ui/app-status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UpdatePasscodeDialog } from "./update-passcode";
import { UpdateExpirationDialog } from "./update-expiration";
import { UpdateClickLimitDialog } from "./update-click-limit";
import { LinkQRCode } from "./link-qrcode";

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy · HH:mm");
}

export function LinkDetail({ link }: { link: ShortLink }) {
  const router = useRouter();
  const update = useUpdateLink();
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<"passcode" | "expiration" | "limit" | null>(null);
  const [editingTags, setEditingTags] = useState(false);
  const [tags, setTags] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
  });
  const baseUrl = (
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");
  const shortUrl = `${baseUrl}/${link.short_code}${link.detail?.passcode ? `/${link.detail.passcode}` : ""}`;
  const clicks = link.click_count ?? link.detail?.current_clicks ?? 0;
  const clickLimit = link.detail?.click_limit ?? 0;
  const pending = update.isPending;
  const tagFields = [
    { key: "utm_source", label: "Source" },
    { key: "utm_medium", label: "Medium" },
    { key: "utm_campaign", label: "Campaign" },
    { key: "utm_content", label: "Content" },
  ] as const;
  const save = (data: UpdateShortLinkRequest) =>
    update.mutateAsync({ code: link.short_code, data });
  const updateSetting = async (_code: string, data: UpdateShortLinkRequest) => {
    await save(data);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link. Select the URL and copy it manually.");
    }
  };
  const saveTags = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await save(tags);
      setEditingTags(false);
    } catch {
      /* The mutation displays the API error. */
    }
  };

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/main/links"
        className="flex w-fit items-center gap-1.5 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-3.5" />
        Back to links
      </Link>
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Link details</h1>
            <LinkStatusBadge
              isActive={link.is_active}
              expiresAt={link.expires_at}
              isBanned={link.detail?.is_banned}
              className="h-6"
            />
          </div>
          <p className="break-words text-sm text-muted-foreground">
            {link.title || link.short_code}
          </p>
        </div>
        <Button asChild className="h-10 w-fit shrink-0">
          <Link href={`/main/analytics/${link.short_code}`}>
            <BarChart3 className="size-4" />
            View analytics
          </Link>
        </Button>
      </header>
      {link.detail?.is_banned && (
        <Alert variant="destructive">
          <AlertTitle>Link suspended</AlertTitle>
          <AlertDescription className="break-words">
            {link.detail.banned_reason || "This link has been suspended."}
            {link.detail.banned_by && (
              <span className="mt-1 block text-xs">Action by: {link.detail.banned_by}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">Short link</p>
          <a
            className="block break-all rounded-sm font-mono text-sm font-medium text-primary-ink hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortUrl}
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className="h-10" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-10">
                <QrCode className="size-4" />
                QR code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Share with a QR code</DialogTitle>
                <DialogDescription>
                  Scan to open this short link, or download the image.
                </DialogDescription>
              </DialogHeader>
              <LinkQRCode url={shortUrl} title={link.short_code} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6 lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-6 lg:space-y-0">
          <Card className="gap-0 shadow-none">
            <CardHeader className="gap-1 pb-4 px-4 sm:px-6">
              <CardTitle className="text-base">Link information</CardTitle>
              <CardDescription>Manage the name, destination, and short code.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y px-4 sm:px-6">
              <EditableField
                key={`title-${link.short_code}`}
                id="link-title"
                label="Title"
                value={link.title}
                required
                maxLength={100}
                pending={pending}
                onSave={async (value) => {
                  await save({ title: value });
                }}
              />
              <EditableField
                key={`slug-${link.short_code}`}
                id="link-code"
                label="Short code"
                value={link.short_code}
                required
                pending={pending}
                help="Changing the short code changes the shared URL. Existing links with the old code will stop working."
                onSave={async (value) => {
                  if (value === link.short_code) return;
                  await save({ short_code: value });
                  router.push(`/main/links/${encodeURIComponent(value)}`);
                }}
              >
                <code className="break-all text-sm">{link.short_code}</code>
              </EditableField>
              <EditableField
                key={`destination-${link.short_code}`}
                id="link-destination"
                label="Destination URL"
                value={link.original_url}
                required
                type="url"
                pending={pending}
                onSave={async (value) => {
                  await save({ original_url: value });
                }}
              >
                <a
                  href={link.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-start gap-1 text-sm hover:text-primary-ink"
                >
                  <span className="break-all">{link.original_url}</span>
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" />
                </a>
              </EditableField>
              <EditableField
                key={`description-${link.short_code}`}
                id="link-description"
                label="Description"
                value={link.description}
                multiline
                maxLength={2000}
                pending={pending}
                onSave={async (value) => {
                  await save({ description: value });
                }}
              />
            </CardContent>
          </Card>

          <Card className="gap-4 shadow-none">
            <CardHeader className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6">
              <div className="space-y-1">
                <CardTitle className="text-base">Campaign tags</CardTitle>
                <CardDescription>UTM parameters associated with this link.</CardDescription>
              </div>
              {!editingTags && (
                <Button
                  variant="ghost"
                  className="h-10 -mr-2"
                  aria-label="Edit campaign tags"
                  onClick={() => {
                    setTags({
                      utm_source: link.detail?.utm_source || "",
                      utm_medium: link.detail?.utm_medium || "",
                      utm_campaign: link.detail?.utm_campaign || "",
                      utm_content: link.detail?.utm_content || "",
                    });
                    setEditingTags(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {editingTags ? (
                <form onSubmit={saveTags} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tagFields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`tag-${field.key}`}>{field.label}</Label>
                        <Input
                          id={`tag-${field.key}`}
                          value={tags[field.key]}
                          disabled={pending}
                          onChange={(event) =>
                            setTags({ ...tags, [field.key]: event.target.value })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setEditingTags(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={pending}>
                      {pending ? "Saving…" : "Save tags"}
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {tagFields.map((field) => (
                    <div className="min-w-0 space-y-1" key={field.key}>
                      <dt className="text-xs text-muted-foreground">{field.label}</dt>
                      <dd className="break-words text-sm">
                        {link.detail?.[field.key] || (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>
        <aside
          className="min-w-0 space-y-6 lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-6 lg:space-y-0"
          aria-label="Link settings"
        >
          <Card className="gap-0 shadow-none">
            <CardHeader className="gap-1 pb-4 px-4 sm:px-6">
              <CardTitle className="text-base">Access settings</CardTitle>
              <CardDescription>Control how visitors access your link.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y px-4 sm:px-6">
              <SettingRow
                label="Passcode"
                value={link.detail?.passcode ? "Protected with a 6-digit PIN" : "Public access"}
                action={link.detail?.passcode ? "Change" : "Set PIN"}
                onClick={() => setDialog("passcode")}
              />
              <SettingRow
                label="Expiration"
                value={link.expires_at ? dateLabel(link.expires_at) : "Never expires"}
                action="Change"
                onClick={() => setDialog("expiration")}
              />
              <SettingRow
                label="Click limit"
                value={
                  clickLimit > 0
                    ? `${clicks.toLocaleString("en-US")} of ${clickLimit.toLocaleString("en-US")} clicks used`
                    : "Unlimited clicks"
                }
                action="Change"
                onClick={() => setDialog("limit")}
              />
              <div className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Domain</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5">Coming soon</span>
                  </div>
                  <p className="break-all text-sm">
                    {link.detail?.custom_domain || "Default domain"}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-2 size-10 shrink-0 text-muted-foreground"
                      aria-label="About domains and upcoming subdomains"
                      title="About domains"
                    >
                      <Info className="size-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Subdomains are coming soon</DialogTitle>
                      <DialogDescription>
                        Give your short links a more recognizable address.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm leading-relaxed">
                      <p>
                        A domain is a website’s address, such as{" "}
                        <strong className="font-medium">lihat.in</strong>. A subdomain adds a name
                        before it to create an address for your organization, team, or campaign.
                      </p>
                      <div className="space-y-2 rounded-lg bg-muted p-4">
                        <p className="text-xs text-muted-foreground">Example subdomain</p>
                        <code className="block break-all font-medium text-primary-ink">
                          upn.lihat.in
                        </code>
                        <p className="text-xs text-muted-foreground">
                          Your short link could look like{" "}
                          <span className="break-all">upn.lihat.in/rp</span>.
                        </p>
                      </div>
                      <p className="text-muted-foreground">
                        Soon, you’ll be able to add a subdomain under lihat.in. This feature is
                        still in development and isn’t available yet.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          <Card className="gap-4 shadow-none">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base">Link activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <dl className="divide-y">
                <div className="flex items-center justify-between gap-4 pb-4">
                  <dt className="text-sm text-muted-foreground">Total clicks</dt>
                  <dd className="text-xl font-semibold tracking-tight tabular-nums">
                    {clicks.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="text-right text-xs tabular-nums">{dateLabel(link.created_at)}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-3">
                  <dt className="text-xs text-muted-foreground">Updated</dt>
                  <dd className="text-right text-xs tabular-nums">{dateLabel(link.updated_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
      <UpdatePasscodeDialog
        key={`pin-${link.detail?.passcode}`}
        shortCode={link.short_code}
        currentPasscode={link.detail?.passcode ? link.detail.passcode.toString() : undefined}
        open={dialog === "passcode"}
        onOpenChange={(open) => setDialog(open ? "passcode" : null)}
        onUpdate={updateSetting}
      />
      <UpdateExpirationDialog
        key={`expiry-${link.expires_at}`}
        shortCode={link.short_code}
        currentExpiration={link.expires_at}
        open={dialog === "expiration"}
        onOpenChange={(open) => setDialog(open ? "expiration" : null)}
        onUpdate={updateSetting}
      />
      <UpdateClickLimitDialog
        key={`limit-${clickLimit}`}
        shortCode={link.short_code}
        currentLimit={clickLimit}
        open={dialog === "limit"}
        onOpenChange={(open) => setDialog(open ? "limit" : null)}
        onUpdate={updateSetting}
      />
    </section>
  );
}

function EditableField({
  id,
  label,
  value,
  children,
  multiline,
  type = "text",
  required,
  maxLength,
  pending,
  onSave,
  help,
}: {
  id: string;
  label: string;
  value: string;
  children?: ReactNode;
  multiline?: boolean;
  type?: "text" | "url";
  required?: boolean;
  maxLength?: number;
  pending: boolean;
  onSave: (value: string) => Promise<void>;
  help?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = multiline ? draft : draft.trim();
    if (required && !next) return;
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      /* The mutation displays the API error. */
    }
  };
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      {editing ? (
        <form
          onSubmit={submit}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !pending) setEditing(false);
          }}
          className="space-y-3"
        >
          <Label htmlFor={id}>{label}</Label>
          {multiline ? (
            <textarea
              id={id}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={pending}
              maxLength={maxLength}
              className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
            />
          ) : (
            <Input
              id={id}
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              required={required}
              maxLength={maxLength}
              disabled={pending}
              className="h-10"
            />
          )}
          {help && <p className="text-xs leading-5 text-muted-foreground">{help}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || (required && !draft.trim())}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="whitespace-pre-wrap break-words text-sm">
              {children || value || (
                <span className="text-muted-foreground">
                  {label === "Description"
                    ? "No description added."
                    : label === "Title"
                      ? "Untitled"
                      : "Not set"}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-2 size-10 shrink-0 text-muted-foreground"
            aria-label={`Edit ${label.toLowerCase()}`}
            title={`Edit ${label.toLowerCase()}`}
            onClick={() => {
              setDraft(value || "");
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SettingRow({
  label,
  value,
  action,
  onClick,
}: {
  label: string;
  value: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 first:pt-0">
      <div className="min-w-0 space-y-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm">{value}</p>
      </div>
      <Button
        variant="ghost"
        className="-mr-2 h-10 shrink-0 px-2 text-xs"
        onClick={onClick}
        aria-label={`${action} ${label.toLowerCase()}`}
      >
        {action}
      </Button>
    </div>
  );
}

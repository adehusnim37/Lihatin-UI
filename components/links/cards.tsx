"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  Check,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Edit,
  BarChart3,
  Power,
  Lock,
  Calendar,
  MousePointerClick,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LinkStatusBadge } from "@/components/ui/app-status-badges";
import { DetailLink } from "@/lib/api/shortlinks";
import DeactivateLink from "./detail/deactivate";
import ActivateLink from "./detail/activate";
import { UpdatePasscodeDialog } from "./detail/update-passcode";
import { UpdateExpirationDialog } from "./detail/update-expiration";
import { useUpdateLink } from "@/lib/hooks/queries/useLinksQuery";
import type { UpdateShortLinkRequest } from "@/lib/api/shortlinks";

export interface ShortLinkData {
  id: string;
  user_id?: string;
  short_code: string;
  original_url: string;
  title: string;
  description: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  click_count?: number;
  detail?: DetailLink;
}

interface ShortLinkCardProps {
  data: ShortLinkData;
  view?: "cards" | "list";
  baseUrl?: string;
  onEdit?: (data: ShortLinkData) => void;
  onDelete?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onToggle?: (code: string) => Promise<void>;
}

export default function ShortLinkCard({
  data,
  baseUrl,
  onDelete,
  onToggle,
  view = "cards",
}: ShortLinkCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);

  const updateMutation = useUpdateLink();

  const resolvedBaseUrl = (
    baseUrl ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  ).replace(/\/+$/, "");

  const shortUrl = `${resolvedBaseUrl}/${data.short_code}${
    data.detail?.passcode ? `/${data.detail?.passcode}` : ""
  }`;

  const hasPasscode = !!data.detail?.passcode;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link", { description: "Select and copy the URL manually." });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const clicks = data.click_count ?? data.detail?.current_clicks ?? 0;
  const isList = view === "list";

  const handleUpdate = async (code: string, updateData: UpdateShortLinkRequest) => {
    return updateMutation.mutateAsync({ code, data: updateData });
  };

  const handleNavigateToDetail = () => {
    router.push(`/main/links/${data.short_code}`);
  };

  const handleNavigateToAnalytics = () => {
    router.push(`/main/analytics/${data.short_code}`);
  };

  return (
    <>
      <article
        className={cn(
          "min-w-0 bg-card text-card-foreground transition-colors",
          isList
            ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-b px-4 py-4 last:border-b-0 hover:bg-muted/30 @3xl:col-span-5 @3xl:grid-cols-subgrid @3xl:gap-x-5"
            : "grid h-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[1fr_auto_auto] items-center gap-x-3 gap-y-4 rounded-xl border p-5 hover:border-muted-foreground/40",
        )}
      >
        <div
          className={cn(
            "min-w-0 space-y-2",
            isList ? "col-span-2 @3xl:col-span-1" : "col-span-2 self-start",
          )}
        >
          <Link
            href={`/main/links/${data.short_code}`}
            className="flex min-w-0 items-center gap-2 rounded-sm text-sm font-semibold hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="truncate" title={data.title || "Untitled"}>
              {data.title || "Untitled"}
            </span>
            {hasPasscode && (
              <>
                <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Passcode protected</span>
              </>
            )}
          </Link>
          <div className="min-w-0 space-y-1">
            <code className="block truncate text-xs text-primary-ink" title={shortUrl}>
              {shortUrl}
            </code>
            <a
              href={data.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title={data.original_url}
            >
              <span className="truncate">{data.original_url}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
          {data.description && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    "max-w-full truncate rounded-sm text-left text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring",
                    "block",
                  )}
                  aria-label={`Read full description for ${data.title || data.short_code}`}
                >
                  {data.description}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{data.title || "Description"}</DialogTitle>
                  <DialogDescription>Full description</DialogDescription>
                </DialogHeader>
                <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {data.description}
                </p>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <LinkStatusBadge
          className="h-6 text-xs"
          isActive={data.is_active}
          expiresAt={data.expires_at}
          isBanned={data.detail?.is_banned}
        />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground tabular-nums",
            isList ? "justify-self-end @3xl:justify-self-start" : "justify-self-end",
          )}
        >
          <MousePointerClick className="size-3.5" aria-hidden="true" />
          {clicks.toLocaleString("en-US")} {clicks === 1 ? "click" : "clicks"}
        </span>
        <span
          className="whitespace-nowrap text-xs text-muted-foreground tabular-nums"
          title={`Created on ${formatDate(data.created_at)}`}
        >
          <span className={isList ? "@3xl:sr-only" : ""}>Created </span>
          {formatDate(data.created_at)}
        </span>
        <div className={cn("flex items-center gap-1", "justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-muted-foreground hover:text-foreground"
            onClick={copyToClipboard}
            title="Copy link"
            aria-label={`Copy ${data.short_code} link`}
          >
            {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-muted-foreground hover:text-foreground"
            onClick={handleNavigateToAnalytics}
            title="View analytics"
            aria-label={`View analytics for ${data.short_code}`}
          >
            <BarChart3 className="size-4" />
          </Button>
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-8"
                  aria-label={`Open menu for ${data.title || data.short_code}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleNavigateToAnalytics}>
                  <BarChart3 className="mr-2 size-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNavigateToDetail}>
                  <Edit className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>

                {/* New Menu Items */}
                <DropdownMenuItem onClick={() => setShowPasscodeDialog(true)}>
                  <Lock className="mr-2 size-4" />
                  {hasPasscode ? "Change Passcode" : "Set Passcode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowExpirationDialog(true)}>
                  <Calendar className="mr-2 size-4" />
                  {data.expires_at ? "Change Expiration" : "Set Expiration"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (data.is_active) {
                      setShowDeactivateDialog(true);
                    } else {
                      setShowActivateDialog(true);
                    }
                  }}
                >
                  <Power className="mr-2 size-4" />
                  {data.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(data.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Dialogs */}
        {onToggle && (
          <>
            <DeactivateLink
              shortCode={data.short_code}
              onDeactivate={onToggle}
              open={showDeactivateDialog}
              onOpenChange={setShowDeactivateDialog}
            />
            <ActivateLink
              shortCode={data.short_code}
              onActivate={onToggle}
              open={showActivateDialog}
              onOpenChange={setShowActivateDialog}
            />
          </>
        )}
        <UpdatePasscodeDialog
          shortCode={data.short_code}
          currentPasscode={data.detail?.passcode?.toString()}
          open={showPasscodeDialog}
          onOpenChange={setShowPasscodeDialog}
          onUpdate={handleUpdate}
        />
        <UpdateExpirationDialog
          shortCode={data.short_code}
          currentExpiration={data.expires_at}
          open={showExpirationDialog}
          onOpenChange={setShowExpirationDialog}
          onUpdate={handleUpdate}
        />
      </article>
    </>
  );
}

export function ShortLinkCardGrid({
  links,
  onEdit,
  onDelete,
  onAnalytics,
  onToggle,
}: {
  links: ShortLinkData[];
  onEdit?: (data: ShortLinkData) => void;
  onDelete?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onToggle?: (code: string) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {links.map((link) => (
        <ShortLinkCard
          key={link.id}
          data={link}
          onEdit={onEdit}
          onDelete={onDelete}
          onAnalytics={onAnalytics}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

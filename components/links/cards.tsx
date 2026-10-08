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
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  baseUrl?: string;
  onEdit?: (data: ShortLinkData) => void;
  onDelete?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onToggle?: (code: string) => Promise<void>;
}

export default function ShortLinkCard({ data, baseUrl, onDelete, onToggle }: ShortLinkCardProps) {
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

  const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;

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
      <Card className="flex flex-col size-full overflow-hidden hover:shadow-lg transition-all duration-300 min-h-[210px] relative group border-transparent ring-1 ring-border hover:ring-primary/20">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Decorative Stronger Blobs */}
        <div className="absolute -top-20 -right-20 size-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-500" />
        <div className="absolute -bottom-20 -left-20 size-40 bg-gradient-to-tr from-blue-500/20 to-teal-500/20 rounded-full blur-3xl pointer-events-none group-hover:from-blue-500/30 group-hover:to-teal-500/30 transition-all duration-500" />

        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 relative z-10">
          <Item className="w-full p-0 gap-2.5">
            <ItemContent className="gap-0 min-w-0">
              <ItemTitle className="w-full min-w-0">
                <Link
                  href={`/main/links/${data.short_code}`}
                  className="flex min-h-11 w-full min-w-0 items-center gap-1.5 rounded-sm font-semibold transition-colors hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-0"
                >
                  <span className="min-w-0 flex-1 truncate">{data.title || "Untitled"}</span>
                  {/* Icons in Title */}
                  {hasPasscode && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="size-3.5 text-muted-foreground shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Passcode Protected</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {hasPasscode && <span className="sr-only">Passcode protected</span>}
                  {isExpired && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Clock className="size-3.5 text-destructive shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Link Expired</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </Link>
              </ItemTitle>
              <ItemDescription className="text-xs truncate">{data.short_code}</ItemDescription>
              <LinkStatusBadge
                className="mt-1.5 w-fit"
                isActive={data.is_active}
                expiresAt={data.expires_at}
                isBanned={data.detail?.is_banned}
              />
            </ItemContent>
            <ItemActions className="-me-2">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(data.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </Item>
        </CardHeader>

        <CardContent className="p-0 flex flex-col flex-1 relative z-10">
          {/* Short URL Box (Restored Grey Box) */}
          <div className="bg-muted/50 border-y px-4 py-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all text-xs font-mono">{shortUrl}</code>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 md:size-8 shrink-0"
              aria-label={copied ? `Copy ${data.short_code} again` : `Copy ${data.short_code} link`}
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="size-3.5 text-green-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>

          {/* Content */}
          <div className="py-3 px-4 space-y-2 flex flex-col flex-1">
            {/* Description */}
            {data.description && data.description.length > 60 ? (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Read full description for ${data.title || data.short_code}`}
                    className="min-h-11 w-full rounded-sm text-left text-sm font-medium leading-relaxed text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="line-clamp-2">{data.description}</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{data.title || "Description"}</DialogTitle>
                    <DialogDescription>Full description</DialogDescription>
                  </DialogHeader>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {data.description}
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                {data.description ? (
                  data.description
                ) : (
                  <span className="italic">No description</span>
                )}
              </p>
            )}

            {/* Original URL */}
            <a
              href={data.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex w-full min-w-0 items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{data.original_url}</span>
            </a>

            {/* Metadata Row Pinned to Bottom */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 mt-auto">
              <div className="flex items-center gap-1.5" title="Total Clicks">
                <MousePointerClick className="size-3.5" />
                <span>{data.click_count ?? data.detail?.current_clicks ?? 0} clicks</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                title={`Created on ${formatDate(data.created_at)}`}
              >
                <Calendar className="size-3.5" />
                <span>{formatDate(data.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>

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
      </Card>
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

"use client";

import { IconExternalLink, IconEye, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";

import { LinkStatusBadge } from "@/components/ui/app-status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ShortLink {
  id: string;
  short_code: string;
  original_url: string;
  title: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
  click_count?: number;
  detail?: {
    current_clicks?: number;
    is_banned?: boolean;
  };
}

interface RecentLinksTableProps {
  links?: ShortLink[];
  isLoading?: boolean;
}

/** Longest text rendered inside a row before it is clipped with an ellipsis. */
const MAX_DISPLAY_CHARS = 100;

function truncateText(value: string, max = MAX_DISPLAY_CHARS) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function RecentLinksTable({ links = [], isLoading = false }: RecentLinksTableProps) {
  const copyToClipboard = (code: string) => {
    const shortUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <Card className="min-w-0">
        <CardHeader className="gap-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-1">
        <CardTitle className="text-base sm:text-lg">Recent Links</CardTitle>
        <CardDescription>Your most recently created short links</CardDescription>
      </CardHeader>
      <CardContent className="@container pt-0">
        {links.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No links created yet
          </div>
        ) : (
          <div className="@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_max-content_max-content_max-content] @3xl:gap-x-4">
            {links.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b py-3 transition-colors hover:bg-muted/30 focus-within:bg-muted/30 first:pt-0 last:border-b-0 last:pb-0 @3xl:col-span-4 @3xl:grid-cols-subgrid @3xl:gap-x-4 @3xl:gap-y-0"
              >
                <div className="col-span-2 min-w-0 space-y-1 @3xl:col-span-1">
                  <code
                    className="block truncate text-sm font-semibold tracking-tight"
                    title={link.short_code}
                  >
                    {link.short_code}
                  </code>
                  <p
                    className="truncate text-sm font-medium text-foreground"
                    title={link.title || "Untitled"}
                  >
                    {truncateText(link.title || "Untitled")}
                  </p>
                  <a
                    href={link.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit min-w-0 max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-primary-ink"
                    title={link.original_url}
                  >
                    <span className="truncate">{truncateText(link.original_url)}</span>
                    <IconExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-2 @3xl:col-span-1 @3xl:grid @3xl:grid-cols-[5rem_max-content]">
                  <LinkStatusBadge
                    isActive={link.is_active}
                    expiresAt={link.expires_at}
                    isBanned={link.detail?.is_banned}
                    className="h-6 text-xs leading-4"
                  />
                  <span className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {link.click_count ?? link.detail?.current_clicks ?? 0}{" "}
                    {(link.click_count ?? link.detail?.current_clicks ?? 0) === 1
                      ? "click"
                      : "clicks"}
                  </span>
                </div>
                <span className="col-start-1 whitespace-nowrap text-xs text-muted-foreground tabular-nums @3xl:col-start-auto @3xl:text-right">
                  <span className="@3xl:sr-only">Created </span>
                  {formatCreatedAt(link.created_at)}
                </span>
                <div className="col-start-2 row-start-3 flex items-center justify-end gap-1 @3xl:col-start-auto @3xl:row-auto @3xl:row-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 text-muted-foreground hover:text-foreground @3xl:size-9"
                    onClick={() => copyToClipboard(link.short_code)}
                    title="Copy link"
                    aria-label={`Copy ${link.short_code} link`}
                  >
                    <IconCopy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 text-muted-foreground hover:text-foreground @3xl:size-9"
                    onClick={() => window.open(`/main/links/${link.short_code}`, "_blank")}
                    title="View stats"
                    aria-label={`View ${link.short_code} stats`}
                  >
                    <IconEye className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { IconExternalLink, IconEye, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
      <CardContent className="pt-0">
        {links.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            No links created yet
          </div>
        ) : (
          <div className="divide-y">
            {links.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="group -mx-3 flex min-w-0 flex-col gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-muted/50 focus-within:bg-muted/50 first:pt-2 last:pb-2 sm:gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                      <code className="min-w-0 max-w-full break-all text-sm leading-5 font-semibold tracking-tight">
                        {link.short_code}
                      </code>
                      <LinkStatusBadge
                        isActive={link.is_active}
                        expiresAt={link.expires_at}
                        isBanned={link.detail?.is_banned}
                        className="text-xs"
                      />
                      <Badge variant="secondary" className="text-xs">
                        {link.click_count ?? link.detail?.current_clicks ?? 0} clicks
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-foreground sm:line-clamp-1">
                      {link.title || "Untitled"}
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <a
                        href={link.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 max-w-full items-center gap-1 hover:text-primary-ink"
                        title={link.original_url}
                      >
                        <span className="block min-w-0 max-w-[30rem] truncate">{link.original_url}</span>
                        <IconExternalLink className="size-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 items-center justify-between border-t pt-3 sm:w-auto sm:flex-col sm:items-center sm:justify-start sm:gap-1 sm:self-start sm:border-t-0 sm:pt-0">
                    <span className="order-2 whitespace-nowrap text-xs leading-none text-muted-foreground sm:order-1 sm:mt-4 sm:text-[12px]">
                      {formatCreatedAt(link.created_at)}
                    </span>
                    <div className="order-1 flex items-center gap-1 sm:order-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 sm:size-8"
                        onClick={() => copyToClipboard(link.short_code)}
                        title="Copy link"
                        aria-label={`Copy ${link.short_code} link`}
                      >
                        <IconCopy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 sm:size-8"
                        onClick={() => window.open(`/main/links/${link.short_code}`, "_blank")}
                        title="View stats"
                        aria-label={`View ${link.short_code} stats`}
                      >
                        <IconEye className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

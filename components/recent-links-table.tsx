"use client"

import { IconExternalLink, IconEye, IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { ActiveInactiveBadge } from "@/components/ui/app-status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ShortLink {
  id: string;
  short_code: string;
  original_url: string;
  title: string;
  is_active: boolean;
  created_at: string;
  click_count?: number;
  detail?: {
    current_clicks?: number;
  };
}

interface RecentLinksTableProps {
  links?: ShortLink[];
  isLoading?: boolean;
}

export function RecentLinksTable({ links = [], isLoading = false }: RecentLinksTableProps) {
  const copyToClipboard = (code: string) => {
    const shortUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Links</CardTitle>
        <CardDescription>Your most recently created short links</CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No links created yet
          </div>
        ) : (
          <div className="space-y-3">
            {links.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                      <code className="min-w-0 max-w-full break-all text-sm leading-5 font-semibold">
                        {link.short_code}
                      </code>
                      <ActiveInactiveBadge isActive={link.is_active} className="text-xs" />
                      <Badge variant="secondary" className="text-xs">
                        {link.click_count ?? link.detail?.current_clicks ?? 0} clicks
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-foreground sm:line-clamp-1">
                      {link.title || "Untitled"}
                    </p>
                    <a
                      href={link.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      title={link.original_url}
                    >
                      <span className="block min-w-0 flex-1 truncate">
                        {link.original_url}
                      </span>
                      <IconExternalLink className="size-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-1 self-end sm:self-start">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

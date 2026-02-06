"use client"

import { IconExternalLink, IconEye, IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface ShortLink {
  id: string;
  short_code: string;
  original_url: string;
  title: string;
  is_active: boolean;
  created_at: string;
  click_count?: number;
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

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
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
                className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-semibold">{link.short_code}</code>
                      <Badge variant={link.is_active ? "default" : "secondary"} className="text-xs">
                        {link.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {link.click_count ?? 0} clicks
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {link.title || "Untitled"}
                    </p>
                    <a
                      href={link.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary line-clamp-1"
                      title={link.original_url}
                    >
                      {truncateUrl(link.original_url, 50)}
                      <IconExternalLink className="size-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(link.short_code)}
                      title="Copy link"
                    >
                      <IconCopy className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/links/${link.short_code}`, "_blank")}
                      title="View stats"
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

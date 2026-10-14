"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ShortLink } from "@/lib/api/shortlinks";
import { linksKeys } from "@/lib/hooks/queries/useLinksQuery";
import { logsKeys } from "@/lib/hooks/queries/useLogsQuery";
import { OverviewStats } from "./overview-stats";
import { ViewsTable } from "./views-table";
import { ActivityLogTable } from "./activity-log-table";
import { LinkStatusBadge } from "@/components/ui/app-status-badges";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AnalyticsDetail({ link }: { link: ShortLink }) {
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const baseUrl = (
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");
  const shortUrl = `${baseUrl}/${link.short_code}${link.detail?.passcode ? `/${link.detail.passcode}` : ""}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link. Select the URL and copy it manually.");
    }
  };
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: linksKeys.detail(link.short_code) }),
        queryClient.invalidateQueries({ queryKey: linksKeys.stats(link.short_code) }),
        queryClient.invalidateQueries({ queryKey: [...linksKeys.all, "views", link.short_code] }),
        queryClient.invalidateQueries({
          queryKey: [...logsKeys.all, "short-link", link.short_code],
        }),
      ]);
    } finally {
      setRefreshing(false);
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
      <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Link analytics</h1>
            <LinkStatusBadge
              isActive={link.is_active}
              expiresAt={link.expires_at}
              isBanned={link.detail?.is_banned}
              className="h-6"
            />
          </div>
          <p className="break-words text-sm font-medium" title={link.title}>
            {link.title || link.short_code}
          </p>
          <a
            href={link.original_url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.original_url}
            className="flex max-w-xl items-center gap-1 text-xs text-muted-foreground hover:text-primary-ink"
          >
            <span className="min-w-0 truncate">{link.original_url}</span>
            <ArrowUpRight className="size-3 shrink-0" />
          </a>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-muted-foreground"
            disabled={refreshing}
            onClick={() => {
              void refresh();
            }}
            aria-label="Refresh analytics"
            title="Refresh analytics"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
            />
          </Button>
          <Button variant="outline" className="h-10" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button asChild variant="outline" className="h-10">
            <Link href={`/main/links/${link.short_code}`}>
              Edit link
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>
      <div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
        <span className="shrink-0 text-xs text-muted-foreground">Short link</span>
        <code className="min-w-0 truncate text-xs text-primary-ink" title={shortUrl}>
          {shortUrl}
        </code>
      </div>
      {link.detail?.enable_stats === false && (
        <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          Traffic tracking is disabled for this link. Previously collected data may still appear
          here.
        </p>
      )}
      <Tabs defaultValue="overview" className="min-w-0 gap-5">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:w-fit">
          <TabsTrigger value="overview" className="min-h-10 px-3 text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="views" className="min-h-10 px-3 text-xs sm:text-sm">
            Traffic logs
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-h-10 px-3 text-xs sm:text-sm">
            Activity log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewStats link={link} />
        </TabsContent>
        <TabsContent value="views" className="min-w-0 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Traffic history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Visitor locations, devices, and referral sources.
            </p>
          </div>
          <ViewsTable code={link.short_code} />
        </TabsContent>
        <TabsContent value="activity" className="min-w-0 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Activity log</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Requests and responses recorded for this link.
            </p>
          </div>
          <ActivityLogTable code={link.short_code} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

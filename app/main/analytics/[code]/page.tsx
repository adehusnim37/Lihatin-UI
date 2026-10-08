"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, BarChart2, Copy, Check, Link as LinkIcon, Users } from "lucide-react";
import { useLink } from "@/lib/hooks/queries/useLinksQuery";
import { OverviewStats } from "@/components/links/detail/overview-stats";
import { ActivityLogTable } from "@/components/links/detail/activity-log-table";
import { ViewsTable } from "@/components/links/detail/views-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { LinkStatusBadge } from "@/components/ui/app-status-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function AnalyticsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { data: link, isLoading, error } = useLink(code);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!link) return;
    const shortUrl = `${window.location.origin}/${link.short_code}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      toast.error("Could not copy the link. Select the URL and copy it manually.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !link) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-10">
            <h2 className="text-xl font-bold text-destructive">Error Loading Analytics</h2>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const shortUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/${link.short_code}`;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                    Analytics: {link.title || link.short_code}
                  </h1>
                  <LinkStatusBadge
                    isActive={link.is_active}
                    expiresAt={link.expires_at}
                    isBanned={link.detail?.is_banned}
                  />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <LinkIcon className="size-3 shrink-0" />
                  <a
                    href={link.original_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline line-clamp-1 max-w-md"
                  >
                    {link.original_url}
                  </a>
                </div>
              </div>
              <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                  <span className="min-w-0 flex-1 break-all">{shortUrl}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 md:size-8 ml-1 hover:bg-background/80"
                    aria-label={`Copy ${link.short_code} link`}
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="size-3 text-green-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/main/links/${code}`)}
                >
                  Edit Link
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
              <TabsTrigger
                className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
                value="overview"
              >
                <BarChart2 className="hidden size-4 sm:block" /> Overview
              </TabsTrigger>
              <TabsTrigger
                className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
                value="views"
              >
                <Users className="hidden size-4 sm:block" /> Traffic Logs
              </TabsTrigger>
              <TabsTrigger
                className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
                value="activity"
              >
                <Activity className="hidden size-4 sm:block" /> Activity Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OverviewStats link={link} />
            </TabsContent>

            <TabsContent value="views" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ViewsTable code={code} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLogTable code={code} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AnalyticsSkeleton() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

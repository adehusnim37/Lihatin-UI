"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  BarChart2,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Link as LinkIcon,
  Users,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
    const shortUrl = `${window.location.host}/${link.short_code}`;
    await navigator.clipboard.writeText(shortUrl);
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
            <h2 className="text-xl font-bold text-destructive">
              Error Loading Analytics
            </h2>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const shortUrl = `${
    typeof window !== "undefined" ? window.location.host : ""
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
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-col gap-4">

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Analytics: {link.title || link.short_code}
                  </h1>
                  <Badge variant={link.is_active ? "default" : "secondary"}>
                    {link.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <LinkIcon className="h-3 w-3 shrink-0" />
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
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                  <span className="truncate max-w-[200px]">{shortUrl}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 hover:bg-background/80"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
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
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart2 className="mr-2 h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="views">
                <Users className="mr-2 h-4 w-4" /> Traffic Logs
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="mr-2 h-4 w-4" /> Activity Log
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

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLink } from "@/lib/hooks/queries/useLinksQuery";
import { AnalyticsDetail } from "@/components/links/detail/analytics-detail";
import { OverviewSkeleton } from "@/components/links/detail/overview-stats";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function AnalyticsDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { data: link, isLoading, error, refetch, isFetching } = useLink(code);
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
        {isLoading ? (
          <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
            <OverviewSkeleton />
          </div>
        ) : error || !link ? (
          <div
            role="alert"
            className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <h1 className="text-xl font-semibold">Analytics couldn’t be loaded</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try again, or return to your links to choose another link.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/main/links">Back to links</Link>
              </Button>
              <Button
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        ) : (
          <AnalyticsDetail link={link} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

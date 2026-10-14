"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLink } from "@/lib/hooks/queries/useLinksQuery";
import { LinkDetail } from "@/components/links/detail/link-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function LinkDetailPage() {
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
          <div
            role="status"
            aria-label="Loading link details"
            className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Skeleton className="h-96 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
          </div>
        ) : error || !link ? (
          <div
            role="alert"
            className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <h1 className="text-xl font-semibold">Link couldn’t be loaded</h1>
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
          <LinkDetail key={link.short_code} link={link} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

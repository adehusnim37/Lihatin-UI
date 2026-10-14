"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { LinksCollection } from "@/components/links/collection";
import { useLinks, useToggleLinkStatus } from "@/lib/hooks/queries/useLinksQuery";
import { useLinksUIStore } from "@/lib/stores/useLinksUIStore";

export default function LinksPage() {
  const { sortBy, orderBy, page, limit } = useLinksUIStore();
  const { data, isLoading, error, refetch, isFetching } = useLinks(page, limit, sortBy, orderBy);
  const toggleMutation = useToggleLinkStatus();

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
        <LinksCollection
          links={data?.short_links ?? []}
          totalCount={data?.total_count ?? 0}
          totalPages={data?.total_pages ?? 0}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRefresh={() => {
            void refetch();
          }}
          onToggle={async (code) => {
            await toggleMutation.mutateAsync(code);
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { AnalyticsCards } from "@/components/analytics-cards";
import { RecentLinksTable } from "@/components/recent-links-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { useDashboardStats, useLinks } from "@/lib/hooks/queries/useLinksQuery";
import { useLogCounts } from "@/lib/hooks/queries/useLogsQuery";
import { useRecentActivityQuery } from "@/lib/hooks/queries/useLoginAttemptsQuery";

/**
 * Main Dashboard Page
 * 🔐 Protected by Next.js middleware (middleware.ts)
 * 🔐 AuthContext checks authentication status
 * 
 * Layout Options:
 * - OPTION_2: Full-width analytics cards (no table)
 * - OPTION_3: Hybrid layout (table + analytics cards side by side)
 * 
 * Toggle between options by changing LAYOUT constant below
 */

// Toggle layout: "OPTION_2" or "OPTION_3"
const LAYOUT = "OPTION_3" as "OPTION_2" | "OPTION_3";

export default function Page() {
  // Fetch dashboard data in parallel
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: logCounts, isLoading: logsLoading } = useLogCounts();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivityQuery(false);
  const { data: linksData, isLoading: linksLoading } = useLinks(1, 5, "created_at", "desc");

  // Calculate total logs from method breakdown
  const totalLogs = (logCounts?.data.DELETE ?? 0) + (logCounts?.data.GET ?? 0) + (logCounts?.data.POST ?? 0) + (logCounts?.data.PUT ?? 0) + (logCounts?.data.PATCH ?? 0);
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Stats Cards - Always Visible */}
              <SectionCards 
                totalLinks={dashboardStats?.total_links ?? 0}
                activeLinks={dashboardStats?.active_links ?? 0}
                totalClicks={dashboardStats?.total_clicks ?? 0}
                clicksLast24h={dashboardStats?.clicks_last_24h ?? 0}
                clicksLast7d={dashboardStats?.clicks_last_7d ?? 0}
                uniqueVisitors={dashboardStats?.total_unique_visitors ?? 0}
                totalLogs={totalLogs}
                recentActivityCount={recentActivity?.total_attempts ?? 0}
                isLoading={statsLoading || logsLoading || activityLoading}
              />

              {/* Chart - Always Visible */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  data={dashboardStats?.click_history ?? []}
                  isLoading={statsLoading}
                  title="Click History"
                  description="Total clicks over time"
                />
              </div>

              {/* OPTION 2: Analytics Cards Only */}
              {LAYOUT === "OPTION_2" && (
                <AnalyticsCards
                  topCountries={dashboardStats?.top_countries ?? []}
                  topDevices={dashboardStats?.top_devices ?? []}
                  topReferrers={dashboardStats?.top_referrers ?? []}
                  isLoading={statsLoading}
                />
              )}

              {/* OPTION 3: Hybrid Layout (Table + Analytics) */}
              {LAYOUT === "OPTION_3" && (
                <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2">
                  {/* Recent Links Table */}
                  <RecentLinksTable
                    links={linksData?.short_links ?? []}
                    isLoading={linksLoading}
                  />

                  {/* Analytics Mini Cards - Stacked Vertically */}
                  <AnalyticsCards
                    topCountries={dashboardStats?.top_countries ?? []}
                    topDevices={dashboardStats?.top_devices ?? []}
                    topReferrers={dashboardStats?.top_referrers ?? []}
                    isLoading={statsLoading}
                    variant="stack"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

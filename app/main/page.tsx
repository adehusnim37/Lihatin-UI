"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { AnalyticsCards } from "@/components/analytics-cards";
import { RecentLinksTable } from "@/components/recent-links-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProfile } from "@/lib/api/auth";
import { IconShieldCheck, IconSparkles, IconLock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
const TOTP_PROMPT_PENDING_KEY = "totp_migration_prompt_pending";
const TOTP_PROMPT_DISMISS_KEY = "totp_migration_dismissed_until";
const TOTP_PROMPT_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export default function Page() {
  const router = useRouter();
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  // Fetch dashboard data in parallel
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: logCounts, isLoading: logsLoading } = useLogCounts();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivityQuery(false);
  const { data: linksData, isLoading: linksLoading } = useLinks(1, 5, "created_at", "desc");

  // Calculate total logs from method breakdown
  const methodCounts = logCounts?.data ?? {
    DELETE: 0,
    GET: 0,
    POST: 0,
    PUT: 0,
    PATCH: 0,
  };
  const totalLogs =
    (methodCounts.DELETE ?? 0) +
    (methodCounts.GET ?? 0) +
    (methodCounts.POST ?? 0) +
    (methodCounts.PUT ?? 0) +
    (methodCounts.PATCH ?? 0);

  useEffect(() => {
    const pending = sessionStorage.getItem(TOTP_PROMPT_PENDING_KEY);
    if (pending !== "1") {
      return;
    }

    const dismissedUntil = Number(
      localStorage.getItem(TOTP_PROMPT_DISMISS_KEY) || "0"
    );
    if (dismissedUntil > Date.now()) {
      sessionStorage.removeItem(TOTP_PROMPT_PENDING_KEY);
      return;
    }

    let active = true;
    void getProfile()
      .then((response) => {
        if (!active || !response.success || !response.data) return;

        if (response.data.auth.is_totp_enabled) {
          sessionStorage.removeItem(TOTP_PROMPT_PENDING_KEY);
          return;
        }

        setShowMigrateDialog(true);
      })
      .catch(() => {
        // Silent fallback. No modal when profile check fails.
      });

    return () => {
      active = false;
    };
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem(
      TOTP_PROMPT_DISMISS_KEY,
      String(Date.now() + TOTP_PROMPT_DISMISS_MS)
    );
    sessionStorage.removeItem(TOTP_PROMPT_PENDING_KEY);
    setShowMigrateDialog(false);
  };

  const goToEnableTOTP = () => {
    sessionStorage.removeItem(TOTP_PROMPT_PENDING_KEY);
    setShowMigrateDialog(false);
    router.push("/profile/me?tab=security&openSetupTOTP=1");
  };

  return (
    <>
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

      <Dialog
        open={showMigrateDialog}
        onOpenChange={(open) => {
          if (!open) {
            dismissPrompt();
            return;
          }
          setShowMigrateDialog(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <IconSparkles className="h-3.5 w-3.5" />
              Security Upgrade
            </div>
            <DialogTitle className="text-xl leading-tight">
              Aktifin Autentikasi Biar Akun Lebih Aman
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6">
              Kamu baru login pakai OTP email. Upgrade ke TOTP bikin akun lebih tahan
              phishing dan kode tidak bergantung inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-start gap-2">
              <IconShieldCheck className="mt-0.5 h-4 w-4 text-green-600" />
              <p>Kode dari app authenticator, bukan dari email.</p>
            </div>
            <div className="flex items-start gap-2">
              <IconLock className="mt-0.5 h-4 w-4 text-green-600" />
              <p>Lebih sulit dibajak walau email kena compromise.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={dismissPrompt}>
              Nanti aja
            </Button>
            <Button onClick={goToEnableTOTP}>Iya, aktifin sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

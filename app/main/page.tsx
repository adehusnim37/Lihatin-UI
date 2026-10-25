"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { AnalyticsCards } from "@/components/analytics-cards";
import { RecentLinksTable } from "@/components/recent-links-table";
import { QueryError } from "@/components/query-error";
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
import { IconShieldCheck, IconSparkles, IconLock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

import { useDashboardStats, useLinks } from "@/lib/hooks/queries/useLinksQuery";
import { useLogCounts } from "@/lib/hooks/queries/useLogsQuery";
import { useRecentActivityQuery } from "@/lib/hooks/queries/useLoginAttemptsQuery";
import { InAppAnnouncementDialog } from "@/components/notifications/in-app-announcement-dialog";

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
const TOTP_PROMPT_DISMISS_MS = 3 * 24 * 60 * 60 * 1000;

export default function Page() {
  const router = useRouter();
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const { auth } = useAuth();
  // Fetch dashboard data in parallel
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: retryStats,
  } = useDashboardStats();
  const {
    data: logCounts,
    isLoading: logsLoading,
    isError: logsError,
    refetch: retryLogs,
  } = useLogCounts();
  const {
    data: recentActivity,
    isLoading: activityLoading,
    isError: activityError,
    refetch: retryActivity,
  } = useRecentActivityQuery(false);
  const {
    data: linksData,
    isLoading: linksLoading,
    isError: linksError,
    refetch: retryLinks,
  } = useLinks(1, 5, "created_at", "desc");

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

    const dismissedUntil = Number(localStorage.getItem(TOTP_PROMPT_DISMISS_KEY) || "0");
    if (dismissedUntil > Date.now()) {
      sessionStorage.removeItem(TOTP_PROMPT_PENDING_KEY);
      return;
    }

    if (auth?.totp_enabled) {
      sessionStorage.removeItem(TOTP_PROMPT_PENDING_KEY);
      return;
    }

    // Use a microtask to avoid synchronous setState in effect
    const timer = setTimeout(() => setShowMigrateDialog(true), 0);
    return () => clearTimeout(timer);
  }, [auth]);

  const dismissPrompt = () => {
    localStorage.setItem(TOTP_PROMPT_DISMISS_KEY, String(Date.now() + TOTP_PROMPT_DISMISS_MS));
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
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div className="flex flex-1 flex-col bg-muted/30">
            <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-2">
              <div className="flex flex-col gap-5 py-5 md:gap-7 md:py-7">
                <div className="space-y-1 px-4 lg:px-6">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Your links, traffic, and recent activity at a glance.
                  </p>
                </div>
                {/* Stats Cards - Always Visible */}
                {statsError || logsError || activityError ? (
                  <div className="px-4 lg:px-6">
                    <QueryError
                      message="Some dashboard statistics could not be loaded."
                      onRetry={() => {
                        void retryStats();
                        void retryLogs();
                        void retryActivity();
                      }}
                    />
                  </div>
                ) : (
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
                )}

                {/* Chart - Always Visible */}
                <div className="px-4 lg:px-6">
                  {statsError ? (
                    <QueryError
                      message="Click history could not be loaded."
                      onRetry={() => {
                        void retryStats();
                      }}
                    />
                  ) : (
                    <ChartAreaInteractive
                      data={dashboardStats?.click_history ?? []}
                      isLoading={statsLoading}
                      title="Click History"
                      description="Total clicks over time"
                    />
                  )}
                </div>

                {/* OPTION 2: Analytics Cards Only */}
                {!statsError && LAYOUT === "OPTION_2" && (
                  <AnalyticsCards
                    topCountries={dashboardStats?.top_countries ?? []}
                    topDevices={dashboardStats?.top_devices ?? []}
                    topReferrers={dashboardStats?.top_referrers ?? []}
                    isLoading={statsLoading}
                  />
                )}

                {/* OPTION 3: Hybrid Layout (Table + Analytics) */}
                {LAYOUT === "OPTION_3" && (
                  <div className="flex flex-col gap-5">
                    <div className="px-4 lg:px-6">
                      {linksError ? (
                        <QueryError
                          message="Recent links could not be loaded."
                          onRetry={() => {
                            void retryLinks();
                          }}
                        />
                      ) : (
                        <RecentLinksTable
                          links={linksData?.short_links ?? []}
                          isLoading={linksLoading}
                        />
                      )}
                    </div>

                    {/* Analytics Mini Cards */}
                    {!statsError && (
                      <AnalyticsCards
                        topCountries={dashboardStats?.top_countries ?? []}
                        topDevices={dashboardStats?.top_devices ?? []}
                        topReferrers={dashboardStats?.top_referrers ?? []}
                        isLoading={statsLoading}
                        variant="grid"
                      />
                    )}
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
              <IconSparkles className="size-3.5" />
              Security Upgrade
            </div>
            <DialogTitle className="text-xl leading-tight">
              Aktifin Autentikasi Biar Akun Lebih Aman
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-6">
              Kamu baru login pakai OTP email. Upgrade ke TOTP bikin akun lebih tahan phishing dan
              kode tidak bergantung inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-start gap-2">
              <IconShieldCheck className="mt-0.5 size-4 text-green-600" />
              <p>Kode dari app authenticator, bukan dari email.</p>
            </div>
            <div className="flex items-start gap-2">
              <IconLock className="mt-0.5 size-4 text-green-600" />
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
      <InAppAnnouncementDialog blocked={showMigrateDialog} />
    </>
  );
}

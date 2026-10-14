"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { format, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";
import { ArrowRight, ArrowUpRight, CalendarIcon, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDashboardStats } from "@/lib/hooks/queries/useDashboardQuery";
import { useLinks } from "@/lib/hooks/queries/useLinksQuery";
import { analyticsRange, dashboardHistory } from "@/lib/analytics/dashboard-history";
import { DashboardBreakdown, DashboardClickChart, DashboardMetrics } from "./dashboard-widgets";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LinkStatusBadge } from "@/components/ui/app-status-badges";

const subscribeToClient = () => () => {};

export function AnalyticsDashboard() {
  const ready = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  // Date presets follow the visitor's local calendar, which may differ from the server's.
  if (!ready)
    return (
      <section className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <AnalyticsDashboardSkeleton />
      </section>
    );
  return <AnalyticsDashboardContent />;
}

function AnalyticsDashboardContent() {
  const [range, setRange] = useState(() => analyticsRange(30));
  const [preset, setPreset] = useState("30");
  const [draft, setDraft] = useState<DateRange | undefined>(range);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isMobile = useIsMobile();
  const start = format(range.from, "yyyy-MM-dd");
  const end = format(range.to, "yyyy-MM-dd");
  const period = `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
  const stats = useDashboardStats(start, end);
  const links = useLinks(1, 5);
  const history = useMemo(
    () => dashboardHistory(stats.data?.click_history, range.from, range.to),
    [stats.data?.click_history, range],
  );
  const waiting = stats.isLoading || stats.isPlaceholderData;
  const recent = links.data?.short_links ?? [];
  const refresh = () => {
    void stats.refetch();
    void links.refetch();
  };
  const copy = async (code: string, passcode?: number | null) => {
    const base = (process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin).replace(
      /\/+$/,
      "",
    );
    try {
      await navigator.clipboard.writeText(`${base}/${code}${passcode ? `/${passcode}` : ""}`);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link. Open link details to copy it manually.");
    }
  };

  return (
    <section className="@container mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Understand how your links perform and where visitors come from.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-muted-foreground"
          aria-label="Refresh analytics"
          title="Refresh analytics"
          disabled={stats.isFetching || links.isFetching}
          onClick={refresh}
        >
          <RefreshCw
            className={`size-4 ${stats.isFetching || links.isFetching ? "animate-spin motion-reduce:animate-none" : ""}`}
          />
        </Button>
      </header>

      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Select
            value={preset}
            onValueChange={(value) => {
              if (value === "custom") {
                setDraft(range);
                setCalendarOpen(true);
              } else {
                setPreset(value);
                setRange(analyticsRange(Number(value)));
              }
            }}
          >
            <SelectTrigger className="h-10 w-40" aria-label="Analytics period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Popover
            open={calendarOpen}
            onOpenChange={(open) => {
              if (open) setDraft(range);
              setCalendarOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 max-w-full justify-start text-xs font-normal sm:text-sm"
                aria-label="Choose custom analytics dates"
              >
                <CalendarIcon className="size-4 shrink-0" />
                <span className="truncate">{period}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={isMobile ? range.to : subMonths(range.to, 1)}
                selected={draft}
                onSelect={setDraft}
                numberOfMonths={isMobile ? 1 : 2}
                disabled={{ after: new Date() }}
                endMonth={new Date()}
              />
              <div className="flex flex-wrap items-center justify-end gap-2 border-t p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10"
                  onClick={() => setCalendarOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-10"
                  disabled={!draft?.from || !draft?.to}
                  onClick={() => {
                    if (draft?.from && draft.to) {
                      setRange({ from: draft.from, to: draft.to });
                      setPreset("custom");
                      setCalendarOpen(false);
                    }
                  }}
                >
                  Apply range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {stats.isFetching ? "Updating analytics…" : "Traffic data follows the selected period"}
        </p>
      </div>

      <div aria-busy={stats.isFetching} className="min-w-0">
        {waiting ? (
          <AnalyticsDashboardSkeleton />
        ) : stats.isError || !stats.data ? (
          <div
            role="alert"
            className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
          >
            <h2 className="font-semibold">Analytics couldn’t be loaded</h2>
            <p className="text-sm text-muted-foreground">Your links are still available below.</p>
            <Button
              variant="outline"
              disabled={stats.isFetching}
              onClick={() => {
                void stats.refetch();
              }}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <DashboardMetrics stats={stats.data} />
            <DashboardClickChart
              history={history}
              total={stats.data.total_clicks}
              period={period}
            />
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Audience breakdown</h2>
              <div className="grid min-w-0 gap-4 @4xl:grid-cols-3">
                <DashboardBreakdown
                  title="Locations"
                  description="Top countries · selected period"
                  total={stats.data.total_clicks}
                  rows={(stats.data.top_countries ?? []).map((item) => ({
                    label: item.country === "Local Machine" ? "Localhost" : item.country,
                    count: item.count,
                  }))}
                />
                <DashboardBreakdown
                  title="Devices"
                  description="Device types · selected period"
                  total={stats.data.total_clicks}
                  rows={(stats.data.top_devices ?? []).map((item) => ({
                    label: item.device,
                    count: item.count,
                  }))}
                />
                <DashboardBreakdown
                  title="Referrers"
                  description="Traffic sources · selected period"
                  total={stats.data.total_clicks}
                  rows={(stats.data.top_referrers ?? []).map((item) => ({
                    label: item.host || "Direct",
                    count: item.count,
                  }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Card className="min-w-0 gap-4 shadow-none">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6">
          <div className="space-y-1">
            <CardTitle className="text-base">Recent links</CardTitle>
            <CardDescription>Latest links · lifetime clicks</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-10 -mr-2">
            <Link href="/main/links">
              View all links
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {links.isLoading ? (
            <div role="status" aria-label="Loading recent links" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : links.isError ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 py-6">
              <p className="text-sm text-muted-foreground">Recent links couldn’t be loaded.</p>
              <Button
                variant="outline"
                disabled={links.isFetching}
                onClick={() => {
                  void links.refetch();
                }}
              >
                Retry links
              </Button>
            </div>
          ) : recent.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium">No links yet</p>
              <p className="text-sm text-muted-foreground">
                Create a link to start measuring its performance.
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/main/links">Go to links</Link>
              </Button>
            </div>
          ) : (
            <div className="@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_max-content_max-content_max-content] @3xl:gap-x-5">
              {recent.map((link) => (
                <div
                  key={link.id}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b py-4 first:pt-0 last:border-b-0 last:pb-0 @3xl:col-span-4 @3xl:grid-cols-subgrid @3xl:gap-x-5"
                >
                  <div className="col-span-2 min-w-0 space-y-1 @3xl:col-span-1">
                    <Link
                      href={`/main/analytics/${link.short_code}`}
                      className="block truncate rounded-sm text-sm font-medium hover:text-primary-ink focus-visible:outline-2 focus-visible:outline-ring"
                      title={link.title || link.short_code}
                    >
                      {link.title || "Untitled"}
                    </Link>
                    <code className="block truncate text-xs text-muted-foreground">
                      /{link.short_code}
                    </code>
                    <a
                      href={link.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs text-muted-foreground hover:text-primary-ink"
                      title={link.original_url}
                    >
                      {link.original_url}
                    </a>
                  </div>
                  <LinkStatusBadge
                    isActive={link.is_active}
                    expiresAt={link.expires_at}
                    isBanned={link.detail?.is_banned}
                    className="h-6"
                  />
                  <span className="justify-self-end whitespace-nowrap text-xs text-muted-foreground tabular-nums @3xl:justify-self-start">
                    {(link.click_count ?? link.detail?.current_clicks ?? 0).toLocaleString("en-US")}{" "}
                    {(link.click_count ?? link.detail?.current_clicks ?? 0) === 1
                      ? "click"
                      : "clicks"}
                  </span>
                  <div className="col-span-2 flex items-center justify-end gap-1 @3xl:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 text-muted-foreground"
                      title="Copy link"
                      aria-label={`Copy ${link.short_code} link`}
                      onClick={() => {
                        void copy(link.short_code, link.detail?.passcode);
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-10 text-muted-foreground"
                      title="View analytics"
                    >
                      <Link
                        href={`/main/analytics/${link.short_code}`}
                        aria-label={`View analytics for ${link.short_code}`}
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function AnalyticsDashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading analytics" className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

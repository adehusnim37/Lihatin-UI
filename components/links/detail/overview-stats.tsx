"use client";

import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildLinkHistory } from "@/lib/analytics/link-history";
import type { ShortLink, ShortLinkStats } from "@/lib/api/shortlinks";
import { useLinkStats } from "@/lib/hooks/queries/useLinksQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const number = (value: number) => value.toLocaleString("en-US");

export function OverviewStats({ link }: { link: ShortLink }) {
  const { data, isLoading, error, refetch, isFetching } = useLinkStats(link.short_code);
  if (isLoading) return <OverviewSkeleton />;
  if (error || !data)
    return (
      <div
        role="alert"
        className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
      >
        <h2 className="font-semibold">Analytics couldn’t be loaded</h2>
        <p className="text-sm text-muted-foreground">Try again to see this link’s performance.</p>
        <Button
          variant="outline"
          disabled={isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  return <AnalyticsOverview stats={data} />;
}

export function AnalyticsOverview({ stats }: { stats: ShortLinkStats }) {
  const [timeRange, setTimeRange] = useState("7");
  const gradientId = useId();
  const history = useMemo(
    () =>
      buildLinkHistory(
        timeRange === "1" ? stats.click_history_hourly : stats.click_history,
        Number(timeRange),
      ),
    [stats.click_history, stats.click_history_hourly, timeRange],
  );
  const periodClicks =
    timeRange === "1" ? stats.last_24h : history.reduce((total, item) => total + item.count, 0);
  const countries = stats.top_countries ?? [];
  const devices = stats.top_devices ?? [];
  const referrers = stats.top_referrers ?? [];
  const country = countries[0];
  const device = devices[0];
  const metrics = [
    { label: "Total clicks", value: number(stats.total_clicks), note: "All time" },
    {
      label: "Unique visitors",
      value: number(stats.unique_visitors),
      note: "Distinct IP addresses · all time",
    },
    {
      label: "Top location",
      value: country ? (country.country === "Local Machine" ? "Localhost" : country.country) : "—",
      note: country ? `${number(country.count)} clicks · all time` : "No location data yet",
    },
    {
      label: "Top device",
      value: device?.device || "—",
      note: device ? `${number(device.count)} clicks · all time` : "No device data yet",
    },
  ];

  return (
    <div className="@container space-y-6">
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card @3xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`min-w-0 p-4 sm:p-5 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b @3xl:border-b-0" : ""} ${index === 1 ? "@3xl:border-r" : ""}`}
          >
            <dt className="text-xs font-medium text-muted-foreground">{metric.label}</dt>
            <dd
              className="mt-2 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
              title={metric.value}
            >
              {metric.value}
            </dd>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.note}</p>
          </div>
        ))}
      </dl>

      <Card className="gap-4 shadow-none">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4 px-4 sm:px-6">
          <div className="space-y-1">
            <CardTitle className="text-base">Click activity</CardTitle>
            <CardDescription>
              <span className="font-medium text-foreground tabular-nums">
                {number(periodClicks)}
              </span>{" "}
              clicks in this period
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger aria-label="Click activity period" className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {periodClicks > 0 ? (
            <div
              className="h-64 min-w-0 sm:h-72"
              role="img"
              aria-label={`${number(periodClicks)} clicks over the last ${timeRange === "1" ? "24 hours" : `${timeRange} days`}.`}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={history}
                  margin={{ top: 12, right: 8, bottom: 0, left: -16 }}
                  accessibilityLayer
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tickMargin={12}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      Intl.NumberFormat("en", { notation: "compact" }).format(value)
                    }
                  />
                  <Tooltip
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                    contentStyle={{
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "var(--popover-foreground)" }}
                  />
                  <Area
                    type="linear"
                    name="Clicks"
                    dataKey="count"
                    stroke="var(--primary-ink)"
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center sm:h-72">
              <p className="text-sm font-medium">No clicks in this period</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Choose a longer period or share your link to start collecting traffic.
              </p>
            </div>
          )}
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            {number(stats.last_24h)} clicks in the last 24 hours. The period selector applies to
            this chart.
          </p>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 @4xl:grid-cols-3">
        <TrafficBreakdown
          title="Locations"
          description="Countries your visitors come from"
          total={stats.total_clicks}
          rows={countries.map((item) => ({
            label: item.country === "Local Machine" ? "Localhost" : item.country,
            count: item.count,
          }))}
        />
        <TrafficBreakdown
          title="Devices"
          description="How visitors open your link"
          total={stats.total_clicks}
          rows={devices.map((item) => ({ label: item.device, count: item.count }))}
        />
        <TrafficBreakdown
          title="Referrers"
          description="Where your traffic comes from"
          total={stats.total_clicks}
          rows={referrers.map((item) => ({
            label: item.host || "Direct",
            count: item.count,
          }))}
        />
      </div>
    </div>
  );
}

function TrafficBreakdown({
  title,
  description,
  rows,
  total,
}: {
  title: string;
  description: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <Card className="min-w-0 gap-4 shadow-none">
      <CardHeader className="gap-1 px-4 sm:px-5">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description} · all time</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-5">
        {rows.length ? (
          <ul className="divide-y">
            {rows.map((row, index) => (
              <li
                key={`${row.label}-${index}`}
                className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-sm" title={row.label}>
                  {row.label}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                  <span className="font-medium">{number(row.count)}</span>
                  <span className="w-10 text-right text-muted-foreground">
                    {total > 0 ? Math.round((row.count / total) * 100) : 0}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewSkeleton() {
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

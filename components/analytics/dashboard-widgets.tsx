"use client";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/api/shortlinks";
import type { dashboardHistory } from "@/lib/analytics/dashboard-history";

const count = (value: number) => value.toLocaleString("en-US");

export function DashboardMetrics({ stats }: { stats: DashboardSummary }) {
  const metrics = [
    { label: "Total clicks", value: count(stats.total_clicks), note: "Selected period" },
    {
      label: "Unique visitors",
      value: count(stats.total_unique_visitors),
      note: "Distinct IPs · selected period",
    },
    {
      label: "Enabled links",
      value: count(stats.active_links),
      note: `Of ${count(stats.total_links)} links · account total`,
    },
    {
      label: "Clicks per visitor",
      value:
        stats.total_unique_visitors > 0
          ? (stats.total_clicks / stats.total_unique_visitors).toFixed(1)
          : "—",
      note: "Average · selected period",
    },
  ];
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card @3xl:grid-cols-4">
      {metrics.map((metric, i) => (
        <div
          key={metric.label}
          className={`min-w-0 p-4 sm:p-5 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b @3xl:border-b-0" : ""} ${i === 1 ? "@3xl:border-r" : ""}`}
        >
          <dt className="text-xs font-medium text-muted-foreground">{metric.label}</dt>
          <dd className="mt-2 break-all text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {metric.value}
          </dd>
          <dd className="mt-1 text-xs leading-5 text-muted-foreground">{metric.note}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DashboardClickChart({
  history,
  total,
  period,
}: {
  history: ReturnType<typeof dashboardHistory>;
  total: number;
  period: string;
}) {
  const id = useId();
  return (
    <Card className="min-w-0 gap-4 shadow-none">
      <CardHeader className="gap-1 px-4 sm:px-6">
        <CardTitle className="text-base">Click activity</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground tabular-nums">{count(total)}</span> clicks ·{" "}
          {period}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {total > 0 ? (
          <div
            className="h-64 min-w-0 sm:h-72"
            role="img"
            aria-label={`${count(total)} clicks from ${period}`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart
                data={history}
                margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
                accessibilityLayer
              >
                <defs>
                  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  minTickGap={32}
                  tickMargin={12}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
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
                  dataKey="count"
                  name="Clicks"
                  type="linear"
                  stroke="var(--primary-ink)"
                  strokeWidth={2}
                  fill={`url(#${id})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center sm:h-72">
            <p className="text-sm font-medium">No clicks in this period</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Choose a different date range or share your links to start collecting traffic.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardBreakdown({
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
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-5">
        {rows.length ? (
          <ul className="divide-y">
            {rows.map((row, i) => (
              <li
                key={`${row.label}-${i}`}
                className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-sm" title={row.label}>
                  {row.label}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                  <span className="font-medium">{count(row.count)}</span>
                  <span className="w-10 text-right text-muted-foreground">
                    {total > 0 ? Math.round((row.count / total) * 100) : 0}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No data in this period.</p>
        )}
      </CardContent>
    </Card>
  );
}

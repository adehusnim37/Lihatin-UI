"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  MousePointerClick,
  Globe,
  MonitorSmartphone,
  MapPin,
  CalendarDays,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  format,
  parseISO,
  subDays,
  isAfter,
  startOfDay,
  eachDayOfInterval,
  eachHourOfInterval,
  subHours,
} from "date-fns";

import { ShortLink } from "@/lib/api/shortlinks";
import { useLinkStats } from "@/lib/hooks/queries/useLinksQuery";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0ea5e9", "#22c55e", "#eab308", "#f43f5e", "#8b5cf6"];

interface OverviewStatsProps {
  link: ShortLink;
}

export function OverviewStats({ link }: OverviewStatsProps) {
  const { data: stats, isLoading } = useLinkStats(link.short_code);
  const [timeRange, setTimeRange] = useState("1"); // 1, 7, 30, 60, 90

  // Filter Click History based on Time Range
  const filteredHistory = useMemo(() => {
    // If no stats, return empty array OR better, return empty timeline?
    // Let's assume stats always exists if not loading.
    const history = stats?.click_history || [];
    const historyHourly = stats?.click_history_hourly || [];

    // Determine date range
    const days = parseInt(timeRange);

    if (days === 1) {
      // Hourly View (Last 24h)
      const end = new Date();
      const start = subHours(end, 23); // Last 24 hours including current hour

      const allHours = eachHourOfInterval({ start, end });

      return allHours.map((date) => {
        // Format to match API: "yyyy-MM-dd HH:00"
        // Note: API might return "2023-01-01 13:00"
        const dateMatchingKey = format(date, "yyyy-MM-dd HH:00");
        const found = historyHourly.find((h) => h.date === dateMatchingKey);

        return {
          date: dateMatchingKey, // Unique key
          formattedDate: format(date, "HH:mm"), // Display 13:00
          count: found ? found.count : 0,
        };
      });
    } else {
      // Daily View
      const end = startOfDay(new Date());
      const start = subDays(end, days - 1); // e.g. last 7 days includes today

      // Generate all dates in interval
      const allDates = eachDayOfInterval({ start, end });

      // Merge with API data
      return allDates.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const found = history.find((h) => h.date === dateStr);
        return {
          date: dateStr,
          formattedDate: format(date, "MMM dd"),
          count: found ? found.count : 0,
        };
      });
    }
  }, [stats?.click_history, stats?.click_history_hourly, timeRange]);

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No stats available.
      </div>
    );
  }

  const {
    total_clicks,
    unique_visitors,
    top_referrers,
    top_devices,
    top_countries,
    last_24h,
  } = stats;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium -mt-4">{total_clicks}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-4">
              {last_24h > 0 && (
                <span className="text-green-500 flex items-center mr-1">
                  <TrendingUp className="h-3 w-3 mr-1" />+{last_24h}
                </span>
              )}
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium -mt-4">{unique_visitors}</div>
            <p className="text-xs text-muted-foreground mt-4">
              Distinct IP addresses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Location
            </CardTitle>
            <MapPin className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium truncate -mt-4">
              {top_countries && top_countries.length > 0
                ? top_countries[0].country === "Local Machine"
                  ? "Localhost"
                  : top_countries[0].country
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {top_countries && top_countries.length > 0
                ? `${top_countries[0].count} clicks (${Math.round(
                    (top_countries[0].count / total_clicks) * 100
                  )}%)`
                : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Device
            </CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium truncate -mt-4">
              {top_devices && top_devices.length > 0
                ? top_devices[0].device
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {top_devices && top_devices.length > 0
                ? `${top_devices[0].count} clicks (${Math.round(
                    (top_devices[0].count / total_clicks) * 100
                  )}%)`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Trend & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Click Trend Area Chart (Takes 2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Click Growth</CardTitle>
              <CardDescription>Volume over time</CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 day</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[300px]">
            {filteredHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorClicks"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data for selected period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>User device types</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {top_devices && top_devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={top_devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="device"
                  >
                    {top_devices.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Locations & Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Locations Bar List */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Most frequent countries</CardDescription>
          </CardHeader>
          <CardContent>
            {top_countries && top_countries.length > 0 ? (
              <div className="space-y-4">
                {top_countries.map((item, index) => (
                  <div key={item.country} className="flex items-center gap-3">
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">
                          {item.country === "Local Machine"
                            ? "Localhost"
                            : item.country}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: `${
                              (item.count /
                                Math.max(
                                  ...top_countries.map((d) => d.count)
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers List */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where traffic comes from</CardDescription>
          </CardHeader>
          <CardContent>
            {top_referrers && top_referrers.length > 0 ? (
              <div className="space-y-4">
                {top_referrers.map((item, index) => (
                  <div
                    key={item.host}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span
                        className="text-sm font-medium truncate"
                        title={item.host}
                      >
                        {item.host || "Direct"}
                      </span>
                    </div>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No referrer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[380px] w-full rounded-xl" />
        <Skeleton className="h-[380px] w-full rounded-xl" />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  CalendarIcon,
  TrendingUp,
  Users,
  MousePointerClick,
  Link as LinkIcon,
  Globe,
  Smartphone,
  Layout,
  ArrowRight,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/lib/hooks/queries/useDashboardQuery";
import { useLinks } from "@/lib/hooks/queries/useLinksQuery";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Table state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 5; // Smaller limit for dashboard view

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : undefined;
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : undefined;

  const { data: stats, isLoading: statsLoading } = useDashboardStats(
    startDate,
    endDate
  );
  const { data: linksData, isLoading: linksLoading } = useLinks(page, limit);

  const links = linksData?.short_links || [];
  const totalPages = linksData?.total_pages || 0;

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
        <div className="flex flex-1 flex-col gap-8 p-6">
          {/* Header & Date Picker */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                Overview of your link performance and audience.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[260px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* KPI Cards (SectionCards Style) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clicks
                </CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.total_clicks ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  In selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Visitors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.total_unique_visitors ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Distinct audiences
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Links
                </CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.active_links ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Of {stats?.total_links ?? 0} total links
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Engagement Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.total_clicks && stats.total_unique_visitors
                    ? (
                        stats.total_clicks / stats.total_unique_visitors
                      ).toFixed(1)
                    : "0.0"}
                  x
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clicks per visitor
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart Area (Line Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Click Performance</CardTitle>
              <CardDescription>
                Daily click history for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={stats?.click_history ?? []}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="clicks"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                    }
                  />
                  <Line
                    dataKey="count"
                    type="monotone"
                    stroke="#70c5df"
                    strokeWidth={2}
                    dot={{
                      fill: "#70c5df",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Top Countries (Bar Chart) */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-muted-foreground" /> Top
                  Countries
                </CardTitle>
                <CardDescription>Top locations by clicks</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[250px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={stats?.top_countries?.slice(0, 5) ?? []}
                    layout="vertical"
                    margin={{
                      left: 0,
                    }}
                  >
                    <YAxis
                      dataKey="country"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      width={80}
                      hide
                    />
                    <XAxis dataKey="count" type="number" hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="count"
                      layout="vertical"
                      radius={5}
                      fill="#70c5df"
                    >
                      <LabelList
                        dataKey="country"
                        position="insideLeft"
                        offset={8}
                        className="text-xs font-bold"
                        fontSize={10}
                        fill="#ffffff"
                        formatter={(value: any) => value || "Unknown"}
                      />
                      <LabelList
                        dataKey="count"
                        position="right"
                        offset={8}
                        className="fill-foreground"
                        fontSize={12}
                        fill="#ffffff"
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Devices (Radial Chart) */}
            <Card className="flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="h-4 w-4 text-muted-foreground" /> Top
                  Devices
                </CardTitle>
                <CardDescription>Device distribution</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <RadialBarChart
                    data={
                      stats?.top_devices?.slice(0, 5).map((d, i) => ({
                        ...d,
                        fill: [
                          "#70c5df",
                          "#56d6de",
                          "#c2faff",
                          "#70c5df",
                          "#56d6de",
                        ][i % 5],
                      })) ?? []
                    }
                    startAngle={-90}
                    endAngle={380}
                    innerRadius={30}
                    outerRadius={110}
                  >
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent hideLabel nameKey="device" />
                      }
                    />
                    <RadialBar dataKey="count" background>
                      <LabelList
                        position="insideStart"
                        dataKey="device"
                        className="fill-white capitalize mix-blend-luminosity"
                        fontSize={11}
                      />
                    </RadialBar>
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Referrers (Pie Chart) */}
            <Card className="flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layout className="h-4 w-4 text-muted-foreground" /> Top
                  Referrers
                </CardTitle>
                <CardDescription>Traffic sources</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[200px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent nameKey="host" />}
                    />
                    <Pie
                      data={
                        stats?.top_referrers?.slice(0, 5).map((r, i) => ({
                          ...r,
                          name: r.host || "Direct",
                          fill: [
                            "#70c5df",
                            "#56d6de",
                            "#c2faff",
                            "#70c5df",
                            "#56d6de",
                          ][i % 5],
                        })) ?? []
                      }
                      dataKey="count"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                      label={({ name, percent }) =>
                        `${name?.substring(0, 10) || "Direct"}: ${(
                          percent * 100
                        ).toFixed(0)}%`
                      }
                      labelLine={false}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Link Table (Restored) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Links</CardTitle>
                <CardDescription>
                  Detailed performance of your most recent links.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/main/links")}
              >
                View All Matches <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link Details</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linksLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-8 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : links.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No links found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div
                              className="font-medium truncate max-w-[200px]"
                              title={link.title}
                            >
                              {link.title || "Untitled"}
                            </div>
                            <a
                              href={link.original_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-muted-foreground hover:underline truncate max-w-[200px] flex items-center gap-1"
                            >
                              {link.original_url}{" "}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            /{link.short_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium">
                            <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                            {link.detail?.current_clicks || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={link.is_active ? "default" : "secondary"}
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              router.push(`/main/analytics/${link.short_code}`)
                            }
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

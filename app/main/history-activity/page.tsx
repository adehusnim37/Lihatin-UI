"use client";

import {
  History,
  MousePointerClick,
  Link2,
  Settings,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit3,
  Trash2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { QueryError } from "@/components/query-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useActivityLogs, useLogCounts, useLogsWithFilter } from "@/lib/hooks/queries/useLogsQuery";
import { LogDetailDialog } from "../../../components/logs/LogDetailDialog";
import { DateTimePicker24hForm } from "@/components/ui/datepickerhour";

type ActivityType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "other";

const getActivityIcon = (method: string) => {
  switch (method) {
    case "GET":
      return <MousePointerClick className="size-4" />;
    case "POST":
      return <Link2 className="size-4" />;
    case "PUT":
      return <Edit3 className="size-4" />;
    case "PATCH":
      return <Settings className="size-4" />;
    case "DELETE":
      return <Trash2 className="size-4" />;
    default:
      return <History className="size-4" />;
  }
};

const getActivityColor = (level: string, method: string) => {
  const levelLower = level.toLowerCase();
  if (levelLower === "error") return "bg-red-500/10 text-red-700 dark:text-red-400";
  if (levelLower === "warning") return "bg-amber-500/10 text-amber-800 dark:text-amber-400";
  if (levelLower === "success" || method === "POST")
    return "bg-green-500/10 text-green-700 dark:text-green-400";
  if (method === "DELETE") return "bg-red-500/10 text-red-700 dark:text-red-400";
  if (method === "GET") return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  if (method === "PUT" || method === "PATCH")
    return "bg-amber-500/10 text-amber-800 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
};

const formatTimestamp = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "MMM d, HH:mm:ss");
  } catch {
    return timestamp;
  }
};

export default function HistoryActivityPage() {
  const [filter, setFilter] = useState<"all" | ActivityType>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    username: "",
    action: "",
    route: "",
    level: "",
    status_code: "",
    ip_address: "",
    date_from: "",
    date_to: "",
  });

  // Build filter params for API
  const hasActiveFilters = Object.values(advancedFilters).some((v) => v !== "");

  const filterParams =
    filter !== "all" || hasActiveFilters
      ? {
          page,
          limit,
          sort: "created_at",
          order_by: "desc" as const,
          ...(filter !== "all" && { method: filter }),
          ...(advancedFilters.username && {
            username: advancedFilters.username,
          }),
          ...(advancedFilters.action && { action: advancedFilters.action }),
          ...(advancedFilters.route && { route: advancedFilters.route }),
          ...(advancedFilters.level && { level: advancedFilters.level }),
          ...(advancedFilters.status_code && {
            status_code: parseInt(advancedFilters.status_code),
          }),
          ...(advancedFilters.ip_address && {
            ip_address: advancedFilters.ip_address,
          }),
          ...(advancedFilters.date_from && {
            date_from: advancedFilters.date_from,
          }),
          ...(advancedFilters.date_to && { date_to: advancedFilters.date_to }),
        }
      : undefined;

  const {
    data: allLogsData,
    isLoading: allLogsLoading,
    error: allLogsError,
    refetch: refetchAllLogs,
    isFetching: allLogsFetching,
  } = useActivityLogs(page, limit, "created_at", "desc");

  const {
    data: filteredLogsData,
    isLoading: filteredLogsLoading,
    error: filteredLogsError,
    refetch: refetchFilteredLogs,
    isFetching: filteredLogsFetching,
  } = useLogsWithFilter(filterParams || { page: 1, limit: 20 });

  // Use filtered data if filter is active, otherwise use all logs
  const data = filterParams ? filteredLogsData : allLogsData;
  const isLoading = filterParams ? filteredLogsLoading : allLogsLoading;
  const error = filterParams ? filteredLogsError : allLogsError;

  const {
    data: countsData,
    isLoading: countsLoading,
    error: countsError,
    refetch: refetchCounts,
  } = useLogCounts();
  const isFetching = filterParams ? filteredLogsFetching : allLogsFetching;

  const logs = data?.data?.logs || [];
  const totalCount = data?.data?.total_count || 0;
  const totalPages = data?.data?.total_pages || 0;
  const hasNext = data?.data?.has_next || false;
  const hasPrev = data?.data?.has_prev || false;

  // Get counts from API
  const getCounts = countsData?.data?.GET || 0;
  const postCounts = countsData?.data?.POST || 0;
  const putCounts = countsData?.data?.PUT || 0;
  const patchCounts = countsData?.data?.PATCH || 0;
  const deleteCounts = countsData?.data?.DELETE || 0;
  const totalAllCounts = getCounts + postCounts + putCounts + patchCounts + deleteCounts;

  const clearAllFilters = () => {
    setFilter("all");
    setAdvancedFilters({
      username: "",
      action: "",
      route: "",
      level: "",
      status_code: "",
      ip_address: "",
      date_from: "",
      date_to: "",
    });
    setPage(1);
  };

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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="mx-auto flex w-full min-w-0 max-w-[1328px] flex-1 flex-col gap-6 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">History & Activity</h1>
            <p className="text-muted-foreground">Track all actions and events in your account.</p>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Dialog open={showAdvancedFilter} onOpenChange={setShowAdvancedFilter}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="size-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {(hasActiveFilters || filter !== "all") && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      {Object.values(advancedFilters).filter((v) => v !== "").length +
                        (filter !== "all" ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="size-5" />
                    Filter Logs
                  </DialogTitle>
                  <DialogDescription>Narrow down your activity logs</DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-5">
                  {/* User & Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="activity-username"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by user..."
                        id="activity-username"
                        value={advancedFilters.username}
                        onChange={(e) => {
                          setAdvancedFilters({
                            ...advancedFilters,
                            username: e.target.value,
                          });
                          setPage(1);
                        }}
                        className="min-h-[44px] w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label htmlFor="activity-action" className="text-sm font-medium mb-1.5 block">
                        Action
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., login..."
                        id="activity-action"
                        value={advancedFilters.action}
                        onChange={(e) => {
                          setAdvancedFilters({
                            ...advancedFilters,
                            action: e.target.value,
                          });
                          setPage(1);
                        }}
                        className="min-h-[44px] w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* HTTP Details */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="activity-route" className="text-sm font-medium mb-1.5 block">
                        Route/Path
                      </label>
                      <input
                        type="text"
                        placeholder="/api/auth/login"
                        id="activity-route"
                        value={advancedFilters.route}
                        onChange={(e) => {
                          setAdvancedFilters({
                            ...advancedFilters,
                            route: e.target.value,
                          });
                          setPage(1);
                        }}
                        className="min-h-[44px] w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor="activity-level"
                          className="text-sm font-medium mb-1.5 block"
                        >
                          Level
                        </label>
                        <select
                          id="activity-level"
                          value={advancedFilters.level}
                          onChange={(e) => {
                            setAdvancedFilters({
                              ...advancedFilters,
                              level: e.target.value,
                            });
                            setPage(1);
                          }}
                          className="min-h-[44px] w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">All</option>
                          <option value="info">INFO</option>
                          <option value="warn">WARN</option>
                          <option value="error">ERROR</option>
                          <option value="fatal">FATAL</option>
                          <option value="debug">DEBUG</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="activity-status_code"
                          className="text-sm font-medium mb-1.5 block"
                        >
                          Status
                        </label>
                        <input
                          type="number"
                          placeholder="200"
                          id="activity-status_code"
                          value={advancedFilters.status_code}
                          onChange={(e) => {
                            setAdvancedFilters({
                              ...advancedFilters,
                              status_code: e.target.value,
                            });
                            setPage(1);
                          }}
                          className="min-h-[44px] w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="activity-ip_address"
                          className="text-sm font-medium mb-1.5 block"
                        >
                          IP Address
                        </label>
                        <input
                          type="text"
                          placeholder="192.168.1.1"
                          id="activity-ip_address"
                          value={advancedFilters.ip_address}
                          onChange={(e) => {
                            setAdvancedFilters({
                              ...advancedFilters,
                              ip_address: e.target.value,
                            });
                            setPage(1);
                          }}
                          className="min-h-[44px] w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="activity-date_from"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        From Date & Time
                      </label>
                      <DateTimePicker24hForm
                        id="activity-date_from"
                        ariaLabel="From Date & Time"
                        value={
                          advancedFilters.date_from
                            ? new Date(advancedFilters.date_from)
                            : undefined
                        }
                        onChange={(date) => {
                          if (date) {
                            // Format dengan timezone offset (e.g., 2026-02-02T15:00:00+07:00)
                            const offset = -date.getTimezoneOffset();
                            const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(
                              2,
                              "0",
                            );
                            const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
                            const offsetSign = offset >= 0 ? "+" : "-";

                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const day = String(date.getDate()).padStart(2, "0");
                            const hours = String(date.getHours()).padStart(2, "0");
                            const minutes = String(date.getMinutes()).padStart(2, "0");
                            const seconds = String(date.getSeconds()).padStart(2, "0");

                            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;

                            // Clear to_date if it becomes invalid
                            const newFilters: typeof advancedFilters = {
                              ...advancedFilters,
                              date_from: formattedDate,
                            };

                            if (advancedFilters.date_to) {
                              const toDate = new Date(advancedFilters.date_to);
                              if (!Number.isNaN(toDate.getTime()) && toDate < date) {
                                newFilters.date_to = "";
                                toast.error("To date cleared because it was before from date");
                              }
                            }

                            setAdvancedFilters(newFilters);
                          } else {
                            setAdvancedFilters({
                              ...advancedFilters,
                              date_from: "",
                            });
                          }
                          setPage(1);
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="activity-date_to"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        To Date & Time
                      </label>
                      <DateTimePicker24hForm
                        id="activity-date_to"
                        ariaLabel="To Date & Time"
                        disableBefore={
                          advancedFilters.date_from
                            ? new Date(advancedFilters.date_from)
                            : undefined
                        }
                        disabledPast2Dates={true}
                        value={
                          advancedFilters.date_to ? new Date(advancedFilters.date_to) : undefined
                        }
                        onChange={(date) => {
                          if (date) {
                            // Validate that to_date is after from_date
                            if (advancedFilters.date_from) {
                              const fromDate = new Date(advancedFilters.date_from);
                              if (date < fromDate) {
                                toast.error("To date must be after from date");
                                return;
                              }
                            }

                            // Format dengan timezone offset (e.g., 2026-02-02T16:45:00+07:00)
                            const offset = -date.getTimezoneOffset();
                            const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(
                              2,
                              "0",
                            );
                            const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, "0");
                            const offsetSign = offset >= 0 ? "+" : "-";

                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const day = String(date.getDate()).padStart(2, "0");
                            const hours = String(date.getHours()).padStart(2, "0");
                            const minutes = String(date.getMinutes()).padStart(2, "0");
                            const seconds = String(date.getSeconds()).padStart(2, "0");

                            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;

                            setAdvancedFilters({
                              ...advancedFilters,
                              date_to: formattedDate,
                            });
                          } else {
                            setAdvancedFilters({
                              ...advancedFilters,
                              date_to: "",
                            });
                          }
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>

                  {/* Clear Button */}
                  {(hasActiveFilters || filter !== "all") && (
                    <>
                      <Separator />
                      <Button onClick={clearAllFilters} variant="outline" className="w-full">
                        <X className="size-4 mr-2" />
                        Clear All
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {(hasActiveFilters || filter !== "all") && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Active:</span>
                {filter !== "all" && (
                  <Button
                    variant="secondary"
                    aria-label="Remove method filter"
                    onClick={() => {
                      setFilter("all");
                      setPage(1);
                    }}
                  >
                    {filter}
                    <X className="size-4" />
                  </Button>
                )}
                {Object.entries(advancedFilters)
                  .filter(([, value]) => value)
                  .map(([key, value]) => (
                    <Button
                      key={key}
                      variant="secondary"
                      className="h-auto min-h-[44px] max-w-full whitespace-normal text-left"
                      aria-label={`Remove ${key.replace(/_/g, " ")} filter`}
                      onClick={() => {
                        setAdvancedFilters({ ...advancedFilters, [key]: "" });
                        setPage(1);
                      }}
                    >
                      <span className="min-w-0 break-all">
                        {key.replace(/_/g, " ")}:{" "}
                        {key.startsWith("date_") ? new Date(value).toLocaleString() : value}
                      </span>
                      <X className="size-4" />
                    </Button>
                  ))}
              </div>
            )}
          </div>

          {countsError && (
            <QueryError
              message="Could not load activity totals."
              onRetry={() => void refetchCounts()}
            />
          )}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Card */}
            <div
              className="rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 hover:shadow-md transition-all cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFilter("all");
                  setPage(1);
                }
              }}
              role="button"
              aria-pressed={filter === "all"}
              tabIndex={0}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <History className="size-6 text-primary-ink" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Activity</p>
                    <p className="text-2xl font-bold">
                      {countsLoading ? "…" : countsError ? "—" : totalAllCounts.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">All HTTP requests logged</p>
            </div>

            {/* HTTP Methods Group */}
            <div className="md:col-span-2 rounded-2xl border bg-card p-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Filter className="size-4" />
                HTTP Methods
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    method: "GET",
                    count: getCounts,
                    icon: <MousePointerClick className="size-4" />,
                    color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
                    textColor: "text-blue-600 dark:text-blue-400",
                  },
                  {
                    method: "POST",
                    count: postCounts,
                    icon: <Link2 className="size-4" />,
                    color: "from-green-500/10 to-green-500/5 border-green-500/20",
                    textColor: "text-green-700 dark:text-green-400",
                  },
                  {
                    method: "PUT",
                    count: putCounts,
                    icon: <Edit3 className="size-4" />,
                    color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
                    textColor: "text-amber-800 dark:text-amber-400",
                  },
                  {
                    method: "PATCH",
                    count: patchCounts,
                    icon: <Settings className="size-4" />,
                    color: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
                    textColor: "text-purple-600 dark:text-purple-400",
                  },
                  {
                    method: "DELETE",
                    count: deleteCounts,
                    icon: <Trash2 className="size-4" />,
                    color: "from-red-500/10 to-red-500/5 border-red-500/20",
                    textColor: "text-red-600 dark:text-red-400",
                  },
                ].map(({ method, count, icon, color, textColor }) => (
                  <div
                    key={method}
                    onClick={() => {
                      setFilter(method as ActivityType);
                      setPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFilter(method as ActivityType);
                        setPage(1);
                      }
                    }}
                    role="button"
                    aria-pressed={filter === method}
                    tabIndex={0}
                    className={`rounded-lg border bg-gradient-to-br ${color} p-3 hover:shadow-md transition-all cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${textColor}`}>{icon}</div>
                      <span className="text-xs font-medium text-muted-foreground">{method}</span>
                    </div>
                    <p className={`text-lg font-bold ${textColor}`}>
                      {countsLoading ? "…" : countsError ? "—" : count.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {isLoading ? (
              <div
                role="status"
                aria-label="Loading activity logs"
                className="flex items-center justify-center p-12"
              >
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <QueryError
                message="Could not load activity logs."
                onRetry={() => void (filterParams ? refetchFilteredLogs() : refetchAllLogs())}
              />
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <History className="size-12 mb-4" />
                <p className="text-lg font-semibold">No activity logs found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {isFetching && (
                  <p role="status" className="px-4 py-2 text-sm text-muted-foreground">
                    Updating activity logs…
                  </p>
                )}
                <div
                  className="hidden items-center gap-5 border-b bg-muted/30 px-5 py-3 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[116px_minmax(0,1fr)_128px_132px_16px]"
                  aria-hidden="true"
                >
                  <span>Action</span>
                  <span>Request & status</span>
                  <span>User</span>
                  <span>Time</span>
                  <span />
                </div>
                <ul aria-label="Activity logs" className="divide-y">
                  {logs.map((log) => (
                    <li key={log.id}>
                      <button
                        type="button"
                        aria-label={`View log details: ${log.action || log.message}, ${log.method} ${log.route}, status ${log.status_code}, ${log.username || "Anonymous"}, ${formatTimestamp(log.created_at)}`}
                        onClick={() => setSelectedLogId(log.id)}
                        className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[116px_minmax(0,1fr)_128px_132px_16px] md:gap-x-5 md:gap-y-0 md:px-5 md:py-3"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className={`shrink-0 rounded-lg p-2 ${getActivityColor(log.level, log.method)}`}
                          >
                            {getActivityIcon(log.method)}
                          </span>
                          <span className="min-w-0">
                            <span
                              className="block truncate text-sm font-semibold"
                              title={log.action || log.message}
                            >
                              {log.action || log.message}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {log.level.toLowerCase()}
                            </span>
                          </span>
                        </span>
                        <span className="col-span-2 row-start-2 flex min-w-0 flex-wrap items-center gap-2 md:flex-nowrap md:col-span-1 md:row-start-auto">
                          <span
                            title={`HTTP status ${log.status_code}`}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold tabular-nums ${
                              log.status_code >= 200 && log.status_code < 300
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : log.status_code >= 400
                                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                                  : "bg-amber-500/10 text-amber-800 dark:text-amber-400"
                            }`}
                          >
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                            {log.status_code}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-muted-foreground">
                            {log.method}
                          </span>
                          <code
                            title={log.route}
                            className="min-w-0 w-full break-all font-mono text-xs leading-5 text-foreground md:w-auto md:truncate"
                          >
                            {log.route}
                          </code>
                        </span>
                        <span className="col-start-2 row-start-1 flex min-w-0 items-center justify-end gap-1.5 text-xs text-muted-foreground md:col-start-auto md:row-start-auto md:justify-start md:text-sm">
                          <User aria-hidden="true" className="size-3.5 shrink-0" />
                          <span
                            className="max-w-24 truncate md:max-w-full"
                            title={log.username || "Anonymous"}
                          >
                            {log.username || "Anonymous"}
                          </span>
                        </span>
                        <time
                          dateTime={log.created_at}
                          className="col-span-2 row-start-3 text-xs tabular-nums text-muted-foreground md:col-span-1 md:row-start-auto"
                        >
                          {formatTimestamp(log.created_at)}
                        </time>
                        <ChevronRight
                          aria-hidden="true"
                          className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block"
                        />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                <div className="px-6 py-4 border-t bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> -{" "}
                    <span className="font-medium text-foreground">
                      {Math.min(page * limit, totalCount)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {totalCount.toLocaleString()}
                    </span>{" "}
                    logs
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!hasPrev || isFetching}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasNext || isFetching}
                    >
                      Next
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detail Log Dialog */}
          <LogDetailDialog logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

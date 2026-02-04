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
  AlertCircle,
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
import {
  useActivityLogs,
  useLogCounts,
  useLogsWithFilter,
} from "@/lib/hooks/queries/useLogsQuery";
import { LogDetailDialog } from "../../../components/logs/LogDetailDialog";
import { DateTimePicker24hForm } from "@/components/ui/datepickerhour";

type ActivityType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "other";

const getActivityIcon = (method: string) => {
  switch (method) {
    case "GET":
      return <MousePointerClick className="h-4 w-4" />;
    case "POST":
      return <Link2 className="h-4 w-4" />;
    case "PUT":
      return <Edit3 className="h-4 w-4" />;
    case "PATCH":
      return <Settings className="h-4 w-4" />;
    case "DELETE":
      return <Trash2 className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getActivityColor = (level: string, method: string) => {
  const levelLower = level.toLowerCase();
  if (levelLower === "error") return "bg-red-500/10 text-red-500";
  if (levelLower === "warning") return "bg-amber-500/10 text-amber-500";
  if (levelLower === "success" || method === "POST")
    return "bg-green-500/10 text-green-500";
  if (method === "DELETE") return "bg-red-500/10 text-red-500";
  if (method === "GET") return "bg-blue-500/10 text-blue-500";
  if (method === "PUT" || method === "PATCH")
    return "bg-amber-500/10 text-amber-500";
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
  } = useActivityLogs(page, limit, "created_at", "desc");

  const {
    data: filteredLogsData,
    isLoading: filteredLogsLoading,
    error: filteredLogsError,
  } = useLogsWithFilter(filterParams || { page: 1, limit: 20 });

  // Use filtered data if filter is active, otherwise use all logs
  const data = filterParams ? filteredLogsData : allLogsData;
  const isLoading = filterParams ? filteredLogsLoading : allLogsLoading;
  const error = filterParams ? filteredLogsError : allLogsError;

  const { data: countsData, isLoading: countsLoading } = useLogCounts();

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
  const totalAllCounts =
    getCounts + postCounts + putCounts + patchCounts + deleteCounts;

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

  const errorCount = logs.filter(
    (l) => l.level === "ERROR" || l.status_code >= 400,
  ).length;

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
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              History & Activity
            </h1>
            <p className="text-muted-foreground">
              Track all actions and events in your account.
            </p>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between gap-4">
            <Dialog
              open={showAdvancedFilter}
              onOpenChange={setShowAdvancedFilter}
            >
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {(hasActiveFilters || filter !== "all") && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      {Object.values(advancedFilters).filter((v) => v !== "")
                        .length + (filter !== "all" ? 1 : 0)}
                    </span>
                  )}
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Filter Logs
                  </DialogTitle>
                  <DialogDescription>
                    Narrow down your activity logs
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-5">
                  {/* User & Action */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="Filter by user..."
                        value={advancedFilters.username}
                        onChange={(e) => {
                          setAdvancedFilters({
                            ...advancedFilters,
                            username: e.target.value,
                          });
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">
                        Action
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., login..."
                        value={advancedFilters.action}
                        onChange={(e) => {
                          setAdvancedFilters({
                            ...advancedFilters,
                            action: e.target.value,
                          });
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* HTTP Details */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">
                        Route/Path
                      </label>
                      <input
                        type="text"
                        placeholder="/api/auth/login"
                        value={advancedFilters.route}
                        onChange={(e) => {
                          setAdvancedFilters({
                            ...advancedFilters,
                            route: e.target.value,
                          });
                          setPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1.5 block">
                          Level
                        </label>
                        <select
                          value={advancedFilters.level}
                          onChange={(e) => {
                            setAdvancedFilters({
                              ...advancedFilters,
                              level: e.target.value,
                            });
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                        <label className="text-xs font-medium mb-1.5 block">
                          Status
                        </label>
                        <input
                          type="number"
                          placeholder="200"
                          value={advancedFilters.status_code}
                          onChange={(e) => {
                            setAdvancedFilters({
                              ...advancedFilters,
                              status_code: e.target.value,
                            });
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1.5 block">
                          IP Address
                        </label>
                        <input
                          type="text"
                          placeholder="192.168.1.1"
                          value={advancedFilters.ip_address}
                          onChange={(e) => {
                            setAdvancedFilters({
                              ...advancedFilters,
                              ip_address: e.target.value,
                            });
                            setPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block">
                        From Date & Time
                      </label>
                      <DateTimePicker24hForm
                        value={advancedFilters.date_from ? new Date(advancedFilters.date_from) : undefined}
                        onChange={(date) => {
                          if (date) {
                            // Format dengan timezone offset (e.g., 2026-02-02T15:00:00+07:00)
                            const offset = -date.getTimezoneOffset();
                            const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
                            const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
                            const offsetSign = offset >= 0 ? '+' : '-';
                            
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const seconds = String(date.getSeconds()).padStart(2, '0');
                            
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
                                toast.error(
                                  "To date cleared because it was before from date",
                                );
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
                      <label className="text-xs font-medium mb-1.5 block">
                        To Date & Time
                      </label>
                      <DateTimePicker24hForm
                        disableBefore={advancedFilters.date_from ? new Date(advancedFilters.date_from) : undefined}
                        disabledPast2Dates={true}
                        value={advancedFilters.date_to ? new Date(advancedFilters.date_to) : undefined}
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
                            const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
                            const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
                            const offsetSign = offset >= 0 ? '+' : '-';
                            
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const seconds = String(date.getSeconds()).padStart(2, '0');
                            
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
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Active Filters Display */}
            {(hasActiveFilters || filter !== "all") && (
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Active:
                </span>
                <div className="flex gap-1.5">
                  {filter !== "all" && (
                    <Badge variant="default" className="gap-1.5">
                      {filter}
                      <button
                        type="button"
                        className="inline-flex items-center hover:opacity-70"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFilter("all");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {advancedFilters.username && (
                    <Badge variant="secondary" className="gap-1.5">
                      {advancedFilters.username}
                      <button
                        type="button"
                        className="inline-flex items-center hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAdvancedFilters({
                            ...advancedFilters,
                            username: "",
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {advancedFilters.action && (
                    <Badge variant="secondary" className="gap-1.5">
                      {advancedFilters.action}
                      <button
                        type="button"
                        className="inline-flex items-center hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAdvancedFilters({ ...advancedFilters, action: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {advancedFilters.level && (
                    <Badge variant="secondary" className="gap-1.5">
                      {advancedFilters.level}
                      <button
                        type="button"
                        className="inline-flex items-center hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAdvancedFilters({ ...advancedFilters, level: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {advancedFilters.status_code && (
                    <Badge variant="secondary" className="gap-1.5">
                      {advancedFilters.status_code}
                      <button
                        type="button"
                        className="inline-flex items-center hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAdvancedFilters({
                            ...advancedFilters,
                            status_code: "",
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {advancedFilters.date_from && (
                    <Badge variant="secondary" className="gap-1.5">
                      From: {new Date(advancedFilters.date_from).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      <button
                        type="button"
                        className="inline-flex items-center hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAdvancedFilters({
                            ...advancedFilters,
                            date_from: "",
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {advancedFilters.date_to && (
                    <Badge variant="secondary" className="gap-1.5">
                      To: {new Date(advancedFilters.date_to).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      <button
                        type="button"
                        className="inline-flex items-center hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAdvancedFilters({
                            ...advancedFilters,
                            date_to: "",
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Card */}
            <div
              className="rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Activity
                    </p>
                    <p className="text-2xl font-bold">
                      {countsLoading ? "..." : totalAllCounts.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                All HTTP requests logged
              </p>
            </div>

            {/* HTTP Methods Group */}
            <div className="md:col-span-2 rounded-2xl border bg-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                HTTP Methods
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    method: "GET",
                    count: getCounts,
                    icon: <MousePointerClick className="h-4 w-4" />,
                    color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
                    textColor: "text-blue-600 dark:text-blue-400",
                  },
                  {
                    method: "POST",
                    count: postCounts,
                    icon: <Link2 className="h-4 w-4" />,
                    color:
                      "from-green-500/10 to-green-500/5 border-green-500/20",
                    textColor: "text-green-600 dark:text-green-400",
                  },
                  {
                    method: "PUT",
                    count: putCounts,
                    icon: <Edit3 className="h-4 w-4" />,
                    color:
                      "from-amber-500/10 to-amber-500/5 border-amber-500/20",
                    textColor: "text-amber-600 dark:text-amber-400",
                  },
                  {
                    method: "PATCH",
                    count: patchCounts,
                    icon: <Settings className="h-4 w-4" />,
                    color:
                      "from-purple-500/10 to-purple-500/5 border-purple-500/20",
                    textColor: "text-purple-600 dark:text-purple-400",
                  },
                  {
                    method: "DELETE",
                    count: deleteCounts,
                    icon: <Trash2 className="h-4 w-4" />,
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
                    className={`rounded-lg border bg-gradient-to-br ${color} p-3 hover:shadow-md transition-all cursor-pointer group`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${textColor}`}>{icon}</div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {method}
                      </span>
                    </div>
                    <p className={`text-lg font-bold ${textColor}`}>
                      {countsLoading ? "..." : count.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-destructive">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Failed to load logs</p>
                <p className="text-sm text-muted-foreground">
                  Please try again later
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <History className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">No activity logs found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">
                          Action
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">
                          User
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">
                          Route
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">
                          Status
                        </th>
                        <th className="text-left p-4 font-semibold text-sm">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedLogId(log.id)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${getActivityColor(log.level, log.method)}`}
                              >
                                {getActivityIcon(log.method)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {log.action || log.message}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span className="font-mono font-semibold">
                                    {log.method}
                                  </span>
                                  <span>•</span>
                                  <span>{log.level}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-primary/10">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm">
                                {log.username || "Anonymous"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {log.route}
                            </code>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                log.status_code >= 200 && log.status_code < 300
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : log.status_code >= 400
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {log.status_code}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {formatTimestamp(log.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {(page - 1) * limit + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-medium text-foreground">
                      {Math.min(page * limit, totalCount)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {totalCount.toLocaleString()}
                    </span>{" "}
                    logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={!hasPrev || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!hasNext || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detail Log Dialog */}
          <LogDetailDialog
            logId={selectedLogId}
            onClose={() => setSelectedLogId(null)}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

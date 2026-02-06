"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import {
  useLoginAttemptsQuery,
  useRecentActivityQuery,
  useLoginAttemptDetailQuery,
} from "@/lib/hooks/queries/useLoginAttemptsQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconBrandChrome,
  IconBrandFirefox,
  IconBrandSafari,
  IconBrandEdge,
  IconClock,
  IconMapPin,
  IconAlertCircle,
  IconUser,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { SessionDetail } from "./session-detail";

export default function SessionTab() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load user role from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Fetch login attempts with pagination
  const {
    data: attemptsData,
    isLoading,
    refetch,
    isRefetching,
  } = useLoginAttemptsQuery({
    page,
    limit,
    sort: "created_at",
    order_by: "desc",
  });

  // Fetch recent activity summary
  const { data: recentActivity } = useRecentActivityQuery(isAdmin);

  // Fetch detail for selected attempt
  const { data: selectedAttempt, isLoading: isLoadingDetail } =
    useLoginAttemptDetailQuery(selectedId || "");

  // Helper function to parse user agent
  const parseUserAgent = (userAgent: string) => {
    const ua = userAgent.toLowerCase();

    // Detect browser
    let browser = "Unknown";
    let BrowserIcon = IconDeviceDesktop;
    if (ua.includes("chrome")) {
      browser = "Chrome";
      BrowserIcon = IconBrandChrome;
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      BrowserIcon = IconBrandFirefox;
    } else if (ua.includes("safari")) {
      browser = "Safari";
      BrowserIcon = IconBrandSafari;
    } else if (ua.includes("edge")) {
      browser = "Edge";
      BrowserIcon = IconBrandEdge;
    }

    // Detect device
    const isMobile =
      ua.includes("mobile") || ua.includes("android") || ua.includes("iphone");
    const DeviceIcon = isMobile ? IconDeviceMobile : IconDeviceDesktop;

    return { browser, isMobile, BrowserIcon, DeviceIcon };
  };

  // Format date to relative time
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <TabsContent value="session" className="space-y-4">
      {/* Recent Activity Summary Card */}
      {recentActivity && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Attempts (24h)</CardDescription>
              <CardTitle className="text-3xl">
                {recentActivity.total_attempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Successful</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {recentActivity.successful_attempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {recentActivity.failed_attempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique IPs</CardDescription>
              <CardTitle className="text-3xl">
                {recentActivity.unique_ips}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Login History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Login History</CardTitle>
              <CardDescription>
                Recent login attempts to your account
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <IconRefresh className={isRefetching ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : attemptsData && attemptsData.attempts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">
                        Device & Browser
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        IP Address
                      </TableHead>
                      <TableHead className="min-w-[120px]">Time</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Reason
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attemptsData.attempts.map((attempt) => {
                      const { browser, isMobile, BrowserIcon, DeviceIcon } =
                        parseUserAgent(attempt.user_agent);

                      return (
                        <TableRow
                          key={attempt.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedId(attempt.id);
                            setIsDetailOpen(true);
                          }}
                        >
                          <TableCell>
                            {attempt.success ? (
                              <Badge
                                variant="outline"
                                className="border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                              >
                                <IconCheck className="mr-1 h-3 w-3" />
                                Success
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-red-600 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                              >
                                <IconX className="mr-1 h-3 w-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                              <BrowserIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {browser} {isMobile ? "(Mobile)" : "(Desktop)"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                              {attempt.ip_address}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(attempt.created_at)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            <div className="truncate max-w-[200px]">
                              {attempt.fail_reason || "-"}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, attemptsData.total_count)} of{" "}
                  {attemptsData.total_count} attempts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!attemptsData.has_prev}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {attemptsData.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!attemptsData.has_next}
                  >
                    Next
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No login attempts found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Login Attempt</SheetTitle>
            <SheetDescription>Authentication attempt details</SheetDescription>
          </SheetHeader>

          {isLoadingDetail ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-3 mt-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : selectedAttempt ? (
            <SessionDetail attempt={selectedAttempt} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </SheetContent>
      </Sheet>
    </TabsContent>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useLoginAttemptsQuery,
  useRecentActivityQuery,
  useLoginAttemptDetailQuery,
} from "@/lib/hooks/queries/useLoginAttemptsQuery";
import {
  useRevokeAllSessionsMutation,
  useRevokeSessionMutation,
  useSessionsQuery,
} from "@/lib/hooks/queries/useProfileQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoginAttemptBadge } from "@/components/ui/app-status-badges";
import { Button } from "@/components/ui/button";
import {
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconBrandChrome,
  IconBrandFirefox,
  IconBrandSafari,
  IconBrandEdge,
  IconLogout,
  IconTrash,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SessionDetail } from "./session-detail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SessionTab() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [user] = useState<{ role: string } | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      return null;
    }
    try {
      return JSON.parse(savedUser) as { role: string };
    } catch {
      return null;
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    data: sessionsResponse,
    error: sessionsError,
    isLoading: sessionsLoading,
    isRefetching: sessionsRefetching,
    refetch: refetchSessions,
  } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeAllMutation = useRevokeAllSessionsMutation();

  const activeSessions = sessionsResponse?.data?.sessions ?? [];
  const activeSessionCount =
    sessionsResponse?.data?.total ?? activeSessions.length;

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
    if (ua.includes("edg")) {
      browser = "Edge";
      BrowserIcon = IconBrandEdge;
    } else if (ua.includes("chrome")) {
      browser = "Chrome";
      BrowserIcon = IconBrandChrome;
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      BrowserIcon = IconBrandFirefox;
    } else if (ua.includes("safari")) {
      browser = "Safari";
      BrowserIcon = IconBrandSafari;
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

  const handleRevokeSession = (sessionId: string) => {
    revokeSessionMutation.mutate(sessionId, {
      onSuccess: (response) => {
        const wasCurrent = response.data?.was_current;
        toast.success(
          wasCurrent ? "You've been signed out." : "Session signed out.",
        );

        if (wasCurrent) {
          setTimeout(() => router.push("/auth/login"), 800);
        } else {
          void refetchSessions();
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to sign out session",
        );
      },
    });
  };

  const handleRevokeAll = () => {
    revokeAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All active sessions have been signed out.");
        setTimeout(() => router.push("/auth/login"), 800);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to sign out active sessions",
        );
      },
    });
  };

  return (
    <TabsContent value="session" className="space-y-4">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Manage signed-in devices and review recent login activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:w-fit">
              <TabsTrigger value="active">
                Active sessions
                {!sessionsLoading && (
                  <span className="rounded-full bg-background/80 px-1.5 text-xs tabular-nums text-muted-foreground">
                    {activeSessionCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">Login history</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {sessionsLoading
                    ? "Loading devices signed in to your account"
                    : `${activeSessionCount} active ${activeSessionCount === 1 ? "session" : "sessions"} signed in to your account`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchSessions()}
                    disabled={sessionsRefetching}
                    aria-label="Refresh active sessions"
                  >
                    <IconRefresh
                      className={sessionsRefetching ? "animate-spin" : ""}
                    />
                    <span className="sr-only">Refresh active sessions</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={
                          revokeAllMutation.isPending ||
                          sessionsLoading ||
                          activeSessionCount === 0
                        }
                      >
                        <IconTrash />
                        {activeSessionCount === 1
                          ? "Sign out"
                          : "Sign out all devices"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {activeSessionCount === 1
                            ? "Sign out of this session?"
                            : "Sign out of all devices?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will end {activeSessionCount} active{" "}
                          {activeSessionCount === 1 ? "session" : "sessions"},
                          including your current session. You&apos;ll need to
                          sign in again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60"
                          onClick={handleRevokeAll}
                        >
                          Sign out{" "}
                          {activeSessionCount === 1 ? "session" : "all"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {sessionsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : sessionsError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {sessionsError instanceof Error
                    ? sessionsError.message
                    : "Failed to load active sessions"}
                </div>
              ) : activeSessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {activeSessions.map((session) => {
                    const { browser, BrowserIcon, isMobile } = parseUserAgent(
                      session.user_agent,
                    );

                    return (
                      <div
                        key={session.session_id}
                        className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <BrowserIcon className="size-5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium">
                                {browser}{" "}
                                {isMobile ? "(Mobile)" : "(Desktop)"}
                              </p>
                              {session.is_current && (
                                <span className="rounded-full bg-green-600/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-600">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {session.ip_address} · last seen{" "}
                              {formatDate(session.last_seen)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full shrink-0 sm:w-auto"
                          onClick={() =>
                            handleRevokeSession(session.session_id)
                          }
                          disabled={revokeSessionMutation.isPending}
                        >
                          <IconLogout />
                          Sign out
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                  No active sessions found.
                </p>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-4">
              {recentActivity && (
                <div className="grid grid-cols-2 overflow-hidden rounded-lg border md:grid-cols-4">
                  <div className="border-b border-r p-3 md:border-b-0">
                    <p className="text-xs text-muted-foreground">
                      Attempts (24h)
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {recentActivity.total_attempts}
                    </p>
                  </div>
                  <div className="border-b p-3 md:border-b-0 md:border-r">
                    <p className="text-xs text-muted-foreground">Successful</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-green-600">
                      {recentActivity.successful_attempts}
                    </p>
                  </div>
                  <div className="border-r p-3">
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-red-600">
                      {recentActivity.failed_attempts}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Unique IPs</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                      {recentActivity.unique_ips}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Recent login attempts</p>
                  <p className="text-xs text-muted-foreground">
                    Select an attempt to inspect its details.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <IconRefresh
                    className={isRefetching ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              ) : attemptsData && attemptsData.attempts.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">
                            Status
                          </TableHead>
                          <TableHead className="min-w-[180px]">
                            Device & Browser
                          </TableHead>
                          <TableHead className="hidden min-w-[120px] sm:table-cell">
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
                          const {
                            browser,
                            isMobile,
                            BrowserIcon,
                            DeviceIcon,
                          } = parseUserAgent(attempt.user_agent);

                          return (
                            <TableRow
                              key={attempt.id}
                              className="cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() => {
                                setSelectedId(attempt.id);
                                setIsDetailOpen(true);
                              }}
                            >
                              <TableCell>
                                <LoginAttemptBadge success={attempt.success} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <DeviceIcon className="size-4 text-muted-foreground" />
                                  <BrowserIcon className="size-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {browser}{" "}
                                    {isMobile ? "(Mobile)" : "(Desktop)"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                  {attempt.ip_address}
                                </code>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(attempt.created_at)}
                              </TableCell>
                              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                                <div className="max-w-[200px] truncate">
                                  {attempt.fail_reason || "-"}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="hidden text-sm text-muted-foreground sm:block">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, attemptsData.total_count)} of{" "}
                      {attemptsData.total_count} attempts
                    </div>
                    <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        disabled={!attemptsData.has_prev}
                      >
                        <IconChevronLeft className="size-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      <span className="text-sm">
                        {page} / {attemptsData.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((value) => value + 1)}
                        disabled={!attemptsData.has_next}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <IconChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No login attempts found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
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

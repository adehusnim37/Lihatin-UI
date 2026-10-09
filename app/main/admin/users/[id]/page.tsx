"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconClockHour4,
  IconCrown,
  IconFilter,
  IconLink,
  IconMail,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconUserCircle,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PremiumEventActionBadge,
  PremiumStateBadge,
  RevokeTypeBadge,
  RoleBadge,
  ActiveInactiveBadge,
  EnabledDisabledBadge,
  LoginAttemptBadge,
  AccountHistoryActionBadge,
} from "@/components/ui/app-status-badges";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  hasActivePremiumAccess,
  type AdminUserResponse,
  type AdminUserShortLinkResponse,
  type AdminUserShortLinkSort,
} from "@/lib/api/auth";
import {
  useAdminPremiumAccessEventsQuery,
  useAdminUserDetailQuery,
  useAdminUserShortLinksQuery,
} from "@/lib/hooks/queries/useAdminQuery";
import { toast } from "sonner";

type AuditHistoryView = "premium" | "account" | "login";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = decodeURIComponent(String(params.id ?? ""));
  const [auditView, setAuditView] = useState<AuditHistoryView>("premium");
  const [roleFromStorage, setRoleFromStorage] = useState<string | null | undefined>(undefined);
  const [copiedId, setCopiedId] = useState(false);
  const [shortsPage, setShortsPage] = useState(1);
  const [shortsLimit, setShortsLimit] = useState(10);
  const [shortsSort, setShortsSort] = useState<AdminUserShortLinkSort>("created_at");
  const [shortsOrder, setShortsOrder] = useState<"asc" | "desc">("desc");
  const [shortsSearchInput, setShortsSearchInput] = useState("");
  const [shortsSearch, setShortsSearch] = useState("");
  const [isShortsSectionOpen, setIsShortsSectionOpen] = useState(true);
  const isAdmin = roleFromStorage && isAdminRole(roleFromStorage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoleFromStorage(getStoredRole());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCopiedId(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShortsPage(1);
      setShortsSearchInput("");
      setShortsSearch("");
    }, 0);
    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShortsSearch(shortsSearchInput.trim());
      setShortsPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [shortsSearchInput]);

  const detailQuery = useAdminUserDetailQuery(userId, Boolean(userId));
  const eventsQuery = useAdminPremiumAccessEventsQuery(userId, Boolean(userId));
  const userShortsQuery = useAdminUserShortLinksQuery({
    userId,
    enabled: Boolean(userId),
    page: shortsPage,
    limit: shortsLimit,
    sort: shortsSort,
    orderBy: shortsOrder,
    detail: true,
    search: shortsSearch || undefined,
  });

  const user = detailQuery.data;
  const events = useMemo(() => eventsQuery.data?.items ?? [], [eventsQuery.data?.items]);
  const userShorts = useMemo(
    () => userShortsQuery.data?.short_links ?? [],
    [userShortsQuery.data?.short_links],
  );
  const recentHistory = useMemo(() => user?.recent_history ?? [], [user?.recent_history]);
  const recentLoginAttempts = useMemo(
    () => user?.recent_login_attempts ?? [],
    [user?.recent_login_attempts],
  );
  const activityGraphData = useMemo(
    () =>
      buildUserActivityGraphData(
        events.map((event) => event.created_at),
        recentHistory.map((item) => item.changed_at),
        recentLoginAttempts.map((item) => item.created_at),
      ),
    [events, recentHistory, recentLoginAttempts],
  );

  const eventStats = useMemo(() => {
    const total = events.length;
    const revoked = events.filter((item) => item.action === "revoke").length;
    const reactivated = events.filter((item) => item.action === "reactivate").length;
    const permanent = events.filter((item) => item.revoke_type === "permanent").length;
    return { total, revoked, reactivated, permanent };
  }, [events]);

  const shortPagination = useMemo(() => {
    const totalPages = userShortsQuery.data?.total_pages ?? 1;
    const safeTotalPages = totalPages > 0 ? totalPages : 1;
    return {
      totalCount: userShortsQuery.data?.total_count ?? 0,
      totalPages: safeTotalPages,
      hasPrevious: shortsPage > 1,
      hasNext: shortsPage < safeTotalPages,
    };
  }, [userShortsQuery.data?.total_count, userShortsQuery.data?.total_pages, shortsPage]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="mx-auto flex w-full min-w-0 max-w-[1328px] flex-1 flex-col gap-6 p-4 sm:p-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">User detail</h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Review account identity, security, links, and recent activity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-11 sm:h-10"
                onClick={() => {
                  router.push("/main/admin/users");
                }}
              >
                <IconArrowLeft />
                Back to users
              </Button>
              <Button
                variant="outline"
                className="h-11 sm:h-10"
                onClick={() => {
                  void detailQuery.refetch();
                  void eventsQuery.refetch();
                  void userShortsQuery.refetch();
                }}
                disabled={detailQuery.isLoading || detailQuery.isFetching}
              >
                <IconRefresh className={detailQuery.isFetching ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </header>

          {(typeof roleFromStorage === "undefined" || detailQuery.isLoading) && <PageSkeleton />}

          {typeof roleFromStorage !== "undefined" && !isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>
                  This page is available only for admin and super admin roles.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" && detailQuery.isError && (
            <Card>
              <CardHeader>
                <CardTitle>User could not be loaded</CardTitle>
                <CardDescription>
                  Refresh this account file or return to the directory.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" &&
            !detailQuery.isLoading &&
            !detailQuery.isError &&
            isAdmin &&
            user && (
              <>
                <Card className="overflow-hidden py-0 shadow-none">
                  <CardContent className="p-0">
                    <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start md:px-6">
                      <div className="flex min-w-0 items-start gap-4">
                        <Avatar className="size-14 border">
                          {user.avatar ? (
                            <AvatarImage
                              src={user.avatar}
                              alt={`${user.first_name} ${user.last_name}`}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary-ink">
                            {getInitials(
                              `${user.first_name} ${user.last_name}`.trim() || user.username,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="break-words text-xl font-semibold tracking-tight">
                              {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                                user.username}
                            </h2>
                            <RoleBadge role={user.role} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
                          <div className="mt-3 flex min-w-0 items-center gap-2 text-sm">
                            <IconMail className="size-4 shrink-0 text-muted-foreground" />
                            <span className="break-all sm:truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
                        <PremiumStateBadge
                          isPremium={hasActivePremiumAccess(user.premium_access)}
                          isRevoked={isUserCurrentlyRevoked(user)}
                        />
                        <ActiveInactiveBadge
                          isActive={user.account_status === "active"}
                          activeLabel="Account active"
                          inactiveLabel={
                            user.account_status === "locked" ? "Admin locked" : "Account disabled"
                          }
                        />
                        <EnabledDisabledBadge
                          enabled={Boolean(user.user_auth?.is_email_verified)}
                          enabledLabel="Email verified"
                          disabledLabel="Email unverified"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t bg-muted/15 xl:grid-cols-4">
                      <CaseFileField
                        label="User ID"
                        valueNode={
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="break-all font-mono text-xs">{user.id}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 shrink-0 sm:size-8"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(user.id);
                                  setCopiedId(true);
                                  toast.success("User ID copied");
                                  window.setTimeout(() => setCopiedId(false), 2000);
                                } catch {
                                  toast.error("User ID could not be copied");
                                }
                              }}
                              aria-label="Copy user ID"
                            >
                              {copiedId ? (
                                <IconCheck className="size-3" />
                              ) : (
                                <IconCopy className="size-3" />
                              )}
                            </Button>
                          </div>
                        }
                      />
                      <CaseFileField
                        label="Account created"
                        value={formatDateTime(user.created_at)}
                      />
                      <CaseFileField
                        label="Last profile update"
                        value={formatDateTime(user.updated_at)}
                      />
                      <CaseFileField
                        label="Latest access change"
                        value={formatDateTime(
                          getLatestTimestamp([
                            user.account_status_changed_at,
                            user.premium_access?.status_changed_at,
                          ]),
                        )}
                      />
                    </div>

                    {(user.account_status === "locked" ||
                      isUserCurrentlyRevoked(user) ||
                      user.account_status_reason) && (
                      <div className="grid gap-3 border-t px-5 py-4 text-sm md:grid-cols-2 md:px-6">
                        <InfoLine
                          label="Lock reason"
                          value={user.account_status_reason || "No lock reason recorded"}
                        />
                        <InfoLine
                          label="Premium access reason"
                          value={
                            user.premium_access?.status_reason ||
                            "No premium access reason recorded"
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="min-w-0 gap-6">
                  <TabsList
                    aria-label="User detail sections"
                    className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0"
                  >
                    <TabsTrigger
                      value="overview"
                      className="min-h-11 flex-1 rounded-none border-b-2 border-transparent px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:flex-none"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="links"
                      className="min-h-11 flex-1 rounded-none border-b-2 border-transparent px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:flex-none"
                    >
                      Short links
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="min-h-11 flex-1 rounded-none border-b-2 border-transparent px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:flex-none"
                    >
                      Activity
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="min-w-0 space-y-6">
                    <Card className="overflow-hidden py-0 shadow-none">
                      <CardHeader className="px-5 pt-5 md:px-6">
                        <div className="flex items-start gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary-ink">
                            <IconShieldCheck className="size-4.5" />
                          </div>
                          <div>
                            <CardTitle>Account security</CardTitle>
                            <CardDescription className="mt-1">
                              Authentication controls and recent login information.
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-6 px-5 pb-5 pt-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:px-6">
                        <div className="min-w-0 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <EnabledDisabledBadge
                              enabled={Boolean(user.user_auth?.totp_enabled)}
                              enabledLabel="TOTP enabled"
                              disabledLabel="TOTP disabled"
                            />
                            <ActiveInactiveBadge
                              isActive={user.user_auth?.account_status === "active"}
                              activeLabel="Account active"
                              inactiveLabel={
                                user.user_auth?.account_status === "locked"
                                  ? "Admin locked"
                                  : "Account disabled"
                              }
                            />
                            {isLockoutActive(user.user_auth?.login_blocked_until) ? (
                              <StatusBadge tone="danger">TEMP LOGIN BLOCK ACTIVE</StatusBadge>
                            ) : (
                              <StatusBadge tone="neutral">TEMP LOGIN BLOCK CLEAR</StatusBadge>
                            )}
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <AuthMetricItem
                              label="Failed attempts"
                              value={String(user.user_auth?.failed_login_attempts ?? 0)}
                              emphasize={Boolean((user.user_auth?.failed_login_attempts ?? 0) > 0)}
                            />
                            <AuthMetricItem
                              label="Last login"
                              value={formatDateTime(user.user_auth?.last_login_at)}
                            />
                            <AuthMetricItem
                              label="Temporary login block until"
                              value={formatDateTime(user.user_auth?.login_blocked_until)}
                            />
                            <AuthMetricItem
                              label="Last IP"
                              value={user.user_auth?.last_ip || "-"}
                              mono
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <StatBox label="API keys" value={user.stats?.api_keys_total ?? 0} />
                          <StatBox label="Active keys" value={user.stats?.api_keys_active ?? 0} />
                          <StatBox
                            label="Account events"
                            value={user.stats?.history_events_total ?? 0}
                          />
                          <StatBox
                            label="Premium events"
                            value={user.stats?.premium_access_events_total ?? 0}
                          />
                          <StatBox
                            label="Login attempts · 24h"
                            value={user.stats?.login_attempts_24h ?? 0}
                          />
                          <StatBox
                            label="Login attempts · 7d"
                            value={user.stats?.login_attempts_7d ?? 0}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none">
                      <CardHeader>
                        <CardTitle>Sign-in methods</CardTitle>
                        <CardDescription>
                          Registered authentication methods for this user.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!user.auth_methods || user.auth_methods.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No auth methods available.
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {user.auth_methods.map((method) => (
                              <li
                                key={method.id}
                                className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div className="min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {method.friendly_name || method.type.toUpperCase()}
                                    </span>
                                    <EnabledDisabledBadge enabled={method.is_enabled} />
                                    <EnabledDisabledBadge
                                      enabled={method.is_verified}
                                      enabledLabel="Verified"
                                      disabledLabel="Unverified"
                                    />
                                  </div>
                                  {method.friendly_name && (
                                    <p className="text-xs text-muted-foreground">
                                      {method.type.toUpperCase()}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0 text-xs sm:text-right">
                                  <p className="text-muted-foreground">Last used</p>
                                  <p className="mt-1 tabular-nums">
                                    {formatDateTime(method.last_used_at)}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="links" className="min-w-0">
                    <Card className="min-w-0 shadow-none">
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              <IconLink className="size-5 text-primary-ink" />
                              Short links
                            </CardTitle>
                            <CardDescription>
                              Browse and search short links created by this user.
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            className="h-11 sm:h-10"
                            aria-expanded={isShortsSectionOpen}
                            aria-controls="user-short-links"
                            onClick={() => setIsShortsSectionOpen((previous) => !previous)}
                          >
                            {isShortsSectionOpen ? (
                              <IconChevronUp className="mr-2 size-4" />
                            ) : (
                              <IconChevronDown className="mr-2 size-4" />
                            )}
                            {isShortsSectionOpen ? "Collapse" : "Expand"}
                          </Button>
                        </div>
                      </CardHeader>

                      {isShortsSectionOpen ? (
                        <CardContent id="user-short-links" className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatBox label="Total Links" value={shortPagination.totalCount} />
                            <StatBox label="Showing" value={userShorts.length} />
                            <StatBox
                              label="Active on this page"
                              value={userShorts.filter((item) => item.is_active).length}
                            />
                            <StatBox
                              label="Banned on this page"
                              value={userShorts.filter((item) => item.detail?.is_banned).length}
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px] lg:grid-cols-[minmax(0,1fr)_190px_140px]">
                            <div className="relative sm:col-span-2 lg:col-span-1">
                              <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                aria-label="Search user short links"
                                value={shortsSearchInput}
                                maxLength={100}
                                onChange={(event) => setShortsSearchInput(event.target.value)}
                                placeholder="Search short code, title, description, or URL..."
                                className="h-11 pl-9 sm:h-10"
                              />
                            </div>

                            <Select
                              value={`${shortsSort}:${shortsOrder}`}
                              onValueChange={(value) => {
                                const [nextSort, nextOrder] = value.split(":");
                                setShortsSort(nextSort as AdminUserShortLinkSort);
                                setShortsOrder(nextOrder as "asc" | "desc");
                                setShortsPage(1);
                              }}
                            >
                              <SelectTrigger
                                aria-label="Sort links"
                                className="h-11 w-full sm:h-10"
                              >
                                <SelectValue placeholder="Sort links" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="created_at:desc">Newest links</SelectItem>
                                <SelectItem value="created_at:asc">Oldest links</SelectItem>
                                <SelectItem value="short_code:asc">Short code A–Z</SelectItem>
                                <SelectItem value="title:asc">Title A–Z</SelectItem>
                                <SelectItem value="is_active:desc">Active first</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={String(shortsLimit)}
                              onValueChange={(value) => {
                                setShortsLimit(Number(value));
                                setShortsPage(1);
                              }}
                            >
                              <SelectTrigger aria-label="Page size" className="h-11 w-full sm:h-10">
                                <SelectValue placeholder="Page size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {userShortsQuery.isLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-16 w-full" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                          ) : userShortsQuery.isError ? (
                            <p className="text-sm text-muted-foreground">
                              Failed to load user short links.
                            </p>
                          ) : userShorts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {shortsSearch
                                ? "No short links match your search."
                                : "No short links found for this user."}
                            </p>
                          ) : (
                            <div className="min-w-0 overflow-hidden rounded-xl border">
                              <Table
                                aria-label="User short links"
                                className="block w-full lg:table lg:table-fixed"
                              >
                                <TableHeader className="hidden lg:table-header-group">
                                  <TableRow>
                                    <TableHead>Short Code</TableHead>
                                    <TableHead>Original URL</TableHead>
                                    <TableHead className="w-24">Status</TableHead>
                                    <TableHead className="w-28">Clicks</TableHead>
                                    <TableHead className="w-36">Created</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="block lg:table-row-group">
                                  {userShorts.map((short) => (
                                    <TableRow
                                      key={short.id}
                                      className="grid grid-cols-2 gap-3 p-4 lg:table-row lg:p-0"
                                    >
                                      <TableCell className="col-span-2 min-w-0 whitespace-normal p-0 align-top lg:p-3">
                                        <div className="space-y-1">
                                          <p className="font-mono text-[15px] font-semibold leading-tight">
                                            /{short.short_code}
                                          </p>
                                          <p className="text-xs text-muted-foreground line-clamp-1">
                                            {short.title || short.description || "-"}
                                          </p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="col-span-2 min-w-0 whitespace-normal p-0 align-top lg:p-3">
                                        <a
                                          href={short.original_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="block break-all text-sm text-foreground hover:text-primary-ink hover:underline"
                                          title={short.original_url}
                                        >
                                          {short.original_url}
                                        </a>
                                      </TableCell>
                                      <TableCell className="min-w-0 whitespace-normal p-0 align-top lg:p-3">
                                        <span className="mb-1 block text-xs text-muted-foreground lg:hidden">
                                          Status
                                        </span>
                                        {renderShortLinkStatusBadge(short)}
                                      </TableCell>
                                      <TableCell className="min-w-0 whitespace-normal p-0 align-top lg:p-3">
                                        <div className="space-y-1">
                                          <span className="block text-xs text-muted-foreground lg:hidden">
                                            Clicks
                                          </span>
                                          <p className="text-sm font-semibold">
                                            {short.detail?.current_clicks ?? 0}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Limit: {short.detail?.click_limit ?? "Unlimited"}
                                          </p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="col-span-2 whitespace-normal p-0 align-top text-xs text-muted-foreground lg:p-3">
                                        <span className="mr-2 lg:hidden">Created</span>
                                        {formatDateTime(short.created_at)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            <p className="text-muted-foreground">
                              Page {shortsPage} of {shortPagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  !shortPagination.hasPrevious || userShortsQuery.isFetching
                                }
                                onClick={() =>
                                  setShortsPage((previous) => Math.max(1, previous - 1))
                                }
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!shortPagination.hasNext || userShortsQuery.isFetching}
                                onClick={() =>
                                  setShortsPage((previous) =>
                                    Math.min(shortPagination.totalPages, previous + 1),
                                  )
                                }
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      ) : null}
                    </Card>
                  </TabsContent>
                  <TabsContent value="activity" className="min-w-0 space-y-6">
                    {!eventsQuery.isLoading && activityGraphData.length === 0 ? (
                      <div className="rounded-xl border p-5 sm:p-6">
                        <h2 className="font-semibold">Account activity</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          No recent account activity is available.
                        </p>
                      </div>
                    ) : (
                      <ChartAreaInteractive
                        data={activityGraphData}
                        isLoading={eventsQuery.isLoading}
                        title="Account activity"
                        description="Combined login, account-change, and premium lifecycle events over time."
                        mobileDescription="Account event trend"
                        valueLabel="Events"
                        emptyMessage="No recent account activity is available."
                        curveType="step"
                      />
                    )}

                    <Card className="min-w-0 shadow-none">
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle>Audit History</CardTitle>
                            <CardDescription>
                              {auditView === "premium"
                                ? "Premium lifecycle timeline."
                                : auditView === "account"
                                  ? "Account change timeline."
                                  : "Login security timeline."}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <IconFilter className="mr-2 size-4" />
                                {getAuditViewLabel(auditView)}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setAuditView("premium")}>
                                <IconCrown className="mr-2 size-4" />
                                Premium Lifecycle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAuditView("account")}>
                                <IconArrowRight className="mr-2 size-4" />
                                Account Changes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAuditView("login")}>
                                <IconUserCircle className="mr-2 size-4" />
                                Login Security
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {auditView === "premium" && (
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            <StatBox label="Total" value={eventStats.total} />
                            <StatBox label="Revoke" value={eventStats.revoked} />
                            <StatBox label="Reactivate" value={eventStats.reactivated} />
                            <StatBox label="Permanent" value={eventStats.permanent} />
                          </div>
                        )}

                        <Separator />

                        {auditView === "premium" ? (
                          eventsQuery.isLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-20 w-full" />
                            </div>
                          ) : events.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No premium events found.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {events.map((event) => (
                                <div key={event.id} className="border-b py-4 last:border-b-0">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <PremiumEventActionBadge action={event.action} />
                                      <div className="flex items-center gap-1.5 rounded-md border border-dashed bg-muted/10 p-1">
                                        <StatusBadge
                                          tone={getStatusTone(event.old_status)}
                                          className="text-muted-foreground"
                                        >
                                          {event.old_status.toLocaleUpperCase()}
                                        </StatusBadge>
                                        <IconArrowRight className="size-3 text-muted-foreground" />
                                        <StatusBadge tone={getStatusTone(event.new_status)}>
                                          {event.new_status.toLocaleUpperCase()}
                                        </StatusBadge>
                                      </div>
                                      <RevokeTypeBadge
                                        revokeType={event.revoke_type?.toUpperCase()}
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(event.created_at)}
                                    </p>
                                  </div>
                                  <p className="mt-2 text-sm">
                                    {event.reason || "No reason provided."}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )
                        ) : auditView === "account" ? (
                          recentHistory.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No account history found.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {recentHistory.map((item) => (
                                <div key={item.id} className="border-b py-4 last:border-b-0">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <AccountHistoryActionBadge action={item.action_type} />
                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(item.changed_at)}
                                    </p>
                                  </div>
                                  <p className="mt-2 text-sm">
                                    {item.reason || "No reason provided."}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground break-all">
                                    {item.changed_by ? shortenID(item.changed_by) : "system"} | IP:{" "}
                                    {item.ip_address || "-"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )
                        ) : recentLoginAttempts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No login attempts found.</p>
                        ) : (
                          <div className="space-y-2">
                            {recentLoginAttempts.map((item) => (
                              <div key={item.id} className="border-b py-4 last:border-b-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <LoginAttemptBadge success={item.success} />
                                  <div className="text-right text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1 justify-end">
                                      <IconClockHour4 className="size-3.5" />
                                      <span>{formatDateTime(item.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm break-all">{item.email_or_username}</p>
                                <p className="mt-1 text-xs text-muted-foreground break-words">
                                  IP: {item.ip_address} | UA: {item.user_agent || "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function CaseFileField({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="min-w-0 border-b px-5 py-3 first:col-span-2 last:col-span-2 last:border-b-0 [&:nth-child(2)]:border-r xl:col-span-1 xl:first:col-span-1 xl:last:col-span-1 xl:border-b-0 xl:border-r xl:last:border-r-0 md:px-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 min-w-0 text-sm font-medium">{valueNode ?? value ?? "-"}</div>
    </div>
  );
}

function getInitials(value: string): string {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function getLatestTimestamp(values: Array<string | null | undefined>): string | null {
  const validValues = values.filter((value): value is string => {
    if (!value) return false;
    return !Number.isNaN(new Date(value).getTime());
  });
  if (validValues.length === 0) return null;
  return validValues.reduce((latest, value) =>
    new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
  );
}

function buildUserActivityGraphData(...dateGroups: string[][]) {
  const timestamps = dateGroups
    .flat()
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));

  if (timestamps.length === 0) return [];

  const referenceDate = new Date(Math.max(...timestamps.map((value) => value.getTime())));
  referenceDate.setUTCHours(0, 0, 0, 0);
  const startDate = new Date(referenceDate);
  startDate.setUTCDate(startDate.getUTCDate() - 89);

  const counts = new Map<string, number>();
  timestamps.forEach((value) => {
    const key = value.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      count: counts.get(key) ?? 0,
    };
  });
}

function InfoLine({
  label,
  value,
  valueNode,
  truncate,
  inline = false,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
  truncate?: boolean;
  inline?: boolean;
}) {
  const renderedValue = valueNode ?? (
    <span className={truncate ? "break-all" : ""}>{value ?? "-"}</span>
  );

  if (inline) {
    return (
      <p className="text-sm">
        <span className="text-muted-foreground">{label}: </span>
        <span className="inline-flex items-center align-middle">{renderedValue}</span>
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={truncate ? "text-sm break-all" : "text-sm"}>{renderedValue}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 border-b py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function AuthMetricItem({
  label,
  value,
  mono = false,
  emphasize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0 border-b pb-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={[
          "mt-1 text-sm break-words",
          mono ? "font-mono break-all" : "",
          emphasize ? "font-semibold text-destructive" : "font-medium",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function isUserCurrentlyRevoked(user: AdminUserResponse): boolean {
  return user.premium_access?.status === "revoked";
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortenID(value: string): string {
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function getAuditViewLabel(view: AuditHistoryView): string {
  if (view === "premium") return "Premium Lifecycle";
  if (view === "account") return "Account Changes";
  return "Login Security";
}

function PageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-full max-w-72" />
        <Skeleton className="h-4 w-full max-w-96" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { role?: string };
    if (!parsed.role) return null;
    const normalized = parsed.role.trim().toLowerCase();
    return normalized || null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return normalized === "admin" || normalized === "super_admin";
}

function getStatusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "premium" || s === "active") return "success";
  if (s === "revoked" || s === "banned" || s === "inactive") return "danger";
  if (s === "free") return "sky";
  return "warning";
}

function renderShortLinkStatusBadge(short: AdminUserShortLinkResponse) {
  if (short.detail?.is_banned) {
    return <StatusBadge tone="danger">BANNED</StatusBadge>;
  }

  if (short.is_active) {
    return <StatusBadge tone="success">ACTIVE</StatusBadge>;
  }

  return <StatusBadge tone="neutral">INACTIVE</StatusBadge>;
}

function isLockoutActive(lockoutUntil?: string | null): boolean {
  if (!lockoutUntil) return false;
  const parsed = new Date(lockoutUntil).getTime();
  if (Number.isNaN(parsed)) return false;
  return parsed > Date.now();
}

function getHistoryActionTone(action: string) {
  const normalized = action.toLowerCase();
  // Check unlock/reactivate first to avoid conflict with lock/revoke
  if (normalized.includes("unlock") || normalized.includes("reactivate")) return "success";
  if (normalized.includes("revoke") || normalized.includes("lock")) return "danger";
  if (normalized.includes("verification") || normalized.includes("change")) return "warning";
  return "neutral";
}

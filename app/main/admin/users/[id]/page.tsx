"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconClockHour4,
  IconCrown,
  IconFilter,
  IconFingerprint,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  type AdminUserShortLinkResponse,
  type AdminUserShortLinkSort,
} from "@/lib/api/auth";
import {
  useAdminPremiumStatusEventsQuery,
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
  const [roleFromStorage, setRoleFromStorage] = useState<
    string | null | undefined
  >(undefined);
  const [copiedId, setCopiedId] = useState(false);
  const [shortsPage, setShortsPage] = useState(1);
  const [shortsLimit, setShortsLimit] = useState(10);
  const [shortsSort, setShortsSort] =
    useState<AdminUserShortLinkSort>("created_at");
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
  const eventsQuery = useAdminPremiumStatusEventsQuery(userId, Boolean(userId));
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
  const events = useMemo(
    () => eventsQuery.data?.items ?? [],
    [eventsQuery.data?.items],
  );
  const userShorts = useMemo(
    () => userShortsQuery.data?.short_links ?? [],
    [userShortsQuery.data?.short_links],
  );
  const recentHistory = useMemo(
    () => user?.recent_history ?? [],
    [user?.recent_history],
  );
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
    const reactivated = events.filter(
      (item) => item.action === "reactivate",
    ).length;
    const permanent = events.filter(
      (item) => item.revoke_type === "permanent",
    ).length;
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
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <IconFingerprint className="size-3.5" />
                Account file
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                User detail
              </h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Identity, access posture, owned links, and the audit record in
                one operational view.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/main/admin/users");
                  }
                }}
              >
                <IconArrowLeft />
                Back to users
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void detailQuery.refetch();
                  void eventsQuery.refetch();
                  void userShortsQuery.refetch();
                }}
                disabled={detailQuery.isLoading || detailQuery.isFetching}
              >
                <IconRefresh
                  className={
                    detailQuery.isFetching ? "animate-spin" : ""
                  }
                />
                Refresh
              </Button>
            </div>
          </header>

          {(typeof roleFromStorage === "undefined" ||
            detailQuery.isLoading) && <PageSkeleton />}

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
                <Card className="overflow-hidden py-0">
                  <CardContent className="p-0">
                    <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start md:px-6">
                      <div className="flex min-w-0 items-start gap-4">
                        <Avatar className="size-14 border">
                          {user.avatar ? (
                            <AvatarImage
                              src={user.avatar}
                              alt={`${user.first_name} ${user.last_name}`}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(
                              `${user.first_name} ${user.last_name}`.trim() ||
                                user.username,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-semibold tracking-tight">
                              {[user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(" ") || user.username}
                            </h2>
                            <RoleBadge role={user.role} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                          <div className="mt-3 flex min-w-0 items-center gap-2 text-sm">
                            <IconMail className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
                        <PremiumStateBadge
                          isPremium={user.is_premium}
                          isRevoked={isUserCurrentlyRevoked(user)}
                        />
                        <ActiveInactiveBadge
                          isActive={!user.is_locked}
                          activeLabel="Unlocked"
                          inactiveLabel="Locked"
                        />
                        <EnabledDisabledBadge
                          enabled={Boolean(user.user_auth?.is_email_verified)}
                          enabledLabel="Email verified"
                          disabledLabel="Email unverified"
                        />
                      </div>
                    </div>

                    <div className="grid border-t bg-muted/15 sm:grid-cols-2 xl:grid-cols-4">
                      <CaseFileField
                        label="User ID"
                        valueNode={
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-mono text-xs">
                              {user.id}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(user.id);
                                  setCopiedId(true);
                                  toast.success("User ID copied");
                                  window.setTimeout(
                                    () => setCopiedId(false),
                                    2000,
                                  );
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
                            user.locked_at,
                            user.premium_revoked_at,
                            user.premium_reactivated_at,
                          ]),
                        )}
                      />
                    </div>

                    {(user.is_locked ||
                      isUserCurrentlyRevoked(user) ||
                      user.locked_reason) && (
                      <div className="grid gap-3 border-t px-5 py-4 text-sm md:grid-cols-2 md:px-6">
                        <InfoLine
                          label="Lock reason"
                          value={user.locked_reason || "No lock reason recorded"}
                        />
                        <InfoLine
                          label="Premium status reason"
                          value={
                            user.premium_revoked_reason ||
                            user.premium_reactivated_reason ||
                            "No premium status reason recorded"
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

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

                <Card className="overflow-hidden py-0">
                  <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <IconShieldCheck className="size-4.5" />
                      </div>
                      <div>
                        <CardTitle>Authentication posture</CardTitle>
                        <CardDescription className="mt-1">
                          Current controls, recent login state, and account
                          counters.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] md:px-6">
                    <div className="rounded-xl border bg-muted/15 p-4 sm:p-5">
                      <div className="flex flex-wrap gap-2">
                        <EnabledDisabledBadge
                          enabled={Boolean(user.user_auth?.is_totp_enabled)}
                          enabledLabel="TOTP enabled"
                          disabledLabel="TOTP disabled"
                        />
                        <ActiveInactiveBadge
                          isActive={Boolean(user.user_auth?.is_active)}
                          activeLabel="Auth active"
                          inactiveLabel="Auth inactive"
                        />
                        {isLockoutActive(user.user_auth?.lockout_until) ? (
                          <StatusBadge tone="danger">LOCKOUT ACTIVE</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">LOCKOUT CLEAR</StatusBadge>
                        )}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <AuthMetricItem
                          label="Failed attempts"
                          value={String(
                            user.user_auth?.failed_login_attempts ?? 0,
                          )}
                          emphasize={Boolean(
                            (user.user_auth?.failed_login_attempts ?? 0) > 0,
                          )}
                        />
                        <AuthMetricItem
                          label="Last login"
                          value={formatDateTime(
                            user.user_auth?.last_login_at,
                          )}
                        />
                        <AuthMetricItem
                          label="Lockout until"
                          value={formatDateTime(
                            user.user_auth?.lockout_until,
                          )}
                        />
                        <AuthMetricItem
                          label="Last IP"
                          value={user.user_auth?.last_ip || "-"}
                          mono
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <StatBox
                        label="API keys"
                        value={user.stats?.api_keys_total ?? 0}
                      />
                      <StatBox
                        label="Active keys"
                        value={user.stats?.api_keys_active ?? 0}
                      />
                      <StatBox
                        label="Account events"
                        value={user.stats?.history_events_total ?? 0}
                      />
                      <StatBox
                        label="Premium events"
                        value={user.stats?.premium_status_events_total ?? 0}
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

                <Card>
                  <CardHeader>
                    <CardTitle>Auth Methods</CardTitle>
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
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead>Friendly Name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.auth_methods.map((method) => (
                            <TableRow key={method.id}>
                              <TableCell>
                                <StatusBadge tone="info">
                                  {method.type.toUpperCase()}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                <EnabledDisabledBadge
                                  enabled={method.is_enabled}
                                />
                              </TableCell>
                              <TableCell>
                                <EnabledDisabledBadge
                                  enabled={method.is_verified}
                                  enabledLabel="Verified"
                                  disabledLabel="Unverified"
                                />
                              </TableCell>
                              <TableCell>
                                {formatDateTime(method.last_used_at)}
                              </TableCell>
                              <TableCell>
                                {method.friendly_name || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <IconLink className="size-5 text-primary" />
                            User short links
                          </CardTitle>
                          <CardDescription>
                            Browse and search short links created by this user.
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setIsShortsSectionOpen((previous) => !previous)
                          }
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
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <StatBox
                            label="Total Links"
                            value={shortPagination.totalCount}
                          />
                          <StatBox label="Showing" value={userShorts.length} />
                          <StatBox
                            label="Active"
                            value={userShorts.filter((item) => item.is_active).length}
                          />
                          <StatBox
                            label="Banned"
                            value={userShorts.filter((item) => item.detail?.is_banned).length}
                          />
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_140px]">
                          <div className="relative">
                            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={shortsSearchInput}
                              maxLength={100}
                              onChange={(event) =>
                                setShortsSearchInput(event.target.value)
                              }
                              placeholder="Search short code, title, description, or URL..."
                              className="h-9 pl-9"
                            />
                          </div>

                          <Select
                            value={`${shortsSort}:${shortsOrder}`}
                            onValueChange={(value) => {
                              const [nextSort, nextOrder] = value.split(":");
                              setShortsSort(
                                nextSort as AdminUserShortLinkSort,
                              );
                              setShortsOrder(nextOrder as "asc" | "desc");
                              setShortsPage(1);
                            }}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Sort links" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created_at:desc">
                                Newest links
                              </SelectItem>
                              <SelectItem value="created_at:asc">
                                Oldest links
                              </SelectItem>
                              <SelectItem value="short_code:asc">
                                Short code A–Z
                              </SelectItem>
                              <SelectItem value="title:asc">
                                Title A–Z
                              </SelectItem>
                              <SelectItem value="is_active:desc">
                                Active first
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={String(shortsLimit)}
                            onValueChange={(value) => {
                              setShortsLimit(Number(value));
                              setShortsPage(1);
                            }}
                          >
                            <SelectTrigger className="h-9 w-full">
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
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Short Code</TableHead>
                                  <TableHead>Original URL</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Clicks</TableHead>
                                  <TableHead>Created</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {userShorts.map((short) => (
                                  <TableRow key={short.id}>
                                    <TableCell className="align-top">
                                      <div className="space-y-1">
                                        <p className="font-mono text-[15px] font-semibold leading-tight">
                                          /{short.short_code}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                          {short.title || short.description || "-"}
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="align-top max-w-[360px]">
                                      <a
                                        href={short.original_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-foreground hover:text-primary hover:underline break-all line-clamp-2"
                                        title={short.original_url}
                                      >
                                        {short.original_url}
                                      </a>
                                    </TableCell>
                                    <TableCell className="align-top">
                                      {renderShortLinkStatusBadge(short)}
                                    </TableCell>
                                    <TableCell className="align-top">
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold">
                                          {short.detail?.current_clicks ?? 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Limit: {short.detail?.click_limit ?? "Unlimited"}
                                        </p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="align-top text-xs text-muted-foreground">
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
                                !shortPagination.hasPrevious ||
                                userShortsQuery.isFetching
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
                              disabled={
                                !shortPagination.hasNext ||
                                userShortsQuery.isFetching
                              }
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

                <Card>
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
                          <DropdownMenuItem
                            onClick={() => setAuditView("premium")}
                          >
                            <IconCrown className="mr-2 size-4" />
                            Premium Lifecycle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAuditView("account")}
                          >
                            <IconArrowRight className="mr-2 size-4" />
                            Account Changes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAuditView("login")}
                          >
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
                        <StatBox
                          label="Reactivate"
                          value={eventStats.reactivated}
                        />
                        <StatBox
                          label="Permanent"
                          value={eventStats.permanent}
                        />
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
                            <div
                              key={event.id}
                              className="rounded-md border p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <PremiumEventActionBadge
                                    action={event.action}
                                  />
                                  <div className="flex items-center gap-1.5 rounded-md border border-dashed bg-muted/10 p-1">
                                    <StatusBadge
                                      tone={getStatusTone(event.old_status)}
                                      className="text-muted-foreground"
                                    >
                                      {event.old_status.toLocaleUpperCase()}
                                    </StatusBadge>
                                    <IconArrowRight className="size-3 text-muted-foreground" />
                                    <StatusBadge
                                      tone={getStatusTone(event.new_status)}
                                    >
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
                            <div
                              key={item.id}
                              className="rounded-md border p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <AccountHistoryActionBadge
                                  action={item.action_type}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {formatDateTime(item.changed_at)}
                                </p>
                              </div>
                              <p className="mt-2 text-sm">
                                {item.reason || "No reason provided."}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground break-all">
                                {item.changed_by
                                  ? shortenID(item.changed_by)
                                  : "system"}{" "}
                                | IP: {item.ip_address || "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    ) : recentLoginAttempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No login attempts found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recentLoginAttempts.map((item) => (
                          <div key={item.id} className="rounded-md border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <LoginAttemptBadge success={item.success} />
                              <div className="text-right text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 justify-end">
                                  <IconClockHour4 className="size-3.5" />
                                  <span>{formatDateTime(item.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            <p className="mt-2 text-sm break-all">
                              {item.email_or_username}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground break-words">
                              IP: {item.ip_address} | UA:{" "}
                              {item.user_agent || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
    <div className="min-w-0 border-b px-5 py-4 last:border-b-0 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0 md:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 min-w-0 text-sm font-medium">
        {valueNode ?? value ?? "-"}
      </div>
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

function getLatestTimestamp(
  values: Array<string | null | undefined>,
): string | null {
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

  const referenceDate = new Date(
    Math.max(...timestamps.map((value) => value.getTime())),
  );
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
        <span className="inline-flex items-center align-middle">
          {renderedValue}
        </span>
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={truncate ? "text-sm break-all" : "text-sm"}>
        {renderedValue}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
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
    <div className="rounded-md border bg-background/70 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={[
          "text-sm",
          mono ? "font-mono break-all" : "",
          emphasize ? "font-semibold text-destructive" : "font-medium",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function isUserCurrentlyRevoked(user: {
  is_premium: boolean;
  premium_revoked_at?: string | null;
  premium_reactivated_at?: string | null;
}): boolean {
  if (user.is_premium) return false;
  if (!user.premium_revoked_at) return false;
  if (!user.premium_reactivated_at) return true;
  const revokedAt = new Date(user.premium_revoked_at).getTime();
  const reactivatedAt = new Date(user.premium_reactivated_at).getTime();
  if (Number.isNaN(revokedAt)) return false;
  if (Number.isNaN(reactivatedAt)) return true;
  return revokedAt > reactivatedAt;
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
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-4 w-96" />
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
  if (normalized.includes("unlock") || normalized.includes("reactivate"))
    return "success";
  if (normalized.includes("revoke") || normalized.includes("lock"))
    return "danger";
  if (normalized.includes("verification") || normalized.includes("change"))
    return "warning";
  return "neutral";
}

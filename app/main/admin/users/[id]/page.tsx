"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconArrowRight,
  IconClockHour4,
  IconCrown,
  IconFilter,
  IconRefresh,
  IconUserCircle,
} from "@tabler/icons-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminPremiumStatusEventsQuery,
  useAdminUserDetailQuery,
} from "@/lib/hooks/queries/useAdminQuery";

type AuditHistoryView = "premium" | "account" | "login";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = decodeURIComponent(String(params.id ?? ""));
  const [auditView, setAuditView] = useState<AuditHistoryView>("premium");
  const [roleFromStorage, setRoleFromStorage] = useState<
    string | null | undefined
  >(undefined);
  const isAdmin = roleFromStorage && isAdminRole(roleFromStorage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoleFromStorage(getStoredRole());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const detailQuery = useAdminUserDetailQuery(userId, Boolean(userId));
  const eventsQuery = useAdminPremiumStatusEventsQuery(userId, Boolean(userId));

  const user = detailQuery.data;
  const events = useMemo(
    () => eventsQuery.data?.items ?? [],
    [eventsQuery.data?.items],
  );
  const recentHistory = useMemo(
    () => user?.recent_history ?? [],
    [user?.recent_history],
  );
  const recentLoginAttempts = useMemo(
    () => user?.recent_login_attempts ?? [],
    [user?.recent_login_attempts],
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
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                User Detail
              </h1>
              <p className="text-sm text-muted-foreground">
                Detail profile, authentication, and audit trail for admin
                operations.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/main/admin/users")}
              >
                <IconArrowLeft className="mr-2 size-4" />
                Back to Users
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void detailQuery.refetch();
                  void eventsQuery.refetch();
                }}
                disabled={detailQuery.isLoading || detailQuery.isFetching}
              >
                <IconRefresh className="mr-2 size-4" />
                Refresh
              </Button>
            </div>
          </div>

          {(typeof roleFromStorage === "undefined" ||
            detailQuery.isLoading) && <PageSkeleton />}

          {typeof roleFromStorage !== "undefined" && !isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  This page is available only for admin and super admin roles.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" && detailQuery.isError && (
            <Card>
              <CardHeader>
                <CardTitle>Failed to Load User</CardTitle>
                <CardDescription>
                  Please refresh page or try again later.
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <span>
                        {user.first_name} {user.last_name}
                      </span>
                      <RoleBadge role={user.role} />
                      <PremiumStateBadge
                        isPremium={user.is_premium}
                        isRevoked={isUserCurrentlyRevoked(user)}
                      />
                      <ActiveInactiveBadge
                        isActive={!user.is_locked}
                        activeLabel="Unlocked"
                        inactiveLabel="Locked"
                      />
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <p className="font-medium text-foreground">
                        {user.username}
                      </p>
                      <p>{user.email}</p>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                    <InfoLine label="User ID" value={user.id} truncate />
                    <InfoLine
                      label="Created At"
                      value={formatDateTime(user.created_at)}
                    />
                    <InfoLine
                      label="Updated At"
                      value={formatDateTime(user.updated_at)}
                    />
                    <InfoLine
                      label="Username Changed"
                      valueNode={
                        <EnabledDisabledBadge
                          enabled={Boolean(user.username_changed)}
                          enabledLabel="Changed"
                          disabledLabel="Original"
                        />
                      }
                    />
                    <InfoLine
                      label="Locked At"
                      value={formatDateTime(user.locked_at)}
                    />
                    <InfoLine
                      label="Locked Reason"
                      value={user.locked_reason || "-"}
                    />
                    <InfoLine
                      label="Revoked At"
                      value={formatDateTime(user.premium_revoked_at)}
                    />
                    <InfoLine
                      label="Reactivated At"
                      value={formatDateTime(user.premium_reactivated_at)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Auth & Stats</CardTitle>
                    <CardDescription>
                      Current authentication configuration and counters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border bg-gradient-to-b from-muted/20 to-background p-4 sm:p-5">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          User Auth
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Security posture and latest authentication signals.
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <EnabledDisabledBadge
                          enabled={Boolean(user.user_auth?.is_email_verified)}
                          enabledLabel="Email Verified"
                          disabledLabel="Email Unverified"
                        />
                        <EnabledDisabledBadge
                          enabled={Boolean(user.user_auth?.is_totp_enabled)}
                          enabledLabel="TOTP Enabled"
                          disabledLabel="TOTP Disabled"
                        />
                        <ActiveInactiveBadge
                          isActive={Boolean(user.user_auth?.is_active)}
                          activeLabel="Auth Active"
                          inactiveLabel="Auth Inactive"
                        />
                        {isLockoutActive(user.user_auth?.lockout_until) ? (
                          <StatusBadge tone="danger">LOCKOUT ACTIVE</StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">LOCKOUT CLEAR</StatusBadge>
                        )}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <AuthMetricItem
                          label="Failed Attempts"
                          value={String(user.user_auth?.failed_login_attempts ?? 0)}
                          emphasize={Boolean((user.user_auth?.failed_login_attempts ?? 0) > 0)}
                        />
                        <AuthMetricItem
                          label="Last Login"
                          value={formatDateTime(user.user_auth?.last_login_at)}
                        />
                        <AuthMetricItem
                          label="Lockout Until"
                          value={formatDateTime(user.user_auth?.lockout_until)}
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
                        label="API Keys"
                        value={user.stats?.api_keys_total ?? 0}
                      />
                      <StatBox
                        label="Active API Keys"
                        value={user.stats?.api_keys_active ?? 0}
                      />
                      <StatBox
                        label="History Events"
                        value={user.stats?.history_events_total ?? 0}
                      />
                      <StatBox
                        label="Premium Events"
                        value={user.stats?.premium_status_events_total ?? 0}
                      />
                      <StatBox
                        label="Login 24h"
                        value={user.stats?.login_attempts_24h ?? 0}
                      />
                      <StatBox
                        label="Login 7d"
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
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
  valueNode?: React.ReactNode;
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

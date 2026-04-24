"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  IconArrowRight,
  IconClockHour4,
  IconRefresh,
  IconUserCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  PremiumEventActionBadge,
  PremiumStateBadge,
  RevokeTypeBadge,
} from "@/components/ui/app-status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminUserPremiumStatusEvents,
  getAdminUsers,
  reactivateAdminUserPremiumAccess,
  revokeAdminUserPremiumAccess,
  type AdminPremiumStatusEventResponse,
  type AdminUserResponse,
  type AdminUsersListResponse,
} from "@/lib/api/auth";

type LoadState = "loading" | "ready" | "forbidden" | "error";
type RevokeType = "temporary" | "permanent";

const PAGE_LIMIT = 20;

export default function AdminPremiumAccessPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [pagination, setPagination] = useState<AdminUsersListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<AdminUserResponse | null>(null);
  const [events, setEvents] = useState<AdminPremiumStatusEventResponse[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [revokeType, setRevokeType] = useState<RevokeType>("temporary");
  const [reason, setReason] = useState("");
  const [overridePermanent, setOverridePermanent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (!isRefreshing) {
          setState("loading");
        }

        const roleFromStorage = getStoredRole();
        if (roleFromStorage && !isAdminRole(roleFromStorage)) {
          if (!active) return;
          setState("forbidden");
          return;
        }

        const response = await getAdminUsers({
          page,
          limit: PAGE_LIMIT,
          sort: "created_at",
          order_by: "desc",
        });

        if (!active) return;
        const data = response.data;
        setUsers(data?.users ?? []);
        setPagination(data ?? null);
        setState("ready");
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (
          message.includes("administrator") ||
          message.includes("permission") ||
          message.includes("access denied") ||
          message.includes("forbidden")
        ) {
          setState("forbidden");
          return;
        }
        console.error("Failed to load premium access users", error);
        setState("error");
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [page, isRefreshing]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter((user) => {
      const target = `${user.username} ${user.email} ${user.first_name} ${user.last_name}`.toLowerCase();
      return target.includes(term);
    });
  }, [users, search]);

  const hasPrevious = page > 1;
  const hasNext = useMemo(() => {
    if (!pagination) {
      return false;
    }
    return pagination.page * pagination.limit < pagination.total_count;
  }, [pagination]);

  const activeUserStatus = useMemo(() => {
    if (!activeUser) return "free";
    if (isUserCurrentlyRevoked(activeUser)) return "revoked";
    if (activeUser.is_premium) return "premium";
    return "free";
  }, [activeUser]);

  const activeUserRevokeType = useMemo(() => {
    if (!activeUser) return "";
    return (activeUser.premium_revoke_type || "").toLowerCase();
  }, [activeUser]);

  const eventStats = useMemo(() => {
    const total = events.length;
    const revoked = events.filter((item) => item.action === "revoke").length;
    const reactivated = events.filter((item) => item.action === "reactivate").length;
    const permanent = events.filter((item) => item.revoke_type === "permanent").length;
    return { total, revoked, reactivated, permanent };
  }, [events]);

  const openUserDetail = async (user: AdminUserResponse) => {
    setActiveUser(user);
    setDetailOpen(true);
    setRevokeType("temporary");
    setReason("");
    setOverridePermanent(false);
    setEvents([]);
    setEventsLoading(true);

    try {
      const response = await getAdminUserPremiumStatusEvents(user.id, { limit: 25 });
      setEvents(response.data?.items ?? []);
    } catch (error) {
      toast.error("Failed to load premium status events", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setEventsLoading(false);
    }
  };

  const mutateActiveUser = (partial: Partial<AdminUserResponse>) => {
    setActiveUser((prev) => (prev ? { ...prev, ...partial } : prev));
    setUsers((prev) =>
      prev.map((user) => (user.id === activeUser?.id ? { ...user, ...partial } : user))
    );
  };

  const handleRevoke = async () => {
    if (!activeUser || submitting) return;
    if (!activeUser.is_premium) {
      toast.error("User is not premium", {
        description: "Revoke is only available for premium users.",
      });
      return;
    }
    const cleanReason = reason.trim();
    if (cleanReason.length < 10) {
      toast.error("Reason too short", {
        description: "Minimum 10 characters required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await revokeAdminUserPremiumAccess(activeUser.id, {
        reason: cleanReason,
        revoke_type: revokeType,
      });
      const data = response.data;
      mutateActiveUser({
        is_premium: data?.is_premium ?? false,
        role: data?.role ?? "user",
        premium_revoke_type: data?.premium_revoke_type ?? revokeType,
        premium_revoked_at: data?.premium_revoked_at ?? new Date().toISOString(),
        premium_reactivated_at: data?.premium_reactivated_at ?? null,
        premium_revoked_reason: data?.premium_revoked_reason ?? cleanReason,
      });
      toast.success("Premium revoked", {
        description: "User downgraded to regular role.",
      });
      setReason("");
      await refreshEvents(activeUser.id);
    } catch (error) {
      toast.error("Failed to revoke premium", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    if (!activeUser || submitting) return;
    if (!isUserCurrentlyRevoked(activeUser)) {
      toast.error("User not in revoked state", {
        description: "Reactivate is only available after revoke.",
      });
      return;
    }
    const cleanReason = reason.trim();
    if (cleanReason.length < 5) {
      toast.error("Reason too short", {
        description: "Minimum 5 characters required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await reactivateAdminUserPremiumAccess(activeUser.id, {
        reason: cleanReason,
        override_permanent: overridePermanent,
      });
      const data = response.data;
      mutateActiveUser({
        is_premium: data?.is_premium ?? true,
        premium_reactivated_at: data?.premium_reactivated_at ?? new Date().toISOString(),
        premium_reactivated_reason: data?.premium_reactivated_reason ?? cleanReason,
      });
      toast.success("Premium reactivated", {
        description: "User premium access is active again.",
      });
      setReason("");
      setOverridePermanent(false);
      await refreshEvents(activeUser.id);
    } catch (error) {
      toast.error("Failed to reactivate premium", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshEvents = async (userID: string) => {
    setEventsLoading(true);
    try {
      const response = await getAdminUserPremiumStatusEvents(userID, { limit: 25 });
      setEvents(response.data?.items ?? []);
    } finally {
      setEventsLoading(false);
    }
  };

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
              <h1 className="text-2xl font-semibold tracking-tight">Premium Access Control</h1>
              <p className="text-sm text-muted-foreground">
                Revoke or reactivate premium access, role demotion, and audit history.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsRefreshing(true)}
              disabled={state === "loading"}
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {state === "loading" && <PageSkeleton />}

          {state === "forbidden" && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is available only for admin and super admin roles.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {state === "error" && (
            <Card>
              <CardHeader>
                <CardTitle>Failed to Load Users</CardTitle>
                <CardDescription>Please refresh page or try again later.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {state === "ready" && (
            <Card>
              <CardHeader className="space-y-4">
                <div className="space-y-1">
                  <CardTitle>Admin Users</CardTitle>
                  <CardDescription>
                    Total {pagination?.total_count ?? 0} user(s), page {pagination?.page ?? 1}.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="max-w-md"
                    placeholder="Search by username, email, or name..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={!hasPrevious}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={!hasNext}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found on this page.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Revoke Type</TableHead>
                        <TableHead>Last Changed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          className="cursor-pointer"
                          onClick={() => void openUserDetail(user)}
                        >
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            <PremiumStateBadge
                              isPremium={user.is_premium}
                              isRevoked={isUserCurrentlyRevoked(user)}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <span className="text-xs text-muted-foreground">
                              {(user.premium_revoke_type || "-").toString()}
                            </span>
                          </TableCell>
                          <TableCell className="align-top text-xs">
                            {formatDateTime(
                              user.premium_reactivated_at || user.premium_revoked_at || user.updated_at
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Premium Detail</DialogTitle>
            <DialogDescription>Manage premium lifecycle and review audit events.</DialogDescription>
          </DialogHeader>

          {activeUser && (
            <div className="space-y-5">
              <div className="rounded-lg border p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{activeUser.username}</p>
                  <p className="text-xs text-muted-foreground">{activeUser.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <PremiumStateBadge
                      isPremium={activeUser.is_premium}
                      isRevoked={isUserCurrentlyRevoked(activeUser)}
                    />
                    <Badge variant="outline">Role: {activeUser.role}</Badge>
                    {activeUser.premium_revoke_type && (
                      <Badge variant="outline">
                        Revoke Type: {activeUser.premium_revoke_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <p className="text-sm font-medium">
                  {activeUserStatus === "revoked" ? "Reactivate Premium" : "Revoke Premium"}
                </p>

                {activeUserStatus === "revoked" ? (
                  <>
                    {activeUserRevokeType === "permanent" && (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                        Permanently revoked. Super admin must confirm override before reactivate.
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="reactivate_reason">Reactivation Reason</Label>
                      <textarea
                        id="reactivate_reason"
                        className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Explain why this premium should be reactivated..."
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                    </div>
                    {activeUserRevokeType === "permanent" && (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={overridePermanent}
                          onCheckedChange={(value) => setOverridePermanent(value === true)}
                        />
                        <span>I confirm super admin permanent override.</span>
                      </label>
                    )}
                  </>
                ) : activeUserStatus === "premium" ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Revoke Type</Label>
                      <Select
                        value={revokeType}
                        onValueChange={(value) => setRevokeType(value as RevokeType)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose revoke type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="revoke_reason">Revoke Reason</Label>
                      <textarea
                        id="revoke_reason"
                        className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Explain why this premium must be revoked..."
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-md border border-muted p-3 text-sm text-muted-foreground">
                    User currently free (not premium). No revoke/reactivate action available.
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Premium Status Events</p>
                    <p className="text-xs text-muted-foreground">
                      Full audit trail for premium lifecycle actions.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refreshEvents(activeUser.id)}
                    disabled={eventsLoading}
                  >
                    Refresh Events
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="rounded-md border bg-muted/20 p-2">
                    <p className="text-[11px] text-muted-foreground">Total</p>
                    <p className="text-base font-semibold">{eventStats.total}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2">
                    <p className="text-[11px] text-muted-foreground">Revoke</p>
                    <p className="text-base font-semibold">{eventStats.revoked}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2">
                    <p className="text-[11px] text-muted-foreground">Reactivate</p>
                    <p className="text-base font-semibold">{eventStats.reactivated}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 p-2">
                    <p className="text-[11px] text-muted-foreground">Permanent</p>
                    <p className="text-base font-semibold">{eventStats.permanent}</p>
                  </div>
                </div>

                <Separator />

                {eventsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No event history yet.
                  </div>
                ) : (
                  <div className="max-h-[42vh] overflow-y-auto space-y-3 pr-1">
                    {events.map((event) => (
                      <div key={event.id} className="rounded-lg border p-3 md:p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <PremiumEventActionBadge action={event.action} />
                            <Badge variant="outline" className="gap-1">
                              <span className="text-muted-foreground">{event.old_status}</span>
                              <IconArrowRight className="h-3 w-3" />
                              <span>{event.new_status}</span>
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <span className="text-muted-foreground">{event.old_role}</span>
                              <IconArrowRight className="h-3 w-3" />
                              <span>{event.new_role}</span>
                            </Badge>
                            <RevokeTypeBadge revokeType={event.revoke_type} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <IconClockHour4 className="h-3.5 w-3.5" />
                              <span>{formatDateTime(event.created_at)}</span>
                            </div>
                            <p className="mt-1">{formatRelativeTime(event.created_at)}</p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
                          <div className="rounded-md bg-muted/20 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reason</p>
                            <p className="mt-1 text-sm break-words">
                              {event.reason || "No reason provided."}
                            </p>
                          </div>
                          <div className="rounded-md border p-3">
                            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                              <IconUserCircle className="h-3.5 w-3.5" />
                              Actor
                            </div>
                            <p className="mt-1 text-sm font-medium break-all" title={event.changed_by || "system"}>
                              {event.changed_by ? shortenID(event.changed_by) : "system"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Role: {event.changed_role || "-"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Event ID: #{event.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            {activeUserStatus === "revoked" ? (
              <Button onClick={handleReactivate} disabled={!activeUser || submitting}>
                {submitting ? "Submitting..." : "Reactivate Premium"}
              </Button>
            ) : activeUserStatus === "premium" ? (
              <Button onClick={handleRevoke} disabled={!activeUser || submitting} variant="destructive">
                {submitting ? "Submitting..." : "Revoke Premium"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function isUserCurrentlyRevoked(user: AdminUserResponse): boolean {
  if (user.is_premium) {
    return false;
  }

  if (!user.premium_revoked_at) {
    return false;
  }

  if (!user.premium_reactivated_at) {
    return true;
  }

  const revokedAt = new Date(user.premium_revoked_at).getTime();
  const reactivatedAt = new Date(user.premium_reactivated_at).getTime();

  if (Number.isNaN(revokedAt)) {
    return false;
  }
  if (Number.isNaN(reactivatedAt)) {
    return true;
  }

  return revokedAt > reactivatedAt;
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return "-";
  }

  const diffMs = Date.now() - parsed;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

function shortenID(value: string): string {
  if (value.length <= 18) {
    return value;
  }
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
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
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { role?: string };
    if (!parsed.role) {
      return null;
    }
    const normalized = parsed.role.trim().toLowerCase();
    return normalized || null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconClockHour4,
  IconCrown,
  IconDotsVertical,
  IconExternalLink,
  IconFilter,
  IconLock,
  IconPencil,
  IconRefresh,
  IconUserCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  ActiveInactiveBadge,
  PremiumEventActionBadge,
  PremiumStateBadge,
  RevokeTypeBadge,
  RoleBadge,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  type AdminUserResponse,
} from "@/lib/api/auth";
import {
  useAdminUserDetailQuery,
  useAdminUsersQuery,
  useAdminPremiumStatusEventsQuery,
  useUpdateAdminUserMutation,
  useLockAdminUserMutation,
  useUnlockAdminUserMutation,
  useRevokeAdminUserPremiumMutation,
  useReactivateAdminUserPremiumMutation,
} from "@/lib/hooks/queries/useAdminQuery";

type RevokeType = "temporary" | "permanent";
type Role = "user";
type DetailFocus = "profile" | "premium" | null;
type AuditHistoryView = "premium" | "account" | "login";

const PAGE_LIMIT = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<AdminUserResponse | null>(null);
  const [auditView, setAuditView] = useState<AuditHistoryView>("premium");

  const [revokeType, setRevokeType] = useState<RevokeType>("temporary");
  const [reason, setReason] = useState("");
  const [overridePermanent, setOverridePermanent] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    role: "user" as Role,
  });

  const [roleFromStorage, setRoleFromStorage] = useState<string | null | undefined>(undefined);
  const isAdmin = roleFromStorage && isAdminRole(roleFromStorage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoleFromStorage(getStoredRole());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const { data: usersData, isLoading, isError, isFetching, refetch } = useAdminUsersQuery(page, PAGE_LIMIT);
  const users = useMemo(() => (usersData?.users ?? [])
    .filter((user) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      const target = `${user.username} ${user.email} ${user.first_name} ${user.last_name}`.toLowerCase();
      return target.includes(term);
    }), [usersData, search]);

  const pagination = usersData ?? null;
  const userDetailQuery = useAdminUserDetailQuery(
    activeUserId ?? "",
    Boolean(activeUserId) && (isProfileOpen || isPremiumOpen || isHistoryOpen),
  );

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useAdminPremiumStatusEventsQuery(
    activeUserId ?? "",
    Boolean(activeUserId) && isHistoryOpen,
  );
  const events = useMemo(() => eventsData?.items ?? [], [eventsData?.items]);

  const revokeMutation = useRevokeAdminUserPremiumMutation();
  const reactivateMutation = useReactivateAdminUserPremiumMutation();
  const updateUserMutation = useUpdateAdminUserMutation();
  const lockUserMutation = useLockAdminUserMutation();
  const unlockUserMutation = useUnlockAdminUserMutation();

  const hasPrevious = page > 1;
  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    if (pagination.total_count <= 0) return 1;
    return Math.ceil(pagination.total_count / pagination.limit);
  }, [pagination]);
  const hasNext = useMemo(() => {
    if (!pagination) return false;
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

  const recentHistory = useMemo(() => activeUser?.recent_history ?? [], [activeUser?.recent_history]);
  const recentLoginAttempts = useMemo(
    () => activeUser?.recent_login_attempts ?? [],
    [activeUser?.recent_login_attempts],
  );
  const loginStats = useMemo(() => {
    const total = recentLoginAttempts.length;
    const success = recentLoginAttempts.filter((item) => item.success).length;
    return {
      total,
      success,
      failed: Math.max(0, total - success),
    };
  }, [recentLoginAttempts]);

  const openUserDetail = (user: AdminUserResponse, focus: DetailFocus = null) => {
    setActiveUserId(user.id);
    setActiveUser(user);
    setRevokeType("temporary");
    setReason("");
    setOverridePermanent(false);
    
    if (focus === "profile") {
      setIsProfileOpen(true);
    } else if (focus === "premium") {
      setIsPremiumOpen(true);
    } else {
      setAuditView("premium");
      setIsHistoryOpen(true);
    }
  };

  const openUserDetailPage = (userId: string) => {
    router.push(`/main/admin/users/${encodeURIComponent(userId)}`);
  };

  useEffect(() => {
    if (!userDetailQuery.data) return;
    const timer = setTimeout(() => {
      setActiveUser(userDetailQuery.data);
    }, 0);
    return () => clearTimeout(timer);
  }, [userDetailQuery.data]);

  useEffect(() => {
    if (!activeUser) return;
    const timer = setTimeout(() => {
      setProfileForm({
        first_name: activeUser.first_name || "",
        last_name: activeUser.last_name || "",
        username: activeUser.username || "",
        email: activeUser.email || "",
        role: normalizeRoleValue(activeUser.role),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [activeUser]);

  const handleRevoke = () => {
    if (!activeUser || revokeMutation.isPending) return;
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

    revokeMutation.mutate(
      { userId: activeUser.id, payload: { reason: cleanReason, revoke_type: revokeType } },
      {
        onSuccess: () => {
          setReason("");
          void refetchEvents();
        },
      },
    );
  };

  const handleReactivate = () => {
    if (!activeUser || reactivateMutation.isPending) return;
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

    reactivateMutation.mutate(
      { userId: activeUser.id, payload: { reason: cleanReason, override_permanent: overridePermanent } },
      {
        onSuccess: () => {
          setReason("");
          setOverridePermanent(false);
          void refetchEvents();
        },
      },
    );
  };

  const handleSaveProfile = () => {
    if (!activeUser || !activeUserId || updateUserMutation.isPending) return;

    const payload: {
      first_name?: string;
      last_name?: string;
      username?: string;
      email?: string;
      role?: Role;
    } = {};

    const nextFirstName = profileForm.first_name.trim();
    const nextLastName = profileForm.last_name.trim();
    const nextUsername = profileForm.username.trim();
    const nextEmail = profileForm.email.trim().toLowerCase();
    const currentRole = normalizeRoleValue(activeUser.role);

    if (nextFirstName && nextFirstName !== activeUser.first_name) {
      payload.first_name = nextFirstName;
    }
    if (nextLastName && nextLastName !== activeUser.last_name) {
      payload.last_name = nextLastName;
    }
    if (nextUsername && nextUsername !== activeUser.username) {
      payload.username = nextUsername;
    }
    if (nextEmail && nextEmail !== activeUser.email.toLowerCase()) {
      payload.email = nextEmail;
    }
    if (profileForm.role !== currentRole) {
      payload.role = profileForm.role;
    }

    if (Object.keys(payload).length === 0) {
      toast.message("No changes detected");
      return;
    }

    updateUserMutation.mutate(
      { userId: activeUserId, payload },
      {
        onSuccess: (updatedUser) => {
          setActiveUser(updatedUser);
        },
      },
    );
  };

  const handleToggleUserLock = (targetUser: AdminUserResponse) => {
    if (!targetUser) return;
    if (lockUserMutation.isPending || unlockUserMutation.isPending) return;

    if (targetUser.is_locked) {
      unlockUserMutation.mutate(
        {
          userId: targetUser.id,
          payload: { reason: "Unlocked via admin users action" },
        },
        {
          onSuccess: () => {
            void refetch();
          },
        },
      );
      return;
    }

    lockUserMutation.mutate(
      {
        userId: targetUser.id,
        payload: { reason: "Locked via admin users action" },
      },
      {
        onSuccess: () => {
          void refetch();
        },
      },
    );
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
              <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
              <p className="text-sm text-muted-foreground">
                List users and manage profile, premium lifecycle, and audit history.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              <IconRefresh className="mr-2 size-4" />
              Refresh
            </Button>
          </div>

          {(typeof roleFromStorage === "undefined" || isLoading || isFetching) && <PageSkeleton />}

          {typeof roleFromStorage !== "undefined" && !isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is available only for admin and super admin roles.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" && isError && (
            <Card>
              <CardHeader>
                <CardTitle>Failed to Load Users</CardTitle>
                <CardDescription>Please refresh page or try again later.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" && !isLoading && !isError && isAdmin && (
            <Card>
              <CardHeader className="space-y-4">
                <div className="space-y-1">
                  <CardTitle>List Users</CardTitle>
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
                </div>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found on this page.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Lock Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Changed</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <RoleBadge role={user.role} />
                          </TableCell>
                          <TableCell className="align-top">
                            <PremiumStateBadge
                              isPremium={user.is_premium}
                              isRevoked={isUserCurrentlyRevoked(user)}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <ActiveInactiveBadge
                              isActive={!user.is_locked}
                              activeLabel="Unlocked"
                              inactiveLabel="Locked"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            {formatDateTime(user.created_at)}
                          </TableCell>
                          <TableCell className="align-top text-xs">
                            {formatDateTime(
                              user.premium_reactivated_at || user.premium_revoked_at || user.updated_at
                            )}
                          </TableCell>
                          <TableCell className="align-top text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <IconDotsVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => void openUserDetail(user, "profile")}>
                                  <IconPencil className="mr-2 size-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUserDetailPage(user.id)}>
                                  <IconExternalLink className="mr-2 size-4" />
                                  Open Full Detail
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className={user.is_locked ? "" : "text-destructive"}
                                  disabled={lockUserMutation.isPending || unlockUserMutation.isPending}
                                  onClick={() => handleToggleUserLock(user)}
                                >
                                  <IconLock className="mr-2 size-4" />
                                  {user.is_locked ? "Unlock User" : "Lock User"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={isUserCurrentlyRevoked(user) ? "" : user.is_premium ? "text-destructive" : ""}
                                  onClick={() => void openUserDetail(user, "premium")}
                                >
                                  <IconCrown className="mr-2 size-4" />
                                  {isUserCurrentlyRevoked(user)
                                    ? "Restore Premium"
                                    : user.is_premium
                                      ? "Revoke Premium"
                                      : "Manage Premium"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex items-center justify-between pt-4 text-sm">
                  <p className="text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={!hasPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={!hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      {/* Profile Edit Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Manage basic profile information and admin role.</DialogDescription>
          </DialogHeader>
          {activeUser && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="profile_first_name">First Name</Label>
                  <Input
                    id="profile_first_name"
                    value={profileForm.first_name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile_last_name">Last Name</Label>
                  <Input
                    id="profile_last_name"
                    value={profileForm.last_name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile_username">Username</Label>
                  <Input
                    id="profile_username"
                    value={profileForm.username}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile_email">Email</Label>
                  <Input
                    id="profile_email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>User Role</Label>
                  <Select
                    value={profileForm.role}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, role: normalizeRoleValue(value) }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSaveProfile();
                setIsProfileOpen(false);
              }}
              disabled={updateUserMutation.isPending || userDetailQuery.isLoading}
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Action Dialog */}
      <Dialog open={isPremiumOpen} onOpenChange={setIsPremiumOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Premium Access</DialogTitle>
            <DialogDescription>
              {activeUserStatus === "revoked" ? "Reactivate premium access." : "Revoke premium access."}
            </DialogDescription>
          </DialogHeader>
          
          {activeUser && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/20">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{activeUser.username}</p>
                    <p className="text-xs text-muted-foreground">{activeUser.email}</p>
                  </div>
                  <PremiumStateBadge
                    isPremium={activeUser.is_premium}
                    isRevoked={isUserCurrentlyRevoked(activeUser)}
                  />
                </div>
              </div>

              {activeUserStatus === "revoked" ? (
                <div className="space-y-4">
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
                </div>
              ) : activeUserStatus === "premium" ? (
                <div className="space-y-4">
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
                </div>
              ) : (
                <div className="rounded-md border border-muted p-3 text-sm text-muted-foreground">
                  User currently free (not premium). No revoke/reactivate action available.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPremiumOpen(false)}>
              Cancel
            </Button>
            {activeUserStatus === "revoked" ? (
              <Button 
                onClick={() => {
                  handleReactivate();
                  if (reason.trim().length >= 5) setIsPremiumOpen(false);
                }} 
                disabled={!activeUser || reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? "Submitting..." : "Reactivate Premium"}
              </Button>
            ) : activeUserStatus === "premium" ? (
              <Button 
                onClick={() => {
                  handleRevoke();
                  if (reason.trim().length >= 10) setIsPremiumOpen(false);
                }} 
                disabled={!activeUser || revokeMutation.isPending} 
                variant="destructive"
              >
                {revokeMutation.isPending ? "Submitting..." : "Revoke Premium"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle>Audit History: {activeUser?.username}</DialogTitle>
                <DialogDescription>
                  {auditView === "premium"
                    ? "Premium lifecycle timeline."
                    : auditView === "account"
                      ? "Account change timeline."
                      : "Login security timeline."}
                </DialogDescription>
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
                    <IconPencil className="mr-2 size-4" />
                    Account Changes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAuditView("login")}>
                    <IconUserCircle className="mr-2 size-4" />
                    Login Security
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          {auditView === "premium" && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 my-2 shrink-0">
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
          )}
          {auditView === "account" && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 my-2 shrink-0">
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Total</p>
                <p className="text-base font-semibold">{recentHistory.length}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Auth Events</p>
                <p className="text-base font-semibold">
                  {recentHistory.filter((item) => item.action_type?.toLowerCase().includes("auth")).length}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Changed By</p>
                <p className="text-base font-semibold">
                  {recentHistory.filter((item) => Boolean(item.changed_by)).length}
                </p>
              </div>
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">With Reason</p>
                <p className="text-base font-semibold">
                  {recentHistory.filter((item) => Boolean(item.reason)).length}
                </p>
              </div>
            </div>
          )}
          {auditView === "login" && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 my-2 shrink-0">
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Total</p>
                <p className="text-base font-semibold">{loginStats.total}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Success</p>
                <p className="text-base font-semibold">{loginStats.success}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Failed</p>
                <p className="text-base font-semibold">{loginStats.failed}</p>
              </div>
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">Last 24h</p>
                <p className="text-base font-semibold">{activeUser?.stats?.login_attempts_24h ?? 0}</p>
              </div>
            </div>
          )}

          <Separator className="shrink-0" />

          <div className="overflow-y-auto flex-1 pr-2 min-h-0 py-2">
            {auditView === "premium" ? (
              eventsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-center text-muted-foreground">
                  No premium event history yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="rounded-lg border p-3 md:p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <PremiumEventActionBadge action={event.action} />
                          <Badge variant="outline" className="gap-1">
                            <span className="text-muted-foreground">{event.old_status}</span>
                            <IconArrowRight className="size-3" />
                            <span>{event.new_status}</span>
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <span className="text-muted-foreground">{event.old_role}</span>
                            <IconArrowRight className="size-3" />
                            <span>{event.new_role}</span>
                          </Badge>
                          <RevokeTypeBadge revokeType={event.revoke_type} />
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <IconClockHour4 className="size-3.5" />
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
                            <IconUserCircle className="size-3.5" />
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
              )
            ) : auditView === "account" ? (
              recentHistory.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-center text-muted-foreground">
                  No account history available.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHistory.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 md:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{item.action_type || "unknown"}</Badge>
                        <div className="text-xs text-muted-foreground text-right">
                          <span>{formatDateTime(item.changed_at)}</span>
                          <p className="mt-1">{formatRelativeTime(item.changed_at)}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <p>{item.reason || "No reason provided."}</p>
                        <p className="text-xs text-muted-foreground">
                          By: {item.changed_by ? shortenID(item.changed_by) : "system"} | IP: {item.ip_address || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">
                          UA: {item.user_agent || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : recentLoginAttempts.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-center text-muted-foreground">
                No login attempts available.
              </div>
            ) : (
              <div className="space-y-3">
                {recentLoginAttempts.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 md:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={item.success ? "default" : "destructive"}>
                        {item.success ? "Success" : "Failed"}
                      </Badge>
                      <div className="text-xs text-muted-foreground text-right">
                        <span>{formatDateTime(item.created_at)}</span>
                        <p className="mt-1">{formatRelativeTime(item.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="break-all">Identity: {item.email_or_username}</p>
                      <p className="text-xs text-muted-foreground">IP: {item.ip_address || "-"}</p>
                      <p className="text-xs text-muted-foreground break-words">UA: {item.user_agent || "-"}</p>
                      {!item.success && item.fail_reason ? (
                        <p className="text-xs text-destructive">Reason: {item.fail_reason}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => void refetchEvents()}
              disabled={eventsLoading}
            >
              <IconRefresh className="mr-2 size-4" /> Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function isUserCurrentlyRevoked(user: { is_premium: boolean; premium_revoked_at?: string | null; premium_reactivated_at?: string | null }): boolean {
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

function normalizeRoleValue(value?: string | null): Role {
  return "user";
}

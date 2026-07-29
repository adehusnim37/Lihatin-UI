"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowRight,
  IconChevronRight,
  IconClockHour4,
  IconCrown,
  IconDotsVertical,
  IconExternalLink,
  IconFilter,
  IconLock,
  IconPencil,
  IconRefresh,
  IconSearch,
  IconUserCircle,
  IconUsers,
  IconX,
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
  hasActivePremiumAccess,
  type AdminUserResponse,
  type AdminUserLockFilter,
  type AdminUserPremiumAccessFilter,
  type AdminUserRoleFilter,
  type AdminUserSort,
} from "@/lib/api/auth";
import {
  useAdminUserDetailQuery,
  useAdminUsersQuery,
  useAdminPremiumAccessEventsQuery,
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
  return (
    <Suspense fallback={<UsersRouteFallback />}>
      <AdminUsersPageContent />
    </Suspense>
  );
}

function AdminUsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchFromURL = searchParams.get("search")?.trim() ?? "";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const sort = parseUserSort(searchParams.get("sort"));
  const orderBy = parseOrder(searchParams.get("order_by"));
  const roleFilter = parseRoleFilter(searchParams.get("role"));
  const premiumFilter = parsePremiumFilter(
    searchParams.get("premium_access_status"),
  );
  const lockFilter = parseLockFilter(searchParams.get("lock_status"));
  const [searchInput, setSearchInput] = useState(searchFromURL);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const isResettingQueryRef = useRef(false);

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

  const updateListQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      const suffix = next.toString();
      router.replace(`${pathname}${suffix ? `?${suffix}` : ""}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (isResettingQueryRef.current) {
      if (debouncedSearch === searchFromURL) {
        isResettingQueryRef.current = false;
      }
      return;
    }
    if (debouncedSearch === searchFromURL) return;
    updateListQuery({
      search: debouncedSearch || null,
      page: null,
    });
  }, [debouncedSearch, searchFromURL, updateListQuery]);

  useEffect(() => {
    setSearchInput(searchFromURL);
  }, [searchFromURL]);

  const {
    data: usersData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminUsersQuery({
    page,
    limit: PAGE_LIMIT,
    search: searchFromURL || undefined,
    sort,
    order_by: orderBy,
    role: roleFilter,
    premium_access_status: premiumFilter,
    lock_status: lockFilter,
  });
  const users = useMemo(() => usersData?.users ?? [], [usersData?.users]);

  const pagination = usersData ?? null;
  const userDetailQuery = useAdminUserDetailQuery(
    activeUserId ?? "",
    Boolean(activeUserId) && (isProfileOpen || isPremiumOpen || isHistoryOpen),
  );

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useAdminPremiumAccessEventsQuery(
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
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const hasNext = page < totalPages;
  const activeFilterCount = [
    searchFromURL,
    roleFilter,
    premiumFilter,
    lockFilter,
    sort !== "created_at" || orderBy !== "desc" ? "sort" : "",
  ].filter(Boolean).length;
  const firstVisible =
    (pagination?.total_count ?? 0) === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const lastVisible = Math.min(
    page * PAGE_LIMIT,
    pagination?.total_count ?? 0,
  );

  useEffect(() => {
    if (!pagination || page <= totalPages) return;
    updateListQuery({
      page: totalPages > 1 ? String(totalPages) : null,
    });
  }, [page, pagination, totalPages, updateListQuery]);

  const activeUserStatus = useMemo(() => {
    if (!activeUser) return "free";
    if (isUserCurrentlyRevoked(activeUser)) return "revoked";
    if (hasActivePremiumAccess(activeUser.premium_access)) return "premium";
    return "free";
  }, [activeUser]);

  const activeUserRevokeType = useMemo(() => {
    if (!activeUser) return "";
    return (activeUser.premium_access?.revoke_type || "").toLowerCase();
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
    if (!hasActivePremiumAccess(activeUser.premium_access)) {
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
          setIsPremiumOpen(false);
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
          setIsPremiumOpen(false);
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
          setIsProfileOpen(false);
        },
      },
    );
  };

  const handleToggleUserLock = (targetUser: AdminUserResponse) => {
    if (!targetUser) return;
    if (lockUserMutation.isPending || unlockUserMutation.isPending) return;

    if (targetUser.account_status === "locked") {
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
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <IconUsers className="size-3.5" />
                Account operations
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                User directory
              </h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Find an account, inspect its current state, and move directly
                into profile, access, or audit work.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              <IconRefresh
                className={isFetching && !isLoading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </header>

          {(typeof roleFromStorage === "undefined" || isLoading) && (
            <PageSkeleton />
          )}

          {typeof roleFromStorage !== "undefined" && !isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>
                  The user directory is available only to admins and super
                  admins.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" && isError && (
            <Card>
              <CardHeader>
                <CardTitle>Users could not be loaded</CardTitle>
                <CardDescription>
                  Check the API connection, then retry this query.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => refetch()}>
                  <IconRefresh />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {typeof roleFromStorage !== "undefined" &&
            !isLoading &&
            !isError &&
            isAdmin && (
              <Card className="overflow-hidden py-0">
                <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <CardTitle>Operations index</CardTitle>
                      <CardDescription className="mt-1">
                        {pagination?.total_count ?? 0} matching account
                        {(pagination?.total_count ?? 0) === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Showing {firstVisible}–{lastVisible}
                    </p>
                  </div>
                </CardHeader>

                <div className="border-b px-5 py-4 md:px-6">
                  <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(150px,0.65fr))_minmax(190px,0.8fr)_auto]">
                    <div className="relative">
                      <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        aria-label="Search users"
                        className="h-9 pl-9"
                        maxLength={100}
                        placeholder="Search name, username, or email"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                      />
                    </div>

                    <Select
                      value={roleFilter ?? "all"}
                      onValueChange={(value) =>
                        updateListQuery({
                          role: value === "all" ? null : value,
                          page: null,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">
                          Super admin
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={premiumFilter ?? "all"}
                      onValueChange={(value) =>
                        updateListQuery({
                          premium_access_status:
                            value === "all" ? null : value,
                          page: null,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="All plans" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={lockFilter ?? "all"}
                      onValueChange={(value) =>
                        updateListQuery({
                          lock_status: value === "all" ? null : value,
                          page: null,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="All access" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All access</SelectItem>
                        <SelectItem value="unlocked">Unlocked</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={`${sort}:${orderBy}`}
                      onValueChange={(value) => {
                        const [nextSort, nextOrder] = value.split(":");
                        updateListQuery({
                          sort: nextSort === "created_at" ? null : nextSort,
                          order_by:
                            nextOrder === "desc" ? null : nextOrder,
                          page: null,
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Sort users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at:desc">
                          Newest accounts
                        </SelectItem>
                        <SelectItem value="created_at:asc">
                          Oldest accounts
                        </SelectItem>
                        <SelectItem value="updated_at:desc">
                          Recently changed
                        </SelectItem>
                        <SelectItem value="username:asc">
                          Username A–Z
                        </SelectItem>
                        <SelectItem value="username:desc">
                          Username Z–A
                        </SelectItem>
                        <SelectItem value="email:asc">Email A–Z</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      className="h-9"
                      disabled={activeFilterCount === 0}
                      onClick={() => {
                        isResettingQueryRef.current = true;
                        setSearchInput("");
                        router.replace(pathname, { scroll: false });
                      }}
                    >
                      <IconX />
                      Reset
                    </Button>
                  </div>
                  <div className="mt-3 flex min-h-5 items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Search and filters run across the full directory.
                    </p>
                    {isFetching && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                        Updating results
                      </p>
                    )}
                  </div>
                </div>

                <CardContent className="p-0">
                {users.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <div className="grid size-11 place-items-center rounded-full bg-muted">
                      <IconUserCircle className="size-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      No accounts match this query
                    </p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                      Change the search term or clear one of the account-state
                      filters.
                    </p>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          isResettingQueryRef.current = true;
                          setSearchInput("");
                          router.replace(pathname, { scroll: false });
                        }}
                      >
                        Clear query
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[980px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-5 md:pl-6">Account</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Account state</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last change</TableHead>
                          <TableHead className="w-12 pr-5 text-right md:pr-6">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const displayName =
                            [user.first_name, user.last_name]
                              .filter(Boolean)
                              .join(" ") || user.username;
                          return (
                            <TableRow
                              key={user.id}
                              className="group cursor-pointer"
                              onClick={() => openUserDetailPage(user.id)}
                            >
                              <TableCell className="pl-5 md:pl-6">
                                <div className="flex items-center gap-3">
                                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {getInitials(displayName)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="max-w-52 truncate text-sm font-medium">
                                        {displayName}
                                      </p>
                                      <IconChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                                    </div>
                                    <p className="max-w-64 truncate text-xs text-muted-foreground">
                                      @{user.username} · {user.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <RoleBadge role={user.role} />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1.5">
                                  <PremiumStateBadge
                                    isPremium={hasActivePremiumAccess(
                                      user.premium_access,
                                    )}
                                    isRevoked={isUserCurrentlyRevoked(user)}
                                  />
                                  <ActiveInactiveBadge
                                    isActive={user.account_status === "active"}
                                    activeLabel="Account active"
                                    inactiveLabel={
                                      user.account_status === "locked"
                                        ? "Admin locked"
                                        : "Account disabled"
                                    }
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">
                                  {formatDate(user.created_at)}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatTime(user.created_at)}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">
                                  {formatDate(getLastAccountChange(user))}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatRelativeTime(
                                    getLastAccountChange(user),
                                  )}
                                </p>
                              </TableCell>
                              <TableCell
                                className="pr-5 text-right md:pr-6"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      aria-label={`Actions for ${user.username}`}
                                    >
                                      <IconDotsVertical className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openUserDetailPage(user.id)
                                      }
                                    >
                                      <IconExternalLink />
                                      Open account file
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openUserDetail(user, "profile")
                                      }
                                    >
                                      <IconPencil />
                                      Edit profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openUserDetail(user)}
                                    >
                                      <IconClockHour4 />
                                      View audit history
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className={
                                        user.account_status === "locked"
                                          ? ""
                                          : "text-destructive"
                                      }
                                      disabled={
                                        lockUserMutation.isPending ||
                                        unlockUserMutation.isPending
                                      }
                                      onClick={() =>
                                        handleToggleUserLock(user)
                                      }
                                    >
                                      <IconLock />
                                      {user.account_status === "locked"
                                        ? "Unlock account"
                                        : "Lock account"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className={
                                        isUserCurrentlyRevoked(user)
                                          ? ""
                                          : hasActivePremiumAccess(
                                                user.premium_access,
                                              )
                                            ? "text-destructive"
                                            : ""
                                      }
                                      onClick={() =>
                                        openUserDetail(user, "premium")
                                      }
                                    >
                                      <IconCrown />
                                      {isUserCurrentlyRevoked(user)
                                        ? "Restore premium"
                                        : hasActivePremiumAccess(
                                              user.premium_access,
                                            )
                                          ? "Revoke premium"
                                          : "Review premium"}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <p className="text-muted-foreground">
                    Page {page} of {totalPages} · {pagination?.total_count ?? 0}{" "}
                    total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateListQuery({
                          page: page > 2 ? String(page - 1) : null,
                        })
                      }
                      disabled={!hasPrevious || isFetching}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateListQuery({ page: String(page + 1) })
                      }
                      disabled={!hasNext || isFetching}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
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
              onClick={handleSaveProfile}
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
                    isPremium={hasActivePremiumAccess(
                      activeUser.premium_access,
                    )}
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
                onClick={handleReactivate}
                disabled={!activeUser || reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? "Submitting..." : "Reactivate Premium"}
              </Button>
            ) : activeUserStatus === "premium" ? (
              <Button 
                onClick={handleRevoke}
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
                          <p className="mt-1 text-sm font-medium break-all" title={event.actor_id || "system"}>
                            {event.actor_id ? shortenID(event.actor_id) : "system"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Role: {event.actor_role || "-"}
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

function UsersRouteFallback() {
  return (
    <div className="p-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-3 h-4 w-80" />
      <Skeleton className="mt-8 h-[480px] w-full" />
    </div>
  );
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseUserSort(value: string | null): AdminUserSort {
  if (
    value === "updated_at" ||
    value === "username" ||
    value === "email"
  ) {
    return value;
  }
  return "created_at";
}

function parseOrder(value: string | null): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

function parseRoleFilter(value: string | null): AdminUserRoleFilter | undefined {
  if (value === "user" || value === "admin" || value === "super_admin") {
    return value;
  }
  return undefined;
}

function parsePremiumFilter(
  value: string | null,
): AdminUserPremiumAccessFilter | undefined {
  if (value === "free" || value === "premium" || value === "revoked") {
    return value;
  }
  return undefined;
}

function parseLockFilter(value: string | null): AdminUserLockFilter | undefined {
  if (value === "locked" || value === "unlocked") {
    return value;
  }
  return undefined;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
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

function getLastAccountChange(user: AdminUserResponse): string {
  const candidates = [
    user.updated_at,
    user.premium_access?.status_changed_at,
    user.account_status_changed_at,
  ].filter((value): value is string => Boolean(value));

  return candidates.reduce((latest, value) => {
    const valueTime = new Date(value).getTime();
    const latestTime = new Date(latest).getTime();
    if (Number.isNaN(valueTime)) return latest;
    if (Number.isNaN(latestTime) || valueTime > latestTime) return value;
    return latest;
  }, user.updated_at);
}

function isUserCurrentlyRevoked(user: AdminUserResponse): boolean {
  return user.premium_access?.status === "revoked";
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

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("en-US", {
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

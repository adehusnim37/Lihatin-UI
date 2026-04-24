"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  IconRefresh,
  IconSearch,
  IconSend,
  IconShieldLock,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SupportPriorityBadge,
  SupportStatusBadge,
} from "@/components/support/support-ticket-badges";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminSupportTicket,
  listAdminSupportTickets,
  updateAdminSupportTicket,
  type AdminSupportAction,
  type AdminSupportTicketDetailResponse,
  type AdminSupportTicketItem,
  type SupportCategory,
  type SupportPriority,
  type SupportTicketStatus,
} from "@/lib/api/support";

type LoadState = "loading" | "ready" | "forbidden" | "error";

const statusFilterOptions: { value: SupportTicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const categoryFilterOptions: { value: SupportCategory | "all"; label: string }[] = [
  { value: "all", label: "All Category" },
  { value: "account_locked", label: "Account Locked" },
  { value: "account_deactivated", label: "Account Deactivated" },
  { value: "email_verification", label: "Email Verification" },
  { value: "lost_2fa", label: "Lost 2FA" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

const priorityFilterOptions: { value: SupportPriority | "all"; label: string }[] = [
  { value: "all", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PAGE_LIMIT = 20;

export default function AdminSupportTicketsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<AdminSupportTicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("open");
  const [categoryFilter, setCategoryFilter] = useState<SupportCategory | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<SupportPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTicket, setActiveTicket] = useState<AdminSupportTicketDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [nextStatus, setNextStatus] = useState<SupportTicketStatus>("in_progress");
  const [nextPriority, setNextPriority] = useState<SupportPriority>("normal");
  const [updating, setUpdating] = useState(false);

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

        const response = await listAdminSupportTickets({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          page,
          limit: PAGE_LIMIT,
          search: search.trim() || undefined,
        });

        if (!active) return;

        setItems(response.data?.items ?? []);
        setTotal(response.data?.total ?? 0);
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

        console.error("Failed to load support tickets", error);
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
  }, [page, statusFilter, categoryFilter, priorityFilter, search, isRefreshing]);

  const totalPages = useMemo(() => {
    if (total <= 0) return 1;
    return Math.ceil(total / PAGE_LIMIT);
  }, [total]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    Boolean(search.trim());

  const handleOpenTicket = async (ticketId: string) => {
    setDetailsLoading(true);
    try {
      const response = await getAdminSupportTicket(ticketId);
      const ticket = response.data || null;
      setActiveTicket(ticket);
      setAdminNotes(ticket?.admin_notes || "");
      setNextStatus((ticket?.status as SupportTicketStatus) || "in_progress");
      setNextPriority((ticket?.priority as SupportPriority) || "normal");
    } catch (error) {
      toast.error("Failed to load ticket detail", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const applyUpdate = async (
    action?: AdminSupportAction,
    statusOverride?: SupportTicketStatus
  ) => {
    if (!activeTicket || updating) return;

    setUpdating(true);
    try {
      const response = await updateAdminSupportTicket(activeTicket.id, {
        status: statusOverride || nextStatus,
        priority: nextPriority,
        admin_notes: adminNotes.trim() || undefined,
        action,
      });

      toast.success("Support ticket updated", {
        description: response.data?.action_applied
          ? `Action: ${response.data.action_applied}`
          : "Ticket status updated.",
      });

      setIsRefreshing(true);
      await handleOpenTicket(activeTicket.id);
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUpdating(false);
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
              <h1 className="text-2xl font-semibold tracking-tight">Support Tickets</h1>
              <p className="text-sm text-muted-foreground">
                Review account access issues and resolve support requests.
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

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Ticket List</CardTitle>
                <CardDescription>
                  Total tickets: {total}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border bg-muted/20 p-3 md:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Filters
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setPage(1);
                        setStatusFilter("all");
                        setCategoryFilter("all");
                        setPriorityFilter("all");
                        setSearch("");
                      }}
                      disabled={!hasActiveFilters}
                    >
                      <IconX className="mr-1.5 h-3.5 w-3.5" />
                      Clear filters
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticket-status-filter">Status</Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setPage(1);
                          setStatusFilter(value as SupportTicketStatus | "all");
                        }}
                      >
                        <SelectTrigger id="ticket-status-filter" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {statusFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ticket-category-filter">Category</Label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => {
                          setPage(1);
                          setCategoryFilter(value as SupportCategory | "all");
                        }}
                      >
                        <SelectTrigger id="ticket-category-filter" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {categoryFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ticket-priority-filter">Priority</Label>
                      <Select
                        value={priorityFilter}
                        onValueChange={(value) => {
                          setPage(1);
                          setPriorityFilter(value as SupportPriority | "all");
                        }}
                      >
                        <SelectTrigger id="ticket-priority-filter" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {priorityFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ticket-search-filter">Search</Label>
                      <div className="relative">
                        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="ticket-search-filter"
                          value={search}
                          onChange={(event) => {
                            setPage(1);
                            setSearch(event.target.value);
                          }}
                          className="pl-9"
                          placeholder="Ticket code, subject, or email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {state === "loading" && <PageSkeleton />}

                {state === "forbidden" && (
                  <div className="text-sm text-muted-foreground">
                    This page is available only for admin and super admin roles.
                  </div>
                )}

                {state === "error" && (
                  <div className="text-sm text-muted-foreground">
                    Failed to load support tickets.
                  </div>
                )}

                {state === "ready" && (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                No support tickets found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            items.map((item) => (
                              <TableRow
                                key={item.id}
                                className="cursor-pointer"
                                onClick={() => void handleOpenTicket(item.id)}
                              >
                                <TableCell>
                                  <p className="font-medium">{item.ticket_code}</p>
                                  <p className="text-xs text-muted-foreground">{item.subject}</p>
                                </TableCell>
                                <TableCell>{item.email}</TableCell>
                                <TableCell>{toLabel(item.category)}</TableCell>
                                <TableCell>
                                  <SupportPriorityBadge priority={item.priority as SupportPriority} />
                                </TableCell>
                                <TableCell>
                                  <SupportStatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>{formatDate(item.created_at)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex items-center justify-between pt-4 text-sm">
                      <p className="text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={page >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 sticky top-6 self-start">
              <CardHeader>
                <CardTitle>Ticket Detail</CardTitle>
                <CardDescription>
                  {activeTicket ? activeTicket.ticket_code : "Select ticket from list"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailsLoading && <PageSkeleton />}

                {!detailsLoading && !activeTicket && (
                  <p className="text-sm text-muted-foreground">
                    Pick ticket to inspect timeline and apply action.
                  </p>
                )}

                {!detailsLoading && activeTicket && (
                  <>
                    <div className="space-y-1 text-sm">
                      <p><strong>Email:</strong> {activeTicket.email}</p>
                      <p><strong>Category:</strong> {toLabel(activeTicket.category)}</p>
                      <p className="flex items-center gap-2"><strong>Status:</strong> <SupportStatusBadge status={activeTicket.status} /></p>
                      <p className="flex items-center gap-2"><strong>Priority:</strong> <SupportPriorityBadge priority={activeTicket.priority as SupportPriority} /></p>
                      <p><strong>Created:</strong> {formatDate(activeTicket.created_at)}</p>
                    </div>

                    <div className="rounded-lg border p-3 text-sm">
                      <p className="font-medium mb-1">Subject</p>
                      <p className="break-words">{activeTicket.subject}</p>
                      <p className="font-medium mt-3 mb-1">Description</p>
                      <p className="text-muted-foreground whitespace-pre-wrap break-words">{activeTicket.description}</p>
                    </div>

                    {activeTicket.status === "resolved" || activeTicket.status === "closed" ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm mt-4">
                        <p className="font-medium text-emerald-800">Ticket Closed</p>
                        <p className="text-emerald-700 mt-1">This ticket has been marked as {activeTicket.status} and cannot be edited further.</p>
                        {activeTicket.admin_notes && (
                          <div className="mt-4 border-t border-emerald-200/60 pt-4">
                            <p className="font-medium text-emerald-800 mb-1">Final Admin Notes</p>
                            <p className="text-emerald-700 whitespace-pre-wrap break-words">{activeTicket.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Next Status</Label>
                            <Select
                              value={nextStatus}
                              onValueChange={(value) => setNextStatus(value as SupportTicketStatus)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                              value={nextPriority}
                              onValueChange={(value) => setNextPriority(value as SupportPriority)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2 mt-2">
                          <Label>Admin Notes</Label>
                          <textarea
                            value={adminNotes}
                            onChange={(event) => setAdminNotes(event.target.value)}
                            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Internal notes or resolution message"
                          />
                        </div>

                        <div className="grid gap-2 mt-2">
                          <Button
                            onClick={() => void applyUpdate()}
                            disabled={updating}
                          >
                            Save Update
                          </Button>

                          <Button
                            variant="secondary"
                            onClick={() => {
                              setNextStatus("resolved");
                              void applyUpdate("manual_response", "resolved");
                            }}
                            disabled={updating}
                          >
                            Resolve Ticket
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => void applyUpdate("unlock_user")}
                            disabled={updating}
                          >
                            <IconShieldLock className="mr-2 h-4 w-4" />
                            Unlock User
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => void applyUpdate("activate_user")}
                            disabled={updating}
                          >
                            <IconUserCheck className="mr-2 h-4 w-4" />
                            Activate Account
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => void applyUpdate("resend_verification")}
                            disabled={updating}
                          >
                            <IconSend className="mr-2 h-4 w-4" />
                            Resend Verification
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
    </div>
  );
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
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

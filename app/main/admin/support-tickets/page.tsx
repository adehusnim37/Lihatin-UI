"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  IconMessage2,
  IconFilter,
  IconChevronRight,
  IconPaperclip,
  IconRefresh,
  IconSearch,
  IconSend,
  IconShieldLock,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { QueryError } from "@/components/query-error";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SupportPriorityBadge,
  SupportStatusBadge,
} from "@/components/support/support-ticket-badges";
import { SupportCredentialResetActions } from "@/components/support/support-credential-reset-actions";
import { SupportConversationBubble } from "@/components/support/support-conversation-bubble";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getAdminSupportAttachmentURL,
  type AdminSupportAction,
  type SupportCategory,
  type SupportMessageResponse,
  type SupportPriority,
  type SupportTicketStatus,
} from "@/lib/api/support";
import {
  useAdminSupportConversationQuery,
  useAdminSupportTicketDetailQuery,
  useAdminSupportTicketsQuery,
  useSendAdminSupportMessageMutation,
  useUpdateAdminSupportTicketMutation,
} from "@/lib/hooks/queries/useSupportQuery";

type LoadState = "loading" | "ready" | "forbidden" | "error";

const statusFilterOptions: {
  value: SupportTicketStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const categoryFilterOptions: {
  value: SupportCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All categories" },
  { value: "account_locked", label: "Account Locked" },
  { value: "account_deactivated", label: "Account Deactivated" },
  { value: "email_verification", label: "Email Verification" },
  { value: "lost_2fa", label: "Lost 2FA" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "suspicious_link", label: "Suspicious Link" },
  { value: "other", label: "Other" },
];

const priorityFilterOptions: {
  value: SupportPriority | "all";
  label: string;
}[] = [
  { value: "all", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PAGE_LIMIT = 20;

export default function AdminSupportTicketsPage() {
  const [storedRole] = useState<string | null>(() => getStoredRole());
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("open");
  const [categoryFilter, setCategoryFilter] = useState<SupportCategory | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<SupportPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [ticketDraft, setTicketDraft] = useState<{
    ticketId: string | null;
    adminNotes: string;
    nextStatus: SupportTicketStatus | "";
    nextPriority: SupportPriority | "";
  }>({
    ticketId: null,
    adminNotes: "",
    nextStatus: "",
    nextPriority: "",
  });
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const roleForbidden = Boolean(storedRole && !isAdminRole(storedRole));
  const ticketsQuery = useAdminSupportTicketsQuery(
    {
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      page,
      limit: PAGE_LIMIT,
      search: debouncedSearch || undefined,
    },
    !roleForbidden,
  );
  const ticketDetailQuery = useAdminSupportTicketDetailQuery(
    activeTicketId ?? "",
    !roleForbidden && isDetailDialogOpen,
  );
  const activeTicket = ticketDetailQuery.data ?? null;
  const conversationQuery = useAdminSupportConversationQuery(
    activeTicketId ?? "",
    !roleForbidden && isDetailDialogOpen,
  );
  const conversation = conversationQuery.data ?? null;
  const updateTicketMutation = useUpdateAdminSupportTicketMutation();
  const sendMessageMutation = useSendAdminSupportMessageMutation();
  const items = ticketsQuery.data?.items ?? [];
  const total = ticketsQuery.data?.total ?? 0;
  const detailsLoading = isDetailDialogOpen && ticketDetailQuery.isLoading;
  const conversationLoading = conversationQuery.isLoading;
  const ticketsErrorMessage =
    ticketsQuery.error instanceof Error ? ticketsQuery.error.message.toLowerCase() : "";
  const state: LoadState = roleForbidden
    ? "forbidden"
    : ticketsQuery.isLoading
      ? "loading"
      : ticketsQuery.isError
        ? ticketsErrorMessage.includes("administrator") ||
          ticketsErrorMessage.includes("permission") ||
          ticketsErrorMessage.includes("access denied") ||
          ticketsErrorMessage.includes("forbidden")
          ? "forbidden"
          : "error"
        : "ready";
  const resolvedAdminNotes = activeTicket
    ? ticketDraft.ticketId === activeTicket.id
      ? ticketDraft.adminNotes
      : activeTicket.admin_notes || ""
    : "";
  const resolvedNextStatus = activeTicket
    ? ticketDraft.ticketId === activeTicket.id && ticketDraft.nextStatus
      ? ticketDraft.nextStatus
      : (activeTicket.status as SupportTicketStatus) || "in_progress"
    : "in_progress";
  const resolvedNextPriority = activeTicket
    ? ticketDraft.ticketId === activeTicket.id && ticketDraft.nextPriority
      ? ticketDraft.nextPriority
      : (activeTicket.priority as SupportPriority) || "normal"
    : "normal";

  useEffect(() => {
    if (!ticketDetailQuery.error) {
      return;
    }

    toast.error("Failed to load ticket detail", {
      description:
        ticketDetailQuery.error instanceof Error
          ? ticketDetailQuery.error.message
          : "Please try again.",
    });
  }, [ticketDetailQuery.error]);

  useEffect(() => {
    if (!conversationQuery.error) {
      return;
    }

    toast.error("Failed to load conversation", {
      description:
        conversationQuery.error instanceof Error
          ? conversationQuery.error.message
          : "Please try again.",
    });
  }, [conversationQuery.error]);

  const totalPages = useMemo(() => {
    if (total <= 0) return 1;
    return Math.ceil(total / PAGE_LIMIT);
  }, [total]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    Boolean(search.trim());

  const handleOpenTicket = (ticketId: string) => {
    setIsDetailDialogOpen(true);
    setActiveTicketId(ticketId);
    setDraftMessage("");
    setDraftFiles([]);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const patchTicketDraft = (
    patch: Partial<{
      adminNotes: string;
      nextStatus: SupportTicketStatus;
      nextPriority: SupportPriority;
    }>,
  ) => {
    if (!activeTicket) {
      return;
    }

    setTicketDraft({
      ticketId: activeTicket.id,
      adminNotes: patch.adminNotes ?? resolvedAdminNotes,
      nextStatus: patch.nextStatus ?? resolvedNextStatus,
      nextPriority: patch.nextPriority ?? resolvedNextPriority,
    });
  };

  const applyUpdate = async (action?: AdminSupportAction, statusOverride?: SupportTicketStatus) => {
    if (!activeTicket || updateTicketMutation.isPending) return;

    try {
      const response = await updateTicketMutation.mutateAsync({
        id: activeTicket.id,
        payload: {
          status: statusOverride || resolvedNextStatus,
          priority: resolvedNextPriority,
          admin_notes: resolvedAdminNotes.trim() || undefined,
          action,
        },
      });

      toast.success("Support ticket updated", {
        description: response.action_applied
          ? `Action: ${response.action_applied}`
          : "Ticket status updated.",
      });
    } catch (error) {
      toast.error("Update failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!activeTicket || sendMessageMutation.isPending) return;

    if (!draftMessage.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        id: activeTicket.id,
        payload: {
          body: draftMessage.trim(),
          attachments: draftFiles,
        },
      });

      setDraftMessage("");
      setDraftFiles([]);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }

      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="mx-auto flex w-full min-w-0 max-w-[1328px] flex-1 flex-col gap-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Support Tickets</h1>
              <p className="text-sm text-muted-foreground">
                Review account access issues and resolve support requests.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 sm:h-10"
              onClick={() => void ticketsQuery.refetch()}
              disabled={state === "loading" || ticketsQuery.isFetching}
            >
              <IconRefresh className="mr-2 size-4" />
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
              <div className="space-y-3 border-b p-4 sm:p-5">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      aria-label="Search support tickets"
                      value={search}
                      maxLength={150}
                      onChange={(event) => {
                        setPage(1);
                        setSearch(event.target.value);
                      }}
                      className="h-11 pl-9 sm:h-10"
                      placeholder="Search ticket code, subject, or email"
                    />
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setPage(1);
                        setStatusFilter(value as SupportTicketStatus | "all");
                      }}
                    >
                      <SelectTrigger
                        aria-label="Filter tickets by status"
                        className="h-11 min-w-0 flex-1 sm:h-10 sm:w-40"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusFilterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={filtersOpen ? "secondary" : "outline"}
                      className="h-11 sm:h-10"
                      aria-expanded={filtersOpen}
                      aria-controls="support-ticket-filters"
                      onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                      <IconFilter className="size-4" />
                      Filters
                      {(categoryFilter !== "all" || priorityFilter !== "all") && (
                        <span className="rounded bg-muted px-1.5 text-xs">
                          {Number(categoryFilter !== "all") + Number(priorityFilter !== "all")}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
                <div id="support-ticket-filters" hidden={!filtersOpen}>
                  <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="ticket-category-filter">Category</Label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => {
                          setPage(1);
                          setCategoryFilter(value as SupportCategory | "all");
                        }}
                      >
                        <SelectTrigger id="ticket-category-filter" className="h-11 w-full sm:h-10">
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
                        <SelectTrigger id="ticket-priority-filter" className="h-11 w-full sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      className="h-11 sm:h-10"
                      disabled={!hasActiveFilters}
                      onClick={() => {
                        setPage(1);
                        setStatusFilter("all");
                        setCategoryFilter("all");
                        setPriorityFilter("all");
                        setSearch("");
                      }}
                    >
                      <IconX className="size-4" />
                      Clear filters
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{total}</span> matching{" "}
                    {total === 1 ? "ticket" : "tickets"}
                  </p>
                  <p role="status" aria-live="polite">
                    {ticketsQuery.isFetching || search.trim() !== debouncedSearch
                      ? "Updating results…"
                      : total > 0
                        ? `Showing ${(page - 1) * PAGE_LIMIT + 1}–${Math.min(page * PAGE_LIMIT, total)}`
                        : "No results"}
                  </p>
                </div>
              </div>
              <CardContent className="p-0">
                {state === "loading" && (
                  <div className="p-5">
                    <PageSkeleton />
                  </div>
                )}

                {state === "forbidden" && (
                  <div className="p-5 text-sm text-muted-foreground">
                    This page is available only for admin and super admin roles.
                  </div>
                )}

                {state === "error" && (
                  <div className="p-5">
                    <QueryError
                      message="Could not load support tickets."
                      onRetry={() => void ticketsQuery.refetch()}
                    />
                  </div>
                )}

                {state === "ready" && (
                  <>
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                        <IconMessage2 className="mb-1 size-7 text-muted-foreground" />
                        <h2 className="text-base font-semibold">
                          {hasActiveFilters
                            ? "No tickets match this view"
                            : "No support tickets yet"}
                        </h2>
                        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                          {hasActiveFilters
                            ? "Try another status, category, or search to find a ticket."
                            : "New support requests will appear here, ready for your team to review."}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            className="mt-2 h-11"
                            onClick={() => {
                              setPage(1);
                              setStatusFilter("all");
                              setCategoryFilter("all");
                              setPriorityFilter("all");
                              setSearch("");
                            }}
                          >
                            View all tickets
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="hidden grid-cols-[minmax(0,1fr)_160px_150px_44px] gap-4 border-b bg-muted/20 px-5 py-3 text-xs text-muted-foreground lg:grid">
                          <span>Request</span>
                          <span>Status & priority</span>
                          <span>Latest activity</span>
                          <span className="sr-only">Open ticket</span>
                        </div>
                        <ul className="divide-y">
                          {items.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                aria-label={`View support ticket ${item.ticket_code}: ${item.subject}`}
                                className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_24px] gap-3 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5 lg:grid-cols-[minmax(0,1fr)_160px_150px_44px] lg:items-center lg:gap-4"
                                onClick={() => handleOpenTicket(item.id)}
                              >
                                <div className="min-w-0 space-y-1.5">
                                  <p className="break-words text-sm font-semibold">
                                    {item.subject}
                                  </p>
                                  <p className="break-all text-xs text-muted-foreground">
                                    {item.email}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="font-mono">{item.ticket_code}</span>
                                    <span>{toLabel(item.category)}</span>
                                  </div>
                                </div>
                                <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-1">
                                  <SupportStatusBadge status={item.status} />
                                  <SupportPriorityBadge
                                    priority={item.priority as SupportPriority}
                                  />
                                </div>
                                <div className="col-span-2 text-xs lg:col-span-1">
                                  <p className="text-muted-foreground lg:hidden">Latest activity</p>
                                  <p className="mt-1 tabular-nums lg:mt-0">
                                    {formatDate(item.updated_at || item.created_at)}
                                  </p>
                                  <p className="mt-1 text-muted-foreground">
                                    Created {formatDateLong(item.created_at)}
                                  </p>
                                </div>
                                <IconChevronRight className="col-start-2 row-start-1 size-4 self-center text-muted-foreground lg:col-start-auto lg:row-start-auto lg:justify-self-end" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 text-sm sm:px-5">
                      <p className="text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-11 sm:h-10"
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          disabled={page <= 1 || ticketsQuery.isFetching}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 sm:h-10"
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={page >= totalPages || ticketsQuery.isFetching}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] !w-[calc(100vw-2rem)] !max-w-[1200px] flex-col gap-0 overflow-hidden rounded-xl p-0">
              <DialogHeader className="shrink-0 border-b bg-background px-5 py-4 pr-18 sm:px-6 sm:pr-20">
                <div className="flex flex-col gap-4">
                  <div className="min-w-0 space-y-2">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                      {activeTicket?.subject || "Ticket details"}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-[12px] font-medium text-foreground">
                        #{activeTicket?.ticket_code || "TICKET"}
                      </span>
                      <span className="max-w-full break-all">
                        {activeTicket?.email || "Select ticket from list"}
                      </span>
                      {activeTicket ? (
                        <>
                          <SupportStatusBadge status={activeTicket.status} />
                          <Badge
                            variant="outline"
                            className="rounded-full border-border bg-muted/40 px-3 py-1 text-foreground"
                          >
                            {toLabel(activeTicket.category)}
                          </Badge>
                          <SupportPriorityBadge
                            priority={activeTicket.priority as SupportPriority}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <DialogDescription className="sr-only">
                  View support ticket details, conversation, and admin actions.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                {detailsLoading && <PageSkeleton />}

                {!detailsLoading && !activeTicket && (
                  <p className="text-sm text-muted-foreground">
                    Pick ticket to inspect timeline and apply action.
                  </p>
                )}

                {!detailsLoading && activeTicket && (
                  <>
                    <Tabs defaultValue="conversation" className="min-w-0 gap-4">
                      <TabsList className="grid h-auto w-full grid-cols-2 lg:hidden">
                        <TabsTrigger value="conversation" className="min-h-11">
                          Conversation
                        </TabsTrigger>
                        <TabsTrigger value="manage" className="min-h-11">
                          Manage ticket
                        </TabsTrigger>
                      </TabsList>
                      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <TabsContent
                          forceMount
                          value="conversation"
                          className="m-0 min-w-0 space-y-5 data-[state=inactive]:hidden lg:data-[state=inactive]:block"
                        >
                          <section className="border-b pb-5">
                            <div className="space-y-5">
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Description
                                </p>
                                <div className="whitespace-pre-wrap break-words text-sm leading-7">
                                  {activeTicket.description}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 border-t pt-4 text-xs text-muted-foreground">
                                <span>Created on {formatDateLong(activeTicket.created_at)}</span>
                                {activeTicket.updated_at !== activeTicket.created_at ? (
                                  <span>Updated {formatDateLong(activeTicket.updated_at)}</span>
                                ) : null}
                              </div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="space-y-1">
                                <p className="flex items-center gap-2 text-sm font-semibold">
                                  <IconMessage2 className="size-4" />
                                  Conversation
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Full thread between support team and user.
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                onClick={() => void conversationQuery.refetch()}
                                disabled={conversationQuery.isFetching}
                                className="size-11"
                                aria-label="Refresh conversation"
                              >
                                <IconRefresh className="size-4" />
                              </Button>
                            </div>

                            {conversationLoading ? (
                              <div className="mt-4">
                                <PageSkeleton />
                              </div>
                            ) : conversationQuery.isError ? (
                              <QueryError
                                message="Could not load this conversation."
                                onRetry={() => void conversationQuery.refetch()}
                              />
                            ) : (conversation?.messages ?? []).length === 0 ? (
                              <p className="mt-4 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                                No conversation yet.
                              </p>
                            ) : (
                              <div className="mt-4 space-y-3">
                                {(conversation?.messages ?? []).map((message) => (
                                  <SupportConversationBubble
                                    key={message.id}
                                    message={message}
                                    getAttachmentUrl={getAdminSupportAttachmentURL}
                                    isAdminView
                                  />
                                ))}
                              </div>
                            )}

                            {activeTicket.status === "resolved" ||
                            activeTicket.status === "closed" ? (
                              <Alert className="mt-4 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                                <IconMessage2 className="size-4 stroke-emerald-600" />
                                <AlertTitle>Conversation Closed</AlertTitle>
                                <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                                  This ticket has been marked as {activeTicket.status} on{" "}
                                  {formatDate(activeTicket.updated_at)}. Cannot receive or send new
                                  messages.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <div className="mt-5 space-y-3 border-t pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="admin-support-reply">Reply</Label>
                                  <textarea
                                    id="admin-support-reply"
                                    value={draftMessage}
                                    onChange={(event) => setDraftMessage(event.target.value)}
                                    className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Write clear update for user"
                                  />
                                </div>

                                <input
                                  ref={attachmentInputRef}
                                  type="file"
                                  accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                                  multiple
                                  className="hidden"
                                  onChange={(event) =>
                                    setDraftFiles(Array.from(event.target.files || []))
                                  }
                                />

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => attachmentInputRef.current?.click()}
                                    className="h-11 rounded-lg"
                                  >
                                    <IconPaperclip className="mr-2 size-4" />
                                    Attach Files
                                  </Button>

                                  <Button
                                    type="button"
                                    onClick={() => void handleSendMessage()}
                                    disabled={
                                      sendMessageMutation.isPending ||
                                      (!draftMessage.trim() && draftFiles.length === 0)
                                    }
                                    className="h-11 rounded-lg"
                                  >
                                    <IconSend className="mr-2 size-4" />
                                    {sendMessageMutation.isPending ? "Sending..." : "Send Reply"}
                                  </Button>
                                </div>

                                {draftFiles.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {draftFiles.map((file) => (
                                      <span
                                        key={`${file.name}-${file.size}`}
                                        className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border"
                                      >
                                        {file.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </section>
                        </TabsContent>
                        <TabsContent
                          forceMount
                          value="manage"
                          className="m-0 min-w-0 data-[state=inactive]:hidden lg:data-[state=inactive]:block"
                        >
                          <div className="space-y-4 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">Admin Controls</p>
                              <p className="text-sm text-muted-foreground">
                                Update status, set priority, and leave internal notes.
                              </p>
                            </div>

                            {activeTicket.status === "resolved" ||
                            activeTicket.status === "closed" ? (
                              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm">
                                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                                  Ticket {toLabel(activeTicket.status)}
                                </p>
                                <p className="mt-1 text-emerald-700 dark:text-emerald-300">
                                  Closed on {formatDate(activeTicket.updated_at)}. Editing disabled.
                                </p>
                                {activeTicket.admin_notes ? (
                                  <div className="mt-4 border-t border-emerald-200 pt-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                                      Final Admin Notes
                                    </p>
                                    <p className="whitespace-pre-wrap break-words text-emerald-800 dark:text-emerald-300">
                                      {activeTicket.admin_notes}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <div className="min-w-0 flex-1 space-y-2">
                                    <Label htmlFor="admin-support-status">Next Status</Label>
                                    <Select
                                      value={resolvedNextStatus}
                                      onValueChange={(value) =>
                                        patchTicketDraft({
                                          nextStatus: value as SupportTicketStatus,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        id="admin-support-status"
                                        className="h-11 w-full rounded-lg"
                                      >
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

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <Label htmlFor="admin-support-priority">Priority</Label>
                                    <Select
                                      value={resolvedNextPriority}
                                      onValueChange={(value) =>
                                        patchTicketDraft({
                                          nextPriority: value as SupportPriority,
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        id="admin-support-priority"
                                        className="h-11 w-full rounded-lg"
                                      >
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

                                <div className="space-y-2">
                                  <Label htmlFor="admin-support-notes">Admin Notes</Label>
                                  <textarea
                                    id="admin-support-notes"
                                    value={resolvedAdminNotes}
                                    onChange={(event) =>
                                      patchTicketDraft({
                                        adminNotes: event.target.value,
                                      })
                                    }
                                    className="min-h-36 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Internal notes, summary, or resolution context"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Button
                                    onClick={() => void applyUpdate()}
                                    disabled={updateTicketMutation.isPending}
                                    className="h-11 w-full rounded-xl"
                                  >
                                    Save Update
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      patchTicketDraft({ nextStatus: "resolved" });
                                      void applyUpdate("manual_response", "resolved");
                                    }}
                                    disabled={updateTicketMutation.isPending}
                                    className="h-11 w-full rounded-xl"
                                  >
                                    Resolve Ticket
                                  </Button>
                                </div>

                                <div className="space-y-3 border-t pt-4">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">User Management</p>
                                    <p className="text-sm text-muted-foreground">
                                      Actions that affect the requester’s account.
                                    </p>
                                  </div>

                                  <div className="grid gap-1.5">
                                    <Button
                                      variant="ghost"
                                      onClick={() => void applyUpdate("unlock_user")}
                                      disabled={updateTicketMutation.isPending}
                                      className="h-11 justify-start rounded-lg px-3"
                                    >
                                      <IconShieldLock className="mr-2 size-4" />
                                      Unlock User
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      onClick={() => void applyUpdate("activate_user")}
                                      disabled={updateTicketMutation.isPending}
                                      className="h-11 justify-start rounded-lg px-3"
                                    >
                                      <IconUserCheck className="mr-2 size-4" />
                                      Activate Account
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      onClick={() => void applyUpdate("resend_verification")}
                                      disabled={updateTicketMutation.isPending}
                                      className="h-11 justify-start rounded-lg px-3"
                                    >
                                      <IconSend className="mr-2 size-4" />
                                      Resend Verification
                                    </Button>
                                    <SupportCredentialResetActions
                                      key={activeTicket.id}
                                      ticket={activeTicket}
                                      disabled={updateTicketMutation.isPending}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
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

function formatDateLong(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size >= 100 ? Math.round(size) : size.toFixed(size >= 10 ? 1 : 2)} ${units[index]}`;
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

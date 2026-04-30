"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  IconMessage2,
  IconPaperclip,
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
import { SupportConversationBubble } from "@/components/support/support-conversation-bubble";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  { value: "all", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const categoryFilterOptions: {
  value: SupportCategory | "all";
  label: string;
}[] = [
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

const priorityFilterOptions: {
  value: SupportPriority | "all";
  label: string;
}[] = [
  { value: "all", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PAGE_LIMIT = 20;

export default function AdminSupportTicketsPage() {
  const [storedRole] = useState<string | null>(() => getStoredRole());
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">(
    "open",
  );
  const [categoryFilter, setCategoryFilter] = useState<SupportCategory | "all">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<SupportPriority | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
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
      search: search.trim() || undefined,
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
    ticketsQuery.error instanceof Error
      ? ticketsQuery.error.message.toLowerCase()
      : "";
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
      : ((activeTicket.status as SupportTicketStatus) || "in_progress")
    : "in_progress";
  const resolvedNextPriority = activeTicket
    ? ticketDraft.ticketId === activeTicket.id && ticketDraft.nextPriority
      ? ticketDraft.nextPriority
      : ((activeTicket.priority as SupportPriority) || "normal")
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

  const applyUpdate = async (
    action?: AdminSupportAction,
    statusOverride?: SupportTicketStatus,
  ) => {
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

      await Promise.all([
        ticketsQuery.refetch(),
        ticketDetailQuery.refetch(),
        conversationQuery.refetch(),
      ]);
    } catch (error) {
      toast.error("Update failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
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

      await Promise.all([conversationQuery.refetch(), ticketsQuery.refetch()]);
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message", {
        description:
          error instanceof Error ? error.message : "Please try again.",
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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Support Tickets
              </h1>
              <p className="text-sm text-muted-foreground">
                Review account access issues and resolve support requests.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void ticketsQuery.refetch()}
              disabled={state === "loading" || ticketsQuery.isFetching}
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Ticket List</CardTitle>
                <CardDescription>Total tickets: {total}</CardDescription>
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
                        <SelectTrigger
                          id="ticket-status-filter"
                          className="w-full"
                        >
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
                        <SelectTrigger
                          id="ticket-category-filter"
                          className="w-full"
                        >
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
                        <SelectTrigger
                          id="ticket-priority-filter"
                          className="w-full"
                        >
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
                            <TableHead>Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground"
                              >
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
                                  <p className="font-medium">
                                    {item.ticket_code}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.subject}
                                  </p>
                                </TableCell>
                                <TableCell>{item.email}</TableCell>
                                <TableCell>{toLabel(item.category)}</TableCell>
                                <TableCell>
                                  <SupportPriorityBadge
                                    priority={item.priority as SupportPriority}
                                  />
                                </TableCell>
                                <TableCell>
                                  <SupportStatusBadge status={item.status} />
                                </TableCell>
                                <TableCell>
                                  {formatDate(item.created_at)}
                                </TableCell>
                                <TableCell>
                                  {item.updated_at && item.updated_at !== item.created_at ? formatDate(item.updated_at) : "-"}
                                </TableCell>
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
                          onClick={() =>
                            setPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={page <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((prev) => Math.min(totalPages, prev + 1))
                          }
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
          </div>

          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="h-[min(96vh,1120px)] !w-[calc(100vw-24px)] !max-w-[1600px] gap-0 overflow-hidden rounded-xl p-0 shadow-lg">
              <DialogHeader className="shrink-0 border-b bg-background px-5 py-4 pr-18 sm:px-6 sm:pr-20">
                <div className="flex flex-col gap-4">
                  <div className="min-w-0 space-y-2">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                      Ticket Detail
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-[12px] font-medium text-foreground">
                        #{activeTicket?.ticket_code || "TICKET"}
                      </span>
                      <span className="truncate max-w-[420px]">
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

              <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
                {detailsLoading && <PageSkeleton />}

                {!detailsLoading && !activeTicket && (
                  <p className="text-sm text-muted-foreground">
                    Pick ticket to inspect timeline and apply action.
                  </p>
                )}

                {!detailsLoading && activeTicket && (
                  <>
                    <div className="flex flex-col gap-5 xl:gap-6 lg:flex-row lg:items-start">
                      <div className="min-w-0 space-y-5 lg:basis-[65%] lg:flex-1">
                        <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
                          <div className="space-y-5">
                            <div className="space-y-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Ticket Overview
                              </p>
                              <h2 className="break-words text-2xl font-semibold tracking-tight">
                                {activeTicket.subject}
                              </h2>
                            </div>

                            <div className="space-y-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Description
                              </p>
                              <div className="whitespace-pre-wrap rounded-xl border bg-muted/20 px-4 py-4 text-sm leading-7 text-foreground/90 sm:px-5">
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

                        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="flex items-center gap-2 text-sm font-semibold">
                                <IconMessage2 className="h-4 w-4" />
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
                              className="rounded-full"
                              aria-label="Refresh conversation"
                            >
                              <IconRefresh className="h-4 w-4" />
                            </Button>
                          </div>

                          {conversationLoading ? (
                            <div className="mt-4">
                              <PageSkeleton />
                            </div>
                          ) : (conversation?.messages ?? []).length === 0 ? (
                            <p className="mt-4 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                              No conversation yet.
                            </p>
                          ) : (
                            <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto rounded-xl border bg-muted/20 p-3 sm:p-4">
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
                            <Alert className="mt-4 border-emerald-200 bg-emerald-50/50 text-emerald-900">
                              <IconMessage2 className="h-4 w-4 stroke-emerald-600" />
                              <AlertTitle>Conversation Closed</AlertTitle>
                              <AlertDescription className="text-emerald-800">
                                This ticket has been marked as {activeTicket.status} on {formatDate(activeTicket.updated_at)}. Cannot receive or send new messages.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="mt-4 space-y-3 rounded-xl border bg-muted/20 p-3 sm:p-4">
                              <div className="space-y-2">
                              <Label>Reply</Label>
                              <textarea
                                value={draftMessage}
                                onChange={(event) => setDraftMessage(event.target.value)}
                                className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Write clear update for user"
                              />
                            </div>

                            <input
                              ref={attachmentInputRef}
                              type="file"
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
                                className="rounded-xl"
                              >
                                <IconPaperclip className="mr-2 h-4 w-4" />
                                Attach Files
                              </Button>

                                <Button
                                  type="button"
                                  onClick={() => void handleSendMessage()}
                                  disabled={sendMessageMutation.isPending}
                                  className="rounded-xl"
                                >
                                  <IconSend className="mr-2 h-4 w-4" />
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
                      </div>

                      <aside className="min-w-0 lg:sticky lg:top-0 lg:w-[420px] lg:min-w-[420px] lg:self-start xl:w-[460px] xl:min-w-[460px]">
                        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">Admin Controls</p>
                            <p className="text-sm text-muted-foreground">
                              Update status, set priority, and leave internal notes.
                            </p>
                          </div>

                          {activeTicket.status === "resolved" ||
                          activeTicket.status === "closed" ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
                              <p className="font-medium text-emerald-900">
                                Ticket {toLabel(activeTicket.status)}
                              </p>
                              <p className="mt-1 text-emerald-700">
                                Closed on {formatDate(activeTicket.updated_at)}. Editing disabled.
                              </p>
                              {activeTicket.admin_notes ? (
                                <div className="mt-4 border-t border-emerald-200 pt-4">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                                    Final Admin Notes
                                  </p>
                                  <p className="whitespace-pre-wrap break-words text-emerald-800">
                                    {activeTicket.admin_notes}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="min-w-0 flex-1 space-y-2">
                                  <Label>Next Status</Label>
                                  <Select
                                    value={resolvedNextStatus}
                                    onValueChange={(value) =>
                                      patchTicketDraft({
                                        nextStatus: value as SupportTicketStatus,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-10 w-full rounded-xl">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="in_progress">
                                        In Progress
                                      </SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="min-w-0 flex-1 space-y-2">
                                  <Label>Priority</Label>
                                  <Select
                                    value={resolvedNextPriority}
                                    onValueChange={(value) =>
                                      patchTicketDraft({
                                        nextPriority: value as SupportPriority,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-10 w-full rounded-xl">
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
                                <Label>Admin Notes</Label>
                                <textarea
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
                                    Low-risk account actions for support flow.
                                  </p>
                                </div>

                                <div className="grid gap-1.5">
                                  <Button
                                    variant="ghost"
                                    onClick={() => void applyUpdate("unlock_user")}
                                    disabled={updateTicketMutation.isPending}
                                    className="h-10 justify-start rounded-xl px-3"
                                  >
                                    <IconShieldLock className="mr-2 h-4 w-4" />
                                    Unlock User
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    onClick={() => void applyUpdate("activate_user")}
                                    disabled={updateTicketMutation.isPending}
                                    className="h-10 justify-start rounded-xl px-3"
                                  >
                                    <IconUserCheck className="mr-2 h-4 w-4" />
                                    Activate Account
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    onClick={() => void applyUpdate("resend_verification")}
                                    disabled={updateTicketMutation.isPending}
                                    className="h-10 justify-start rounded-xl px-3"
                                  >
                                    <IconSend className="mr-2 h-4 w-4" />
                                    Resend Verification
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </aside>
                    </div>

                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
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
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
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

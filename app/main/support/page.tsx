"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  IconMessage2,
  IconPaperclip,
  IconRefresh,
  IconSend,
  IconTicket,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUserSupportAttachmentURL,
  type AdminSupportTicketItem,
  type SupportMessageResponse,
} from "@/lib/api/support";
import { formatDate, SupportConversationBubble } from "@/components/support/support-conversation-bubble";
import {
  useSendUserSupportMessageMutation,
  useUserSupportConversationQuery,
  useUserSupportTicketsQuery,
} from "@/lib/hooks/queries/useSupportQuery";

export default function UserSupportPage() {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ticketsQuery = useUserSupportTicketsQuery({ page: 1, limit: 50 });
  const tickets = useMemo(
    () => ticketsQuery.data?.items ?? [],
    [ticketsQuery.data?.items],
  );
  const activeTicket = useMemo(() => {
    if (tickets.length === 0) {
      return null;
    }

    return tickets.find((ticket) => ticket.id === activeTicketId) ?? tickets[0];
  }, [activeTicketId, tickets]);
  const conversationQuery = useUserSupportConversationQuery(
    activeTicket?.id ?? "",
    Boolean(activeTicket),
  );
  const conversation = conversationQuery.data ?? null;
  const sendMessageMutation = useSendUserSupportMessageMutation();

  useEffect(() => {
    if (!ticketsQuery.error) {
      return;
    }

    toast.error("Failed to load support tickets", {
      description:
        ticketsQuery.error instanceof Error
          ? ticketsQuery.error.message
          : "Please try again.",
    });
  }, [ticketsQuery.error]);

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

  const handleOpenTicket = (ticket: AdminSupportTicketItem) => {
    setActiveTicketId(ticket.id);
  };

  const handleSend = async () => {
    if (!activeTicket || sendMessageMutation.isPending) return;

    if (!draftBody.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file.");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        id: activeTicket.id,
        payload: {
          body: draftBody.trim(),
          attachments: draftFiles,
        },
      });

      setDraftBody("");
      setDraftFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await Promise.all([conversationQuery.refetch(), ticketsQuery.refetch()]);
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const ticketCountText = useMemo(() => {
    if (tickets.length === 0) return "No tickets";
    if (tickets.length === 1) return "1 ticket";
    return `${tickets.length} tickets`;
  }, [tickets.length]);

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Support Inbox</h1>
              <p className="text-sm text-muted-foreground">
                Continue conversation with support team from your dashboard.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => void Promise.all([ticketsQuery.refetch(), conversationQuery.refetch()])}
              disabled={ticketsQuery.isFetching}
            >
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTicket className="h-5 w-5" />
                  My Tickets
                </CardTitle>
                <CardDescription>{ticketCountText}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticketsQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    No support ticket yet.
                  </p>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => handleOpenTicket(ticket)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/20 ${
                        ticket.id === activeTicketId ? "border-primary bg-primary/5" : "bg-card"
                      }`}
                    >
                      <p className="text-sm font-semibold">{ticket.ticket_code}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{ticket.subject}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <SupportStatusBadge status={ticket.status} />
                        <p className="text-[11px] text-muted-foreground">{formatDate(ticket.created_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMessage2 className="h-5 w-5" />
                  Conversation
                </CardTitle>
                <CardDescription>
                  {conversation?.ticket_code || activeTicket?.ticket_code || "Select ticket from left panel"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {conversationQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-4/5" />
                  </div>
                ) : !activeTicket ? (
                  <p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Pick one ticket to view full detail.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      {conversation?.status ? (
                        <SupportStatusBadge status={conversation.status} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>

                    <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                      {(conversation?.messages || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No message yet.</p>
                      ) : (
                        (conversation?.messages || []).map((message) => (
                          <SupportConversationBubble 
                            key={message.id} 
                            message={message} 
                            getAttachmentUrl={getUserSupportAttachmentURL}
                          />
                        ))
                      )}
                    </div>

                    {conversation?.status === "resolved" || conversation?.status === "closed" ? (
                      <Alert className="mt-4 border-emerald-200 bg-emerald-50/50 text-emerald-900">
                        <IconMessage2 className="h-4 w-4 stroke-emerald-600" />
                        <AlertTitle>Conversation Closed</AlertTitle>
                        <AlertDescription className="text-emerald-800">
                          This ticket has been marked as {conversation.status} on {formatDate(conversation.updated_at)} and cannot receive or send new messages.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3 rounded-lg border p-3">
                        <textarea
                          value={draftBody}
                          onChange={(event) => setDraftBody(event.target.value)}
                          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="Reply to support team"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(event) => setDraftFiles(Array.from(event.target.files || []))}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <IconPaperclip className="mr-2 h-4 w-4" />
                            Attach Files
                          </Button>
                          <Button type="button" onClick={() => void handleSend()} disabled={sendMessageMutation.isPending}>
                            <IconSend className="mr-2 h-4 w-4" />
                            {sendMessageMutation.isPending ? "Sending..." : "Send"}
                          </Button>
                        </div>

                        {draftFiles.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Files: {draftFiles.map((file) => file.name).join(", ")}
                          </p>
                        )}
                      </div>
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



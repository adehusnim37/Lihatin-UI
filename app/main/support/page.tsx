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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUserSupportAttachmentURL,
  getUserSupportConversation,
  listUserSupportTickets,
  sendUserSupportMessage,
  type AdminSupportTicketItem,
  type SupportConversationResponse,
  type SupportMessageResponse,
} from "@/lib/api/support";

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<AdminSupportTicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTicket, setActiveTicket] = useState<AdminSupportTicketItem | null>(null);
  const [conversation, setConversation] = useState<SupportConversationResponse | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const [draftBody, setDraftBody] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await listUserSupportTickets({ page: 1, limit: 50 });
      const items = response.data?.items || [];
      setTickets(items);

      if (items.length === 0) {
        setActiveTicket(null);
        setConversation(null);
        return;
      }

      const nextActive =
        items.find((ticket) => ticket.id === activeTicket?.id) ||
        items[0];
      setActiveTicket(nextActive);
      await loadConversation(nextActive.id);
    } catch (error) {
      toast.error("Failed to load support tickets", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadConversation = async (ticketID: string) => {
    setLoadingConversation(true);
    try {
      const response = await getUserSupportConversation(ticketID);
      setConversation(response.data || null);
    } catch (error) {
      setConversation(null);
      toast.error("Failed to load conversation", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenTicket = async (ticket: AdminSupportTicketItem) => {
    setActiveTicket(ticket);
    await loadConversation(ticket.id);
  };

  const handleSend = async () => {
    if (!activeTicket || sending) return;

    if (!draftBody.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file.");
      return;
    }

    setSending(true);
    try {
      await sendUserSupportMessage(activeTicket.id, {
        body: draftBody.trim(),
        attachments: draftFiles,
      });

      setDraftBody("");
      setDraftFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadConversation(activeTicket.id);
      await loadTickets();
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSending(false);
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

            <Button variant="outline" onClick={() => void loadTickets()} disabled={loadingTickets}>
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
                {loadingTickets ? (
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
                      onClick={() => void handleOpenTicket(ticket)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/20 ${
                        ticket.id === activeTicket?.id ? "border-primary bg-primary/5" : "bg-card"
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
                {loadingConversation ? (
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
                          <UserConversationBubble key={message.id} message={message} />
                        ))
                      )}
                    </div>

                    {conversation?.status === "resolved" || conversation?.status === "closed" ? (
                      <p className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                        This ticket has been {conversation.status}. You can no longer send messages.
                      </p>
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
                          <Button type="button" onClick={() => void handleSend()} disabled={sending}>
                            <IconSend className="mr-2 h-4 w-4" />
                            {sending ? "Sending..." : "Send"}
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

function UserConversationBubble({ message }: { message: SupportMessageResponse }) {
  const attachments = message.attachments ?? [];
  const mine = message.sender_type === "public" || message.sender_type === "user";
  const senderLabel = mine ? "You" : message.sender_type === "admin" ? "Support Team" : "System";

  return (
    <div className={`rounded-lg border p-3 text-sm ${mine ? "bg-white" : "bg-blue-50/50"}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-medium">{senderLabel}</p>
        <p className="text-xs text-muted-foreground">{formatDate(message.created_at)}</p>
      </div>
      <p className="whitespace-pre-wrap break-words text-foreground/90">{message.body}</p>

      {attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={getUserSupportAttachmentURL(attachment.id)}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-blue-600 hover:underline"
            >
              {attachment.file_name} ({formatBytes(attachment.size_bytes)})
            </a>
          ))}
        </div>
      )}
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

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

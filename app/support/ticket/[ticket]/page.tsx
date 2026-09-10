"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconKey,
  IconPaperclip,
  IconRefresh,
  IconSend,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  SupportConversationBubble,
  formatDate,
} from "@/components/support/support-conversation-bubble";
import { PublicSupportShell } from "@/components/support/public-support-shell";
import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  downloadPublicSupportAttachment,
  getPublicSupportAttachmentURL,
  type SupportAttachmentResponse,
  type SupportCategory,
} from "@/lib/api/support";
import {
  usePublicSupportConversationQuery,
  useRevokePublicSupportAccessMutation,
  useSendPublicSupportMessageMutation,
} from "@/lib/hooks/queries/useSupportQuery";
import { clearLegacyPublicSupportAccessTokens } from "@/lib/support/public-access";

const categoryLabelMap: Record<SupportCategory, string> = {
  account_locked: "Account Locked",
  account_deactivated: "Account Deactivated",
  email_verification: "Email Verification",
  lost_2fa: "Lost 2FA Device",
  billing: "Billing",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  suspicious_link: "Suspicious Link",
  other: "Other",
};

function PublicSupportConversationContent() {
  const params = useParams<{ ticket: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const ticketCode = useMemo(
    () => decodeURIComponent(params.ticket || "").trim().toUpperCase(),
    [params.ticket],
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);

  useEffect(() => {
    clearLegacyPublicSupportAccessTokens();
    if (
      searchParams.has("email") ||
      searchParams.has("code") ||
      searchParams.has("access_token")
    ) {
      router.replace(`/support/ticket/${encodeURIComponent(ticketCode)}`);
    }
  }, [router, searchParams, ticketCode]);

  const conversationQuery = usePublicSupportConversationQuery(
    { ticket: ticketCode },
    Boolean(ticketCode),
  );
  const sendMessageMutation = useSendPublicSupportMessageMutation();
  const revokeAccessMutation = useRevokePublicSupportAccessMutation();
  const conversation = conversationQuery.data ?? null;
  const accessError =
    conversationQuery.error instanceof Error
      ? conversationQuery.error.message
      : "";

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftMessage.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file");
      return;
    }
    try {
      await sendMessageMutation.mutateAsync({
        params: { ticket: ticketCode },
        payload: { body: draftMessage.trim(), attachments: draftFiles },
      });
      setDraftMessage("");
      setDraftFiles([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      toast.success("Message sent");
    } catch (error: unknown) {
      toast.error("Failed to send message", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleDownloadAttachment = async (
    attachment: SupportAttachmentResponse,
  ) => {
    try {
      const blob = await downloadPublicSupportAttachment({
        ticket: ticketCode,
        attachmentID: attachment.id,
      });
      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectURL;
      link.download = attachment.file_name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 0);
    } catch (error: unknown) {
      toast.error("Failed to download attachment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleResetAccess = async () => {
    try {
      await revokeAccessMutation.mutateAsync(ticketCode);
    } finally {
      router.push(`/support/access?ticket=${encodeURIComponent(ticketCode)}`);
    }
  };

  const categoryLabel = conversation
    ? categoryLabelMap[conversation.category]
    : null;

  return (
    <PublicSupportShell
      title="Support conversation"
      description={`Ticket ${ticketCode || "-"}`}
    >
      <div className="mb-2 flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/support/access?ticket=${encodeURIComponent(ticketCode)}`}>
            <IconArrowLeft className="mr-2 size-4" />
            Back to ticket access
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <Card className="min-w-0 gap-5 py-5 shadow-none">
          <CardHeader className="px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Conversation</CardTitle>
                <CardDescription>
                  Protected by a secure browser session.
                </CardDescription>
              </div>
              {conversation && (
                <SupportStatusBadge status={conversation.status} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            {conversationQuery.isLoading ? (
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                Loading conversation...
              </div>
            ) : conversation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 text-sm">
                  <p className="font-medium text-foreground">
                    {conversation.subject}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void conversationQuery.refetch()}
                    disabled={conversationQuery.isFetching}
                  >
                    <IconRefresh className="mr-2 size-4" />
                    {conversationQuery.isFetching
                      ? "Refreshing..."
                      : "Refresh"}
                  </Button>
                </div>

                <div className="max-h-[560px] space-y-3 overflow-y-auto rounded-lg bg-muted/35 p-3">
                  {conversation.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No messages yet.
                    </p>
                  ) : (
                    conversation.messages.map((message) => (
                      <SupportConversationBubble
                        key={message.id}
                        message={message}
                        getAttachmentUrl={(attachmentID) =>
                          getPublicSupportAttachmentURL({
                            ticket: ticketCode,
                            attachmentID,
                          })
                        }
                        onDownloadAttachment={(attachment) =>
                          void handleDownloadAttachment(attachment)
                        }
                      />
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="space-y-3 border-t pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="support-reply-message">Reply</Label>
                    <textarea
                      id="support-reply-message"
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Write message to support team"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <IconPaperclip className="mr-2 size-4" />
                      Attach Files
                    </Button>
                    <Button
                      type="submit"
                      disabled={sendMessageMutation.isPending}
                    >
                      <IconSend className="mr-2 size-4" />
                      {sendMessageMutation.isPending
                        ? "Sending..."
                        : "Send Reply"}
                    </Button>
                  </div>
                  {draftFiles.length > 0 && (
                    <div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
                      {draftFiles.map((file) => file.name).join(", ")}
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  {accessError ||
                    "Secure access required before opening conversation."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link
                      href={`/support/access?ticket=${encodeURIComponent(ticketCode)}`}
                    >
                      <IconKey className="mr-2 size-4" />
                      Verify access
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleResetAccess()}
                  >
                    Use different details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-4 py-5 shadow-none lg:sticky lg:top-6">
          <CardHeader className="px-5">
            <CardTitle className="text-base">Ticket overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ticket Code
              </p>
              <p className="mt-1 font-semibold">{ticketCode || "-"}</p>
            </div>
            {categoryLabel && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Category
                </p>
                <p className="mt-1 font-medium">{categoryLabel}</p>
              </div>
            )}
            {conversation?.created_at && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Created
                </p>
                <p className="mt-1 font-medium">
                  {formatDate(conversation.created_at)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicSupportShell>
  );
}

export default function PublicSupportConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Loading support conversation...
        </div>
      }
    >
      <PublicSupportConversationContent />
    </Suspense>
  );
}

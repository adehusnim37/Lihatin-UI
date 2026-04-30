"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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

import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPublicSupportAttachmentURL,
  listPublicSupportConversation,
  sendPublicSupportMessage,
  verifySupportAccessCode,
  type SupportCategory,
  type SupportConversationResponse,
  type SupportMessageResponse,
} from "@/lib/api/support";
import {
  buildPublicSupportConversationURL,
  clearStoredPublicSupportAccessToken,
  getStoredPublicSupportAccessToken,
  storePublicSupportAccessToken,
} from "@/lib/support/public-access";

const categoryLabelMap: Record<SupportCategory, string> = {
  account_locked: "Account Locked",
  account_deactivated: "Account Deactivated",
  email_verification: "Email Verification",
  lost_2fa: "Lost 2FA Device",
  billing: "Billing",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  other: "Other",
};

function PublicSupportConversationContent() {
  const params = useParams<{ ticket: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const autoOpenRef = useRef(false);

  const ticketCode = useMemo(() => decodeURIComponent(params.ticket || "").trim().toUpperCase(), [params.ticket]);

  const [email, setEmail] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [supportAccessToken, setSupportAccessToken] = useState("");
  const [conversation, setConversation] = useState<SupportConversationResponse | null>(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [accessError, setAccessError] = useState("");
  const hasCodeQuery = searchParams.get("code");

  useEffect(() => {
    setEmail((searchParams.get("email") || "").trim());
    setLinkCode((searchParams.get("code") || "").trim());
  }, [searchParams]);

  const loadConversation = useCallback(async (token: string) => {
    if (!ticketCode || !email.trim() || !token.trim()) {
      return;
    }

    setIsConversationLoading(true);
    setAccessError("");
    try {
      const response = await listPublicSupportConversation({
        ticket: ticketCode,
        email: email.trim(),
        accessToken: token.trim(),
      });

      setConversation(response.data || null);
    } catch (error: unknown) {
      setConversation(null);
      setAccessError(error instanceof Error ? error.message : "Please verify access again.");
      toast.error("Failed to load conversation", {
        description: error instanceof Error ? error.message : "Please verify access again.",
      });
    } finally {
      setIsConversationLoading(false);
    }
  }, [email, ticketCode]);

  const openConversation = useCallback(async (token: string) => {
    setSupportAccessToken(token);
    storePublicSupportAccessToken(ticketCode, email.trim(), token);
    await loadConversation(token);
  }, [email, loadConversation, ticketCode]);

  const verifyCodeAndOpen = useCallback(async (code: string) => {
    if (!ticketCode || !email.trim() || !code.trim()) {
      setAccessError("Ticket, email, and access code are required.");
      return;
    }

    setIsVerifyingAccess(true);
    setAccessError("");
    try {
      const response = await verifySupportAccessCode({
        ticket: ticketCode,
        email: email.trim(),
        code: code.trim(),
      });

      const token = response.data?.access_token || "";
      if (!token) {
        throw new Error("Access token missing in response");
      }

      await openConversation(token);

      if (hasCodeQuery) {
        router.replace(buildPublicSupportConversationURL(ticketCode, email.trim()));
      }

      toast.success("Secure access granted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please verify access again.";
      setAccessError(message);
      toast.error("Failed to verify access code", {
        description: message,
      });
    } finally {
      setIsVerifyingAccess(false);
    }
  }, [email, hasCodeQuery, openConversation, router, ticketCode]);

  useEffect(() => {
    if (autoOpenRef.current || !ticketCode || !email.trim()) {
      return;
    }

    autoOpenRef.current = true;
    const storedToken = getStoredPublicSupportAccessToken(ticketCode, email.trim());
    if (storedToken) {
      setSupportAccessToken(storedToken);
      void loadConversation(storedToken);
      return;
    }

    if (linkCode.trim()) {
      void verifyCodeAndOpen(linkCode.trim());
      return;
    }

    setAccessError("Secure access required before opening conversation.");
  }, [email, linkCode, loadConversation, ticketCode, verifyCodeAndOpen]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !supportAccessToken.trim()) {
      toast.error("Secure access required first");
      return;
    }

    if (!draftMessage.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file");
      return;
    }

    setIsSendingMessage(true);
    try {
      await sendPublicSupportMessage(
        {
          ticket: ticketCode,
          email: email.trim(),
          accessToken: supportAccessToken,
        },
        {
          body: draftMessage.trim(),
          attachments: draftFiles,
        },
      );

      setDraftMessage("");
      setDraftFiles([]);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      await loadConversation(supportAccessToken);
      toast.success("Message sent");
    } catch (error: unknown) {
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleResetAccess = () => {
    clearStoredPublicSupportAccessToken(ticketCode, email.trim());
    setSupportAccessToken("");
    setConversation(null);
    router.push(`/support/access?ticket=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email.trim())}`);
  };

  const categoryLabel = conversation ? categoryLabelMap[conversation.category] : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Lihatin" width={40} height={40} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Public Access</p>
                <h1 className="text-2xl font-semibold">Support Conversation</h1>
                <p className="mt-1 text-sm text-muted-foreground">Ticket {ticketCode || "-"}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/support/access?ticket=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email.trim())}`}>
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Back to Support Access
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="min-w-0 space-y-6">
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Conversation</CardTitle>
                    <CardDescription>
                      {supportAccessToken
                        ? "Secure thread active. You can reply and upload files."
                        : "Access needed before thread can open."}
                    </CardDescription>
                  </div>
                  {conversation && <SupportStatusBadge status={conversation.status} />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!email.trim() ? (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Email missing from support link. Return to support page and verify ticket again.
                  </div>
                ) : isConversationLoading || isVerifyingAccess ? (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    {isVerifyingAccess ? "Verifying secure access..." : "Loading conversation..."}
                  </div>
                ) : conversation ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{conversation.subject}</p>
                        <p className="text-muted-foreground">{email}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void loadConversation(supportAccessToken)}>
                        <IconRefresh className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>

                    <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border bg-muted/20 p-3">
                      {(conversation.messages ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No messages yet.</p>
                      ) : (
                        (conversation.messages ?? []).map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            ticketCode={conversation.ticket_code}
                            email={email.trim()}
                            accessToken={supportAccessToken}
                          />
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="space-y-3 rounded-xl border p-4">
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

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={attachmentInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => setDraftFiles(Array.from(event.target.files || []))}
                        />
                        <Button type="button" variant="outline" onClick={() => attachmentInputRef.current?.click()}>
                          <IconPaperclip className="mr-2 h-4 w-4" />
                          Attach Files
                        </Button>
                        <Button type="submit" disabled={isSendingMessage}>
                          <IconSend className="mr-2 h-4 w-4" />
                          {isSendingMessage ? "Sending..." : "Send Reply"}
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
                      {accessError || "Secure access required before opening conversation."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href={`/support/access?ticket=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email.trim())}`}>
                          <IconKey className="mr-2 h-4 w-4" />
                          Verify Access on Support Page
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={handleResetAccess}>
                        Reset Access
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Overview</CardTitle>
                <CardDescription>Reference info for this secure thread.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Ticket Code</p>
                    <p className="mt-1 font-semibold">{ticketCode || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="mt-1 break-words font-medium">{email || "-"}</p>
                  </div>

                  {categoryLabel && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                      <p className="mt-1 font-medium">{categoryLabel}</p>
                    </div>
                  )}

                  {conversation?.created_at && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                      <p className="mt-1 font-medium">{formatDateTime(conversation.created_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Keep ticket code private. Support team will never ask your OTP or password.
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  ticketCode,
  email,
  accessToken,
}: {
  message: SupportMessageResponse;
  ticketCode: string;
  email: string;
  accessToken: string;
}) {
  const attachments = message.attachments ?? [];
  const mine = message.sender_type === "public" || message.sender_type === "user";
  const senderLabel = mine ? "You" : message.sender_type === "admin" ? "Support Team" : "System";

  return (
    <div className={`rounded-xl border p-3 text-sm ${mine ? "bg-white" : "bg-blue-50/50"}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-medium">{senderLabel}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</p>
      </div>
      <p className="whitespace-pre-wrap break-words text-foreground/90">{message.body}</p>

      {attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={getPublicSupportAttachmentURL({
                ticket: ticketCode,
                email,
                accessToken,
                attachmentID: attachment.id,
              })}
              className="block text-xs text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {attachment.file_name} ({formatBytes(attachment.size_bytes)})
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleString();
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

"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconKey,
  IconMessage2,
  IconPaperclip,
  IconRefresh,
  IconSend,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { SupportStatusBadge } from "@/components/support/support-ticket-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPublicSupportAttachmentURL,
  type SupportCategory,
} from "@/lib/api/support";
import {
  usePublicSupportConversationQuery,
  useSendPublicSupportMessageMutation,
  useVerifySupportAccessCodeQuery,
} from "@/lib/hooks/queries/useSupportQuery";
import {
  clearStoredPublicSupportAccessToken,
  getStoredPublicSupportAccessToken,
  storePublicSupportAccessToken,
} from "@/lib/support/public-access";
import {
  SupportConversationBubble,
  formatDate,
} from "@/components/support/support-conversation-bubble";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const ticketCode = useMemo(
    () =>
      decodeURIComponent(params.ticket || "")
        .trim()
        .toUpperCase(),
    [params.ticket],
  );
  const email = useMemo(
    () => (searchParams.get("email") || "").trim(),
    [searchParams],
  );
  const linkCode = useMemo(
    () => (searchParams.get("code") || "").trim(),
    [searchParams],
  );

  const [supportAccessToken, setSupportAccessToken] = useState("");
  const [tokenFromVerify, setTokenFromVerify] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [accessError, setAccessError] = useState("");

  const hasToken = Boolean(supportAccessToken.trim() || tokenFromVerify.trim());
  const shouldVerifyLinkCode =
    !hasToken && Boolean(linkCode) && Boolean(ticketCode) && Boolean(email);

  const verifyCodeQuery = useVerifySupportAccessCodeQuery(
    { ticket: ticketCode, email, code: linkCode },
    shouldVerifyLinkCode,
  );

  const sendMessageMutation = useSendPublicSupportMessageMutation();
  const conversationQuery = usePublicSupportConversationQuery(
    {
      ticket: ticketCode,
      email,
      accessToken: supportAccessToken || tokenFromVerify,
    },
    Boolean(ticketCode && email && hasToken),
  );
  const conversation = conversationQuery.data ?? null;
  const isConversationLoading = conversationQuery.isLoading;
  const isRefreshingConversation =
    conversationQuery.isFetching && Boolean(conversation);

  useEffect(() => {
    if (ticketCode && email) {
      const stored = getStoredPublicSupportAccessToken(ticketCode, email);
      if (stored) setSupportAccessToken(stored);
    }
  }, [ticketCode, email]);

  useEffect(() => {
    if (verifyCodeQuery.status === "success" && verifyCodeQuery.data?.access_token) {
      const token = verifyCodeQuery.data.access_token;
      setSupportAccessToken(token);
      storePublicSupportAccessToken(ticketCode, email, token);
      setAccessError("");

      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      router.replace(url.toString());
      toast.success("Secure access granted");
    }
  }, [verifyCodeQuery.status, verifyCodeQuery.data, ticketCode, email, router]);

  useEffect(() => {
    if (
      verifyCodeQuery.status === "error" &&
      verifyCodeQuery.error &&
      shouldVerifyLinkCode
    ) {
      const message =
        verifyCodeQuery.error instanceof Error
          ? verifyCodeQuery.error.message
          : "Please verify access again.";
      setAccessError(message);
      toast.error("Failed to verify access code", {
        description: message,
      });
    }
  }, [verifyCodeQuery.status, verifyCodeQuery.error, shouldVerifyLinkCode]);

  useEffect(() => {
    if (!conversationQuery.error) {
      return;
    }

    const message =
      conversationQuery.error instanceof Error
        ? conversationQuery.error.message
        : "Please verify access again.";
    setAccessError(message);
    toast.error("Failed to load conversation", {
      description: message,
    });
  }, [conversationQuery.error]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!email || !activeToken) {
      toast.error("Secure access required first");
      return;
    }

    if (!draftMessage.trim() && draftFiles.length === 0) {
      toast.error("Write message or attach file");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        params: {
          ticket: ticketCode,
          email,
          accessToken: activeToken,
        },
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
      await conversationQuery.refetch();
      toast.success("Message sent");
    } catch (error: unknown) {
      toast.error("Failed to send message", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleResetAccess = () => {
    clearStoredPublicSupportAccessToken(ticketCode, email);
    setSupportAccessToken("");
    setTokenFromVerify("");
    router.push(
      `/support/access?ticket=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email)}`,
    );
  };

  const categoryLabel = conversation
    ? categoryLabelMap[conversation.category]
    : null;
  const activeToken = supportAccessToken || tokenFromVerify;
  const isVerifyingFromLink = verifyCodeQuery.isPending && shouldVerifyLinkCode;
  const needsAccess = !activeToken && !isVerifyingFromLink;
  const conversationDescription = isVerifyingFromLink
    ? "Verifying secure access..."
    : activeToken
      ? "Secure thread active. You can reply and upload files."
      : "Access needed before thread can open.";

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Lihatin" width={40} height={40} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Public Access
                </p>
                <h1 className="text-2xl font-semibold">Support Conversation</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ticket {ticketCode || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link
                  href={`/support/access?ticket=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email)}`}
                >
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
                    <CardDescription>{conversationDescription}</CardDescription>
                  </div>
                  {conversation && (
                    <SupportStatusBadge status={conversation.status} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!email ? (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Email missing from support link. Return to support page and
                    verify ticket again.
                  </div>
                ) : isVerifyingFromLink ? (
                  <div className="rounded-lg border bg-primary/20 p-4 text-sm text-primary">
                    Verifying secure access from link...
                  </div>
                ) : isConversationLoading && activeToken ? (
                  <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Loading conversation...
                  </div>
                ) : conversation && activeToken ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">
                          {conversation.subject}
                        </p>
                        <p className="text-muted-foreground">{email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void conversationQuery.refetch()}
                        disabled={conversationQuery.isFetching}
                      >
                        <IconRefresh className="mr-2 h-4 w-4" />
                        {isRefreshingConversation ? "Refreshing..." : "Refresh"}
                      </Button>
                    </div>

                    <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-xl border bg-muted/20 p-3">
                      {(conversation.messages ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No messages yet.
                        </p>
                      ) : (
                        (conversation.messages ?? []).map((message) => (
                          <SupportConversationBubble
                            key={message.id}
                            message={message}
                            getAttachmentUrl={(id) =>
                              getPublicSupportAttachmentURL({
                                ticket: conversation.ticket_code,
                                email,
                                accessToken: activeToken,
                                attachmentID: id,
                              })
                            }
                          />
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={handleSendMessage}
                      className="space-y-3 rounded-xl border p-4"
                    >
                      {conversation.status === "resolved" ||
                      conversation.status === "closed" ? (
                        <Alert className="mt-4 border-emerald-200 bg-emerald-50/50 text-emerald-900">
                          <IconMessage2 className="h-4 w-4 stroke-emerald-600" />
                          <AlertTitle>Conversation Closed</AlertTitle>
                          <AlertDescription className="text-emerald-800">
                            This ticket has been marked as {conversation.status}{" "}
                            on {formatDate(conversation.updated_at!)}. Cannot
                            receive or send new messages.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="support-reply-message">Reply</Label>
                            <textarea
                              id="support-reply-message"
                              value={draftMessage}
                              onChange={(event) =>
                                setDraftMessage(event.target.value)
                              }
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
                              onChange={(event) =>
                                setDraftFiles(
                                  Array.from(event.target.files || []),
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                attachmentInputRef.current?.click()
                              }
                            >
                              <IconPaperclip className="mr-2 h-4 w-4" />
                              Attach Files
                            </Button>
                            <Button
                              type="submit"
                              disabled={sendMessageMutation.isPending}
                            >
                              <IconSend className="mr-2 h-4 w-4" />
                              {sendMessageMutation.isPending
                                ? "Sending..."
                                : "Send Reply"}
                            </Button>
                          </div>
                        </>
                      )}

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
                          href={`/support/access?ticket=${encodeURIComponent(ticketCode)}&email=${encodeURIComponent(email)}`}
                        >
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
                <CardDescription>
                  Reference info for this secure thread.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Ticket Code
                    </p>
                    <p className="mt-1 font-semibold">{ticketCode || "-"}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-1 break-words font-medium">
                      {email || "-"}
                    </p>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Keep ticket code private. Support team will never ask your OTP or
          password.
        </div>
      </div>
    </div>
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

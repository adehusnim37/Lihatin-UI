"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { IconCopy, IconMailForward } from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  getAdminUsers,
  getAdminPremiumCodes,
  sendAdminPremiumCodeEmail,
  type AdminPremiumCode,
  type AdminPremiumCodesResponse,
  type AdminUserResponse,
} from "@/lib/api/auth";

type LoadState = "loading" | "ready" | "forbidden" | "error";
type RecipientMode = "used_user" | "custom_email";

const PAGE_LIMIT = 10;
const USER_PAGE_LIMIT = 100;

export default function AdminPremiumCodesPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [codes, setCodes] = useState<AdminPremiumCode[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserResponse[]>([]);
  const [userLabelById, setUserLabelById] = useState<Record<string, string>>({});
  const [pagination, setPagination] = useState<AdminPremiumCodesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<AdminPremiumCode | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("used_user");
  const [selectedUserID, setSelectedUserID] = useState<string>("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [messageNote, setMessageNote] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

        const [listResponse, usersResponse] = await Promise.all([
          getAdminPremiumCodes({
            page,
            limit: PAGE_LIMIT,
            sort: "created_at",
            order_by: "desc",
          }),
          getAdminUsers({
            page: 1,
            limit: USER_PAGE_LIMIT,
            sort: "created_at",
            order_by: "desc",
          }),
        ]);

        if (!active) return;
        const listData = listResponse.data;
        const keys = listData?.keys ?? [];
        setCodes(keys);
        setPagination(listData);
        const usersFromFirstPage = usersResponse.data?.users ?? [];
        const totalUserPages = usersResponse.data?.total_pages ?? 1;
        const userPages =
          totalUserPages > 1
            ? await Promise.all(
                Array.from({ length: totalUserPages - 1 }, (_, index) =>
                  getAdminUsers({
                    page: index + 2,
                    limit: USER_PAGE_LIMIT,
                    sort: "created_at",
                    order_by: "desc",
                  })
                )
              )
            : [];
        const users = [
          ...usersFromFirstPage,
          ...userPages.flatMap((response) => response.data?.users ?? []),
        ];
        const dedupedUsers = Array.from(
          new Map(users.map((user) => [user.id, user])).values()
        );
        setAdminUsers(dedupedUsers);

        const mappedLabels: Record<string, string> = {};
        for (const user of dedupedUsers) {
          mappedLabels[user.id] = `${user.username} (${user.email})`;
        }
        for (const key of keys) {
          for (const usage of key.key_usage ?? []) {
            if (!mappedLabels[usage.user_id]) {
              mappedLabels[usage.user_id] = usage.user_id;
            }
          }
        }
        setUserLabelById(mappedLabels);
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
        console.error("Failed to load premium codes", error);
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
  }, [page, isRefreshing]);

  const hasPrevious = page > 1;
  const hasNext = useMemo(() => {
    if (!pagination) {
      return false;
    }
    return pagination.page * pagination.limit < pagination.total;
  }, [pagination]);

  const activeCodeUsedUserIDs = useMemo(() => {
    if (!activeCode) {
      return [];
    }
    return Array.from(
      new Set((activeCode.key_usage ?? []).map((usage) => usage.user_id))
    );
  }, [activeCode]);

  const isActiveCodeLimitReached = useMemo(() => {
    if (!activeCode) {
      return false;
    }
    if (!activeCode.limit_usage || activeCode.limit_usage <= 0) {
      return false;
    }
    return activeCode.usage_count >= activeCode.limit_usage;
  }, [activeCode]);

  const activeCodeLastRedeemedAt = useMemo(() => {
    if (!activeCode?.key_usage?.length) {
      return null;
    }

    return activeCode.key_usage.reduce<string | null>((latest, usage) => {
      const current = usage.created_at;
      if (!latest) {
        return current;
      }
      return new Date(current).getTime() > new Date(latest).getTime()
        ? current
        : latest;
    }, null);
  }, [activeCode]);

  useEffect(() => {
    if (recipientMode !== "used_user" || selectedUserID || adminUsers.length === 0) {
      return;
    }
    setSelectedUserID(adminUsers[0].id);
  }, [recipientMode, selectedUserID, adminUsers]);

  const openDetailDialog = (code: AdminPremiumCode) => {
    setActiveCode(code);
    const firstUserID = (code.key_usage ?? [])[0]?.user_id ?? adminUsers[0]?.id ?? "";
    if (firstUserID) {
      setRecipientMode("used_user");
      setSelectedUserID(firstUserID);
    } else {
      setRecipientMode("custom_email");
      setSelectedUserID("");
    }
    setCustomEmail("");
    setCustomName("");
    setMessageNote("");
    setDetailOpen(true);
  };

  const handleSendSecretCode = async () => {
    if (!activeCode || isSendingEmail) {
      return;
    }

    if (recipientMode === "used_user" && !selectedUserID) {
      toast.error("Recipient user required", {
        description: "Please choose one user from used-by list.",
      });
      return;
    }

    const trimmedEmail = customEmail.trim();
    if (recipientMode === "custom_email" && !trimmedEmail) {
      toast.error("Recipient email required", {
        description: "Please fill custom recipient email.",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const payload =
        recipientMode === "used_user"
          ? {
              user_id: selectedUserID,
              note: messageNote.trim() || undefined,
            }
          : {
              recipient_email: trimmedEmail,
              recipient_name: customName.trim() || undefined,
              note: messageNote.trim() || undefined,
            };

      const response = await sendAdminPremiumCodeEmail(activeCode.id, payload);
      const sentTo = response.data?.recipient_email || "recipient";
      toast.success("Secret code sent", {
        description: `Email delivered to ${sentTo}.`,
      });
    } catch (error) {
      toast.error("Failed to send secret code", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSendingEmail(false);
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
              <h1 className="text-2xl font-semibold tracking-tight">Premium Codes Usage</h1>
              <p className="text-sm text-muted-foreground">
                List premium codes and users who have redeemed each code.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsRefreshing(true)}
              disabled={state === "loading"}
            >
              Refresh
            </Button>
          </div>

          {state === "loading" && <PageSkeleton />}

          {state === "forbidden" && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is available only for admin and super admin roles.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {state === "error" && (
            <Card>
              <CardHeader>
                <CardTitle>Failed to Load Premium Codes</CardTitle>
                <CardDescription>Please refresh page or try again later.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {state === "ready" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>All Premium Codes</CardTitle>
                  <CardDescription>
                    Total {pagination?.total ?? 0} code(s), page {pagination?.page ?? 1}.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={!hasPrevious}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={!hasNext}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {codes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No premium code found.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Secret Code</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Used By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codes.map((code) => {
                        const usedBy = getUsedByLabels(code, userLabelById);
                        const usageLimit = code.limit_usage ?? 0;
                        return (
                          <TableRow
                            key={code.id}
                            className="cursor-pointer"
                            onClick={() => openDetailDialog(code)}
                          >
                            <TableCell className="align-top whitespace-normal">
                              <div className="flex items-start gap-2">
                                <code className="max-w-[340px] break-all rounded bg-muted/40 px-2 py-1 text-[11px]">
                                  {code.secret_code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void copyText(code.secret_code);
                                  }}
                                  title="Copy secret code"
                                >
                                  <IconCopy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              {code.usage_count}
                              {usageLimit > 0 ? ` / ${usageLimit}` : ""}
                            </TableCell>
                            <TableCell className="align-top text-xs">
                              {formatDateTime(code.valid_until)}
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              {usedBy.length === 0 ? (
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : (
                                <div className="max-w-[380px] space-y-1">
                                  {usedBy.map((label) => (
                                    <Badge
                                      key={`${code.id}-${label}`}
                                      variant="outline"
                                      className="mr-1 max-w-full text-[11px] break-all whitespace-normal"
                                    >
                                      {label}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Premium Code Detail</DialogTitle>
            <DialogDescription>
              Review code information and send secret code by email.
            </DialogDescription>
          </DialogHeader>

          {activeCode && (
            <div className="space-y-5">
              <div className="rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Secret Code</p>
                      <code className="block break-all rounded bg-muted/40 px-2 py-1 text-[11px]">
                        {activeCode.secret_code}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => void copyText(activeCode.secret_code)}
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Usage: {activeCode.usage_count}
                      {activeCode.limit_usage ? ` / ${activeCode.limit_usage}` : ""}
                    </Badge>
                    <Badge variant="outline">
                      Valid Until: {formatDateTime(activeCode.valid_until)}
                    </Badge>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Used By</p>
                    {activeCodeUsedUserIDs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No usage yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {activeCodeUsedUserIDs.map((userID) => (
                          <Badge
                            key={`dialog-usedby-${userID}`}
                            variant="outline"
                            className="mr-1 max-w-full break-all whitespace-normal text-[11px]"
                          >
                            {userLabelById[userID] || userID}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <IconMailForward className="h-4 w-4" />
                  <p className="text-sm font-medium">Send Secret Code via Email</p>
                </div>

                {isActiveCodeLimitReached ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">Oops, you can&apos;t send it again.</p>
                    <p className="mt-1">
                      This secret code has reached maximum usage limit.
                    </p>
                    {activeCodeLastRedeemedAt && (
                      <p className="mt-1">
                        Redeemed at: {formatDateTime(activeCodeLastRedeemedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="grid min-w-0 gap-2">
                        <Label>Recipient Type</Label>
                        <Select
                          value={recipientMode}
                          onValueChange={(value) => setRecipientMode(value as RecipientMode)}
                        >
                          <SelectTrigger className="w-full min-w-0">
                            <SelectValue className="truncate" placeholder="Select recipient type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="used_user">User from all users list</SelectItem>
                            <SelectItem value="custom_email">Custom email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {recipientMode === "used_user" ? (
                        <div className="grid min-w-0 gap-2">
                          <Label>Select User</Label>
                          <Select value={selectedUserID} onValueChange={setSelectedUserID}>
                            <SelectTrigger className="w-full min-w-0 max-w-full">
                              <SelectValue className="min-w-0 max-w-full truncate" placeholder="Choose user" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[calc(100vw-2rem)]">
                              {adminUsers.length === 0 ? (
                                <SelectItem value="no-user" disabled>
                                  No users found
                                </SelectItem>
                              ) : (
                                adminUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    <span title={`${user.username} (${user.email})`}>
                                      {user.username} ({user.email})
                                    </span>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="grid min-w-0 gap-2">
                          <Label htmlFor="recipient_email">Recipient Email</Label>
                          <Input
                            id="recipient_email"
                            type="email"
                            placeholder="name@company.com"
                            value={customEmail}
                            onChange={(event) => setCustomEmail(event.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    {recipientMode === "custom_email" && (
                      <div className="grid gap-2">
                        <Label htmlFor="recipient_name">Recipient Name (Optional)</Label>
                        <Input
                          id="recipient_name"
                          type="text"
                          placeholder="Jane Doe"
                          value={customName}
                          onChange={(event) => setCustomName(event.target.value)}
                        />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="message_note">Message (Optional)</Label>
                      <textarea
                        id="message_note"
                        className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Add short instruction for recipient..."
                        value={messageNote}
                        onChange={(event) => setMessageNote(event.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleSendSecretCode}
              disabled={!activeCode || isSendingEmail || isActiveCodeLimitReached}
            >
              {isSendingEmail ? "Sending..." : "Send Secret Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function PageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
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

function getUsedByLabels(code: AdminPremiumCode, userLabelById: Record<string, string>): string[] {
  const labels = (code.key_usage ?? []).map((usage) => userLabelById[usage.user_id] || usage.user_id);
  return Array.from(new Set(labels));
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

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied", {
      description: "Secret code copied to clipboard.",
    });
  } catch {
    toast.error("Copy failed", {
      description: "Unable to copy secret code.",
    });
  }
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

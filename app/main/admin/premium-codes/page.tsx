"use client";

import { useMemo, useState, useEffect, type CSSProperties } from "react";
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
  type AdminPremiumCode,
  type AdminUserResponse,
} from "@/lib/api/auth";
import {
  useAdminPremiumCodesQuery,
  useAdminUsersQuery,
  useSendAdminPremiumCodeEmailMutation,
} from "@/lib/hooks/queries/useAdminQuery";

type RecipientMode = "used_user" | "custom_email";

const PAGE_LIMIT = 10;
const USER_PAGE_LIMIT = 100;

export default function AdminPremiumCodesPage() {
  const [roleFromStorage, setRoleFromStorage] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    // Read localStorage on client only to avoid SSR/client HTML mismatch
    const r = getStoredRole();
    setRoleFromStorage(r);
  }, []);

  const isAdmin = roleFromStorage ? isAdminRole(roleFromStorage) : false;
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<AdminPremiumCode | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("used_user");
  const [selectedUserID, setSelectedUserID] = useState<string>("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [messageNote, setMessageNote] = useState("");

  const { data: codesData, isLoading, isError, isFetching, refetch } = useAdminPremiumCodesQuery(page, PAGE_LIMIT);
  const codes = useMemo(() => codesData?.keys ?? [], [codesData?.keys]);
  const pagination = codesData ?? null;

  const { data: allUsersData } = useAdminUsersQuery(1, USER_PAGE_LIMIT);
  const adminUsers = useMemo(() => allUsersData?.users ?? [], [allUsersData?.users]);

  const sendEmailMutation = useSendAdminPremiumCodeEmailMutation();

  const userLabelById = useMemo(() => {
    const mappedLabels: Record<string, string> = {};
    for (const user of adminUsers) {
      mappedLabels[user.id] = `${user.username} (${user.email})`;
    }
    for (const key of codes) {
      for (const usage of key.key_usage ?? []) {
        if (!mappedLabels[usage.user_id]) {
          mappedLabels[usage.user_id] = usage.user_id;
        }
      }
    }
    return mappedLabels;
  }, [adminUsers, codes]);

  const hasPrevious = page > 1;
  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    if (pagination.total <= 0) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);
  const hasNext = useMemo(() => {
    if (!pagination) return false;
    return pagination.page * pagination.limit < pagination.total;
  }, [pagination]);

  const activeCodeUsedUserIDs = useMemo(() => {
    if (!activeCode) return [];
    return Array.from(new Set((activeCode.key_usage ?? []).map((usage) => usage.user_id)));
  }, [activeCode]);

  const isActiveCodeLimitReached = useMemo(() => {
    if (!activeCode) return false;
    if (!activeCode.limit_usage || activeCode.limit_usage <= 0) return false;
    return activeCode.usage_count >= activeCode.limit_usage;
  }, [activeCode]);

  const activeCodeLastRedeemedAt = useMemo(() => {
    if (!activeCode?.key_usage?.length) return null;
    return activeCode.key_usage.reduce<string | null>((latest, usage) => {
      const current = usage.created_at;
      if (!latest) return current;
      return new Date(current).getTime() > new Date(latest).getTime() ? current : latest;
    }, null);
  }, [activeCode]);

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

  const handleSendSecretCode = () => {
    if (!activeCode || sendEmailMutation.isPending) return;

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

    const payload =
      recipientMode === "used_user"
        ? { user_id: selectedUserID, note: messageNote.trim() || undefined }
        : { recipient_email: trimmedEmail, recipient_name: customName.trim() || undefined, note: messageNote.trim() || undefined };

    sendEmailMutation.mutate({ premiumCodeId: activeCode.id, payload });
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
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              Refresh
            </Button>
          </div>

          {(isLoading || isFetching) && <PageSkeleton />}

          {typeof roleFromStorage === "undefined" && <PageSkeleton />}

          {!isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is available only for admin and super admin roles.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {isError && (
            <Card>
              <CardHeader>
                <CardTitle>Failed to Load Premium Codes</CardTitle>
                <CardDescription>Please refresh page or try again later.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {!isLoading && !isError && isAdmin && (
            <Card>
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle>All Premium Codes</CardTitle>
                  <CardDescription>
                    Total {pagination?.total ?? 0} code(s), page {pagination?.page ?? 1}.
                  </CardDescription>
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
                                  className="size-7"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void copyText(code.secret_code);
                                  }}
                                  title="Copy secret code"
                                >
                                  <IconCopy className="size-3.5" />
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

                <div className="flex items-center justify-between pt-4 text-sm">
                  <p className="text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={!hasPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={!hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
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
                      className="size-8"
                      onClick={() => void copyText(activeCode.secret_code)}
                    >
                      <IconCopy className="size-4" />
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
                  <IconMailForward className="size-4" />
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
              disabled={!activeCode || sendEmailMutation.isPending || isActiveCodeLimitReached}
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Secret Code"}
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

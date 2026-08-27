"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClipboardOff,
  IconClock,
  IconCopy,
  IconInfinity,
  IconKey,
  IconMailForward,
  IconRefresh,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AdminPremiumCode,
  type AdminPremiumCodeUsage,
  type AdminUserEmailOption,
} from "@/lib/api/auth";
import {
  useAdminPremiumCodesQuery,
  useAdminUserEmailOptionsQuery,
  useSendAdminPremiumCodeEmailMutation,
} from "@/lib/hooks/queries/useAdminQuery";

type RecipientMode = "used_user" | "custom_email";
type DetailTab = "overview" | "usage" | "send";

const PAGE_LIMIT = 10;
const RECIPIENT_PAGE_LIMIT = 20;

export default function AdminPremiumCodesPage() {
  const [roleFromStorage, setRoleFromStorage] = useState<
    string | null | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<AdminPremiumCode | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [usageSearch, setUsageSearch] = useState("");
  const [recipientMode, setRecipientMode] =
    useState<RecipientMode>("used_user");
  const [selectedUserID, setSelectedUserID] = useState("");
  const [selectedRecipientLabel, setSelectedRecipientLabel] = useState("");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientPage, setRecipientPage] = useState(1);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [messageNote, setMessageNote] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setRoleFromStorage(getStoredRole()), 0);
    return () => clearTimeout(timer);
  }, []);

  const isAdmin = roleFromStorage ? isAdminRole(roleFromStorage) : false;
  const {
    data: codesData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminPremiumCodesQuery(page, PAGE_LIMIT);
  const codes = useMemo(() => codesData?.keys ?? [], [codesData?.keys]);
  const pagination = codesData ?? null;

  const debouncedRecipientSearch = useDebouncedValue(recipientSearch, 300);
  const {
    data: recipientData,
    isLoading: recipientLoading,
    isFetching: recipientFetching,
    isError: recipientError,
  } = useAdminUserEmailOptionsQuery(
    recipientPage,
    RECIPIENT_PAGE_LIMIT,
    debouncedRecipientSearch,
    detailOpen && detailTab === "send" && recipientMode === "used_user"
  );
  const recipientOptions = recipientData?.users ?? [];
  const sendEmailMutation = useSendAdminPremiumCodeEmailMutation();

  const userLabelById = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const code of codes) {
      for (const usage of code.key_usage ?? []) {
        labels[usage.user_id] = formatUsageUserLabel(usage);
      }
    }
    return labels;
  }, [codes]);

  const totalPages = useMemo(() => {
    if (!pagination || pagination.total <= 0) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);
  const hasPrevious = page > 1;
  const hasNext = pagination
    ? pagination.page * pagination.limit < pagination.total
    : false;

  const activeCodeUsages = useMemo(() => {
    if (!activeCode) return [];
    const query = usageSearch.trim().toLowerCase();
    return [...(activeCode.key_usage ?? [])]
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() -
          new Date(left.created_at).getTime()
      )
      .filter((usage) => {
        if (!query) return true;
        const label = userLabelById[usage.user_id] || usage.user_id;
        return (
          label.toLowerCase().includes(query) ||
          usage.user_id.toLowerCase().includes(query)
        );
      });
  }, [activeCode, usageSearch, userLabelById]);

  const activeCodeUniqueUsers = useMemo(() => {
    if (!activeCode) return 0;
    return new Set((activeCode.key_usage ?? []).map((usage) => usage.user_id))
      .size;
  }, [activeCode]);

  const activeCodeLastRedeemedAt = useMemo(() => {
    if (!activeCode?.key_usage?.length) return null;
    return activeCode.key_usage.reduce<string | null>((latest, usage) => {
      if (!latest) return usage.created_at;
      return new Date(usage.created_at).getTime() > new Date(latest).getTime()
        ? usage.created_at
        : latest;
    }, null);
  }, [activeCode]);

  const activeCodeExpired = activeCode
    ? isDateInPast(activeCode.valid_until)
    : false;
  const activeCodeLimitReached = activeCode
    ? hasReachedLimit(activeCode)
    : false;

  const openDetailDialog = (code: AdminPremiumCode) => {
    setActiveCode(code);
    setDetailTab("overview");
    setUsageSearch("");
    setRecipientMode("used_user");
    setSelectedUserID("");
    setSelectedRecipientLabel("");
    setRecipientSearch("");
    setRecipientPage(1);
    setCustomEmail("");
    setCustomName("");
    setMessageNote("");
    setDetailOpen(true);
  };

  const handleSendSecretCode = () => {
    if (!activeCode || sendEmailMutation.isPending) return;

    if (activeCodeExpired) {
      toast.error("Code cannot be sent", {
        description: "This premium code has expired.",
      });
      return;
    }
    if (activeCodeLimitReached) {
      toast.error("Code cannot be sent", {
        description: "This premium code has reached its usage limit.",
      });
      return;
    }
    if (recipientMode === "used_user" && !selectedUserID) {
      toast.error("Recipient required", {
        description: "Choose an existing user.",
      });
      return;
    }

    const trimmedEmail = customEmail.trim();
    if (recipientMode === "custom_email" && !trimmedEmail) {
      toast.error("Recipient email required", {
        description: "Enter the email address that should receive this code.",
      });
      return;
    }

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

    sendEmailMutation.mutate(
      { premiumCodeId: activeCode.id, payload },
      {
        onSuccess: () => setDetailOpen(false),
      }
    );
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
        <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Premium codes
                </h1>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Track redemption capacity, review every usage record, and
                  deliver codes without losing context.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
            >
              <IconRefresh
                className={isFetching && !isLoading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </header>

          {(isLoading || typeof roleFromStorage === "undefined") && (
            <PageSkeleton />
          )}

          {typeof roleFromStorage !== "undefined" && !isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>
                  This ledger is available only to admins and super admins.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isError && (
            <Card>
              <CardHeader>
                <CardTitle>Premium codes could not be loaded</CardTitle>
                <CardDescription>
                  Refresh the page. If the issue continues, check the API
                  connection.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {!isLoading && !isError && isAdmin && (
            <Card className="min-w-0 overflow-hidden py-0">
              <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Code inventory</CardTitle>
                    <CardDescription className="mt-1">
                      {pagination?.total ?? 0} codes · newest first
                    </CardDescription>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select a code to inspect its ledger
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {codes.length === 0 ? (
                  <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-6 text-center">
                    <div className="grid size-10 place-items-center rounded-full bg-muted">
                      <IconKey className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No premium codes yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Generated premium codes will appear here with their
                      redemption activity.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 p-4 xl:hidden">
                      {codes.map((code) => (
                        <PremiumCodeMobileCard
                          key={code.id}
                          code={code}
                          usedBy={getUsedByLabels(code, userLabelById)}
                          onOpen={() => openDetailDialog(code)}
                        />
                      ))}
                    </div>

                    <div className="hidden xl:block">
                      <Table className="min-w-[920px]">
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[270px] pl-5 md:pl-6">
                              Code
                            </TableHead>
                            <TableHead className="w-[220px]">Capacity</TableHead>
                            <TableHead>Validity</TableHead>
                            <TableHead>Redeemers</TableHead>
                            <TableHead>Last updated</TableHead>
                            <TableHead className="w-12 pr-5 md:pr-6">
                              <span className="sr-only">Open details</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {codes.map((code) => {
                            const usedBy = getUsedByLabels(code, userLabelById);
                            const status = getCodeStatus(code);
                            const copyDisabled =
                              status.label === "Expired" ||
                              status.label === "Fully redeemed";

                            return (
                              <TableRow key={code.id} className="group">
                                <TableCell className="py-4 pl-5 md:pl-6">
                                  <div className="flex items-start gap-2">
                                    <div className="min-w-0 space-y-2">
                                      <button
                                        type="button"
                                        className="block max-w-[210px] truncate rounded text-left font-mono text-xs font-semibold tracking-wide outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                                        onClick={() => openDetailDialog(code)}
                                        title={code.secret_code}
                                      >
                                        {code.secret_code}
                                      </button>
                                      <StatusBadge
                                        tone={status.tone}
                                        className="text-[11px]"
                                      >
                                        {status.label}
                                      </StatusBadge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 shrink-0 opacity-60 group-hover:opacity-100"
                                      disabled={copyDisabled}
                                      onClick={() =>
                                        void copyText(code.secret_code)
                                      }
                                      title={
                                        copyDisabled
                                          ? status.label
                                          : "Copy premium code"
                                      }
                                    >
                                      {copyDisabled ? (
                                        <IconClipboardOff className="size-3.5" />
                                      ) : (
                                        <IconCopy className="size-3.5" />
                                      )}
                                      <span className="sr-only">
                                        Copy premium code
                                      </span>
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <CapacityMeter code={code} compact />
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      {formatDate(code.valid_until, code.is_lifetime)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {getValidityLabel(code.valid_until, code.is_lifetime)}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <RedeemerPreview labels={usedBy} />
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      {formatDate(code.updated_at)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatTime(code.updated_at)}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 pr-5 text-right md:pr-6">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => openDetailDialog(code)}
                                    title="Open code details"
                                  >
                                    <IconChevronRight className="size-4" />
                                    <span className="sr-only">
                                      Open code details
                                    </span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between md:px-6">
                  <p className="text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex w-full gap-2 min-[420px]:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-[420px]:flex-none"
                      onClick={() =>
                        setPage((previous) => Math.max(1, previous - 1))
                      }
                      disabled={!hasPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-[420px]:flex-none"
                      onClick={() =>
                        setPage((previous) =>
                          Math.min(totalPages, previous + 1)
                        )
                      }
                      disabled={!hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex h-dvh max-h-none w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-3xl sm:rounded-lg sm:border">
          {activeCode && (
            <>
              <DialogHeader className="shrink-0 border-b px-4 pb-4 pt-5 pr-12 text-left sm:px-5 sm:pb-5 sm:pt-6 md:px-6 md:pr-14">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <DialogTitle>Premium code ledger</DialogTitle>
                    <DialogDescription className="mt-1">
                      Review capacity and redemption history before sharing this
                      code.
                    </DialogDescription>
                  </div>
                  <StatusBadge
                    tone={getCodeStatus(activeCode).tone}
                    className="w-fit shrink-0"
                  >
                    {getCodeStatus(activeCode).label}
                  </StatusBadge>
                </div>
                <div className="mt-1 flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs font-semibold tracking-wide">
                    {activeCode.secret_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    disabled={activeCodeExpired || activeCodeLimitReached}
                    onClick={() => void copyText(activeCode.secret_code)}
                    title="Copy premium code"
                  >
                    {activeCodeExpired || activeCodeLimitReached ? (
                      <IconClipboardOff className="size-4" />
                    ) : (
                      <IconCopy className="size-4" />
                    )}
                    <span className="sr-only">Copy premium code</span>
                  </Button>
                </div>
              </DialogHeader>

              <Tabs
                value={detailTab}
                onValueChange={(value) => setDetailTab(value as DetailTab)}
                className="min-h-0 flex-1 gap-0"
              >
                <div className="shrink-0 border-b px-4 py-3 sm:px-5 md:px-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="px-1 text-xs sm:text-sm">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="px-1 text-xs sm:text-sm">
                      Usage
                      <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] tabular-nums">
                        {activeCode.usage_count}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="send" className="px-1 text-xs sm:text-sm">
                      Send code
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <TabsContent
                    value="overview"
                    className="m-0 space-y-5 px-4 py-5 sm:px-5 md:px-6"
                  >
                    <CapacityMeter code={activeCode} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Metric
                        icon={<IconUsers />}
                        label="Unique redeemers"
                        value={String(activeCodeUniqueUsers)}
                        detail={`${activeCode.usage_count} total redemption${
                          activeCode.usage_count === 1 ? "" : "s"
                        }`}
                      />
                      <Metric
                        icon={<IconClock />}
                        label="Last redeemed"
                        value={
                          activeCodeLastRedeemedAt
                            ? formatDate(activeCodeLastRedeemedAt)
                            : "Never"
                        }
                        detail={
                          activeCodeLastRedeemedAt
                            ? formatTime(activeCodeLastRedeemedAt)
                            : "No usage recorded"
                        }
                      />
                      <Metric
                        icon={<IconCalendar />}
                        label="Valid until"
                        value={formatDate(activeCode.valid_until, activeCode.is_lifetime)}
                        detail={getValidityLabel(activeCode.valid_until, activeCode.is_lifetime)}
                      />
                      <Metric
                        icon={<IconKey />}
                        label="Created"
                        value={formatDate(activeCode.created_at)}
                        detail={formatTime(activeCode.created_at)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="usage"
                    className="m-0 space-y-4 px-4 py-5 sm:px-5 md:px-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Redemption history
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Every redemption is listed individually, newest first.
                        </p>
                      </div>
                      <div className="relative w-full sm:w-72">
                        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={usageSearch}
                          onChange={(event) =>
                            setUsageSearch(event.target.value)
                          }
                          placeholder="Search user or email"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {(activeCode.key_usage ?? []).length === 0 ? (
                      <UsageEmptyState />
                    ) : activeCodeUsages.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                        <p className="text-sm font-medium">
                          No matching redemption
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Try a different username, email, or user ID.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border">
                        {activeCodeUsages.map((usage, index) => (
                          <UsageRow
                            key={usage.id}
                            usage={usage}
                            label={
                              userLabelById[usage.user_id] || usage.user_id
                            }
                            showBorder={index < activeCodeUsages.length - 1}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="send"
                    className="m-0 space-y-5 px-4 py-5 sm:px-5 md:px-6"
                  >
                    {activeCodeExpired || activeCodeLimitReached ? (
                      <Alert variant="destructive">
                        <IconClipboardOff />
                        <AlertTitle>This code cannot be sent</AlertTitle>
                        <AlertDescription>
                          {activeCodeExpired
                            ? "The premium code has expired."
                            : "The premium code has reached its redemption limit."}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div>
                          <p className="flex items-center gap-2 text-sm font-medium">
                            <IconMailForward className="size-4" />
                            Delivery details
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            The dialog closes automatically after the email is
                            delivered.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid min-w-0 content-start gap-2">
                            <Label>Recipient type</Label>
                            <Select
                              value={recipientMode}
                              onValueChange={(value) =>
                                setRecipientMode(value as RecipientMode)
                              }
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue placeholder="Select recipient type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="used_user">
                                  Existing user
                                </SelectItem>
                                <SelectItem value="custom_email">
                                  Custom email
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {recipientMode === "used_user" ? (
                            <div className="grid min-w-0 content-start gap-2">
                              <Label>Select user</Label>
                              <RecipientPicker
                                open={recipientPickerOpen}
                                onOpenChange={setRecipientPickerOpen}
                                selectedUserID={selectedUserID}
                                selectedLabel={selectedRecipientLabel}
                                options={recipientOptions}
                                search={recipientSearch}
                                onSearchChange={(value) => {
                                  setRecipientSearch(value);
                                  setRecipientPage(1);
                                }}
                                onSelect={(user) => {
                                  setSelectedUserID(user.id);
                                  setSelectedRecipientLabel(
                                    `${user.username} (${user.email})`
                                  );
                                  setRecipientPickerOpen(false);
                                }}
                                page={recipientData?.page ?? recipientPage}
                                totalPages={Math.max(
                                  1,
                                  recipientData?.total_pages ?? 1
                                )}
                                onPrevious={() =>
                                  setRecipientPage((previous) =>
                                    Math.max(1, previous - 1)
                                  )
                                }
                                onNext={() =>
                                  setRecipientPage((previous) => previous + 1)
                                }
                                isLoading={recipientLoading}
                                isFetching={recipientFetching}
                                isError={recipientError}
                              />
                              <p className="text-xs text-muted-foreground">
                                Only eligible non-premium users are shown.
                              </p>
                            </div>
                          ) : (
                            <div className="grid content-start gap-2">
                              <Label htmlFor="recipient_email">
                                Recipient email
                              </Label>
                              <Input
                                id="recipient_email"
                                type="email"
                                placeholder="name@company.com"
                                value={customEmail}
                                onChange={(event) =>
                                  setCustomEmail(event.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>

                        {recipientMode === "custom_email" && (
                          <div className="grid gap-2">
                            <Label htmlFor="recipient_name">
                              Recipient name{" "}
                              <span className="text-muted-foreground">
                                (optional)
                              </span>
                            </Label>
                            <Input
                              id="recipient_name"
                              placeholder="Jane Doe"
                              value={customName}
                              onChange={(event) =>
                                setCustomName(event.target.value)
                              }
                            />
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="message_note">
                            Message{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <textarea
                            id="message_note"
                            className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Add context for the recipient"
                            value={messageNote}
                            onChange={(event) =>
                              setMessageNote(event.target.value)
                            }
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              <DialogFooter className="shrink-0 border-t bg-muted/20 px-4 py-4 sm:px-5 md:px-6 [&_button]:w-full sm:[&_button]:w-auto">
                {detailTab !== "send" && (
                  <Button
                    variant="outline"
                    onClick={() => setDetailOpen(false)}
                    disabled={sendEmailMutation.isPending}
                  >
                    Close
                  </Button>
                )}
                {detailTab === "send" && (
                  <Button
                    onClick={handleSendSecretCode}
                    disabled={
                      sendEmailMutation.isPending ||
                      activeCodeExpired ||
                      activeCodeLimitReached
                    }
                  >
                    <IconMailForward />
                    {sendEmailMutation.isPending
                      ? "Sending..."
                      : "Send premium code"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function RecipientPicker({
  open,
  onOpenChange,
  selectedUserID,
  selectedLabel,
  options,
  search,
  onSearchChange,
  onSelect,
  page,
  totalPages,
  onPrevious,
  onNext,
  isLoading,
  isFetching,
  isError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserID: string;
  selectedLabel: string;
  options: AdminUserEmailOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (user: AdminUserEmailOption) => void;
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full min-w-0 justify-between font-normal"
        >
          <span
            className={
              selectedLabel
                ? "truncate"
                : "truncate text-muted-foreground"
            }
          >
            {selectedLabel || "Search eligible user"}
          </span>
          <IconChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="border-b p-3">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search username or email"
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="h-56">
          <div className="p-1.5">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : isError ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium">Users could not be loaded</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Close the picker and try again.
                </p>
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-medium">No eligible users found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try another username or email.
                </p>
              </div>
            ) : (
              options.map((user) => {
                const label = `${user.username} (${user.email})`;
                const selected = user.id === selectedUserID;
                return (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onSelect(user)}
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(user.username)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {user.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {selected && (
                      <IconCheck
                        className="size-4 shrink-0 text-primary"
                        aria-label={`${label} selected`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
            {isFetching && !isLoading ? " · updating" : ""}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={page >= totalPages || isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PremiumCodeMobileCard({
  code,
  usedBy,
  onOpen,
}: {
  code: AdminPremiumCode;
  usedBy: string[];
  onOpen: () => void;
}) {
  const status = getCodeStatus(code);
  const copyDisabled =
    status.label === "Expired" || status.label === "Fully redeemed";

  return (
    <article className="min-w-0 space-y-4 rounded-lg border p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <button
            type="button"
            className="block max-w-full truncate rounded text-left font-mono text-xs font-semibold tracking-wide outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onOpen}
            title={code.secret_code}
          >
            {code.secret_code}
          </button>
          <StatusBadge tone={status.tone} className="text-[11px]">
            {status.label}
          </StatusBadge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={copyDisabled}
            onClick={() => void copyText(code.secret_code)}
            title={copyDisabled ? status.label : "Copy premium code"}
          >
            {copyDisabled ? (
              <IconClipboardOff className="size-4" />
            ) : (
              <IconCopy className="size-4" />
            )}
            <span className="sr-only">Copy premium code</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onOpen}
            title="Open code details"
          >
            <IconChevronRight className="size-4" />
            <span className="sr-only">Open code details</span>
          </Button>
        </div>
      </div>

      <CapacityMeter code={code} compact />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3">
        <div className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">Validity</dt>
          <dd className="truncate text-sm font-medium">
            {formatDate(code.valid_until, code.is_lifetime)}
          </dd>
          <dd className="truncate text-xs text-muted-foreground">
            {getValidityLabel(code.valid_until, code.is_lifetime)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">Last updated</dt>
          <dd className="truncate text-sm font-medium">
            {formatDate(code.updated_at)}
          </dd>
          <dd className="truncate text-xs text-muted-foreground">
            {formatTime(code.updated_at)}
          </dd>
        </div>
      </dl>

      <div className="min-w-0 border-t pt-3">
        <p className="mb-1.5 text-[11px] text-muted-foreground">Redeemers</p>
        <RedeemerPreview labels={usedBy} />
      </div>
    </article>
  );
}

function CapacityMeter({
  code,
  compact = false,
}: {
  code: AdminPremiumCode;
  compact?: boolean;
}) {
  const limit = code.limit_usage ?? 0;
  const unlimited = limit <= 0;
  const percentage = unlimited
    ? 0
    : Math.min(100, Math.round((code.usage_count / limit) * 100));

  return (
    <div
      className={
        compact
          ? "w-full space-y-2"
          : "rounded-xl border bg-muted/20 p-4 md:p-5"
      }
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          {!compact && (
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Redemption capacity
            </p>
          )}
          <p className={compact ? "text-sm font-medium" : "text-2xl font-semibold"}>
            {code.usage_count}
            <span
              className={
                compact
                  ? "font-normal text-muted-foreground"
                  : "ml-1 text-base font-normal text-muted-foreground"
              }
            >
              {unlimited ? " used" : ` / ${limit}`}
            </span>
          </p>
        </div>
        {unlimited ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconInfinity className="size-4" />
            No limit
          </span>
        ) : (
          <span className="text-xs tabular-nums text-muted-foreground">
            {percentage}%
          </span>
        )}
      </div>
      {!unlimited && (
        <Progress
          value={percentage}
          className={compact ? "h-1.5" : "h-2"}
          indicatorClassName={
            percentage >= 100
              ? "bg-red-500"
              : percentage >= 80
                ? "bg-amber-500"
                : "bg-primary"
          }
        />
      )}
      {!compact && (
        <p className="text-xs text-muted-foreground">
          {unlimited
            ? "This code can be redeemed without a fixed usage ceiling."
            : `${Math.max(0, limit - code.usage_count)} redemption${
                Math.max(0, limit - code.usage_count) === 1 ? "" : "s"
              } remaining.`}
        </p>
      )}
    </div>
  );
}

function RedeemerPreview({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <span className="text-xs text-muted-foreground">No usage yet</span>;
  }

  return (
    <div className="max-w-56 space-y-1">
      {labels.slice(0, 2).map((label) => (
        <p key={label} className="truncate text-xs" title={label}>
          {label}
        </p>
      ))}
      {labels.length > 2 && (
        <p className="text-xs font-medium text-primary">
          +{labels.length - 2} more
        </p>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium" title={value}>
          {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function UsageRow({
  usage,
  label,
  showBorder,
}: {
  usage: AdminPremiumCodeUsage;
  label: string;
  showBorder: boolean;
}) {
  const displayName = label.split(" (")[0] || label;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 ${
        showBorder ? "border-b" : ""
      }`}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(displayName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={label}>
          {label}
        </p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {usage.user_id}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs">{formatDate(usage.created_at)}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatTime(usage.created_at)}
        </p>
      </div>
    </div>
  );
}

function UsageEmptyState() {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted">
        <IconUsers className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">No redemptions yet</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        The first redemption will appear here with its user and timestamp.
      </p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden py-0">
      <CardHeader className="border-b px-4 py-5 sm:px-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <div className="space-y-3 p-4 xl:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-40 max-w-[65%]" />
                <Skeleton className="size-8" />
              </div>
              <Skeleton className="h-2 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden xl:block">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-6 border-b px-6 py-4 last:border-0"
            >
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getUsedByLabels(
  code: AdminPremiumCode,
  userLabelById: Record<string, string>
): string[] {
  const labels = (code.key_usage ?? []).map(
    (usage) => userLabelById[usage.user_id] || usage.user_id
  );
  return Array.from(new Set(labels));
}

function formatUsageUserLabel(usage: AdminPremiumCodeUsage): string {
  if (usage.username && usage.email) {
    return `${usage.username} (${usage.email})`;
  }
  return usage.username || usage.email || usage.user_id;
}

function getCodeStatus(code: AdminPremiumCode): {
  label: "Active" | "Expired" | "Fully redeemed";
  tone: StatusBadgeTone;
} {
  if (!code.is_lifetime && isDateInPast(code.valid_until)) {
    return { label: "Expired", tone: "danger" };
  }
  if (hasReachedLimit(code)) {
    return { label: "Fully redeemed", tone: "warning" };
  }
  return { label: "Active", tone: "success" };
}

function hasReachedLimit(code: AdminPremiumCode): boolean {
  const limit = code.limit_usage ?? 0;
  return limit > 0 && code.usage_count >= limit;
}

function isDateInPast(value?: string | null): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
}

function getValidityLabel(value?: string | null, isLifetime?: boolean): string {
  if (isLifetime) return "Lifetime";
  if (!value) return "No expiration";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  if (parsed.getTime() < Date.now()) return "Expired";

  const days = Math.ceil((parsed.getTime() - Date.now()) / 86_400_000);
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

function formatDate(value?: string | null, isLifetime?: boolean): string {
  if (isLifetime) return "Lifetime";
  if (!value) return "No expiration";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(value: string): string {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Code copied", {
      description: "The premium code is ready to paste.",
    });
  } catch {
    toast.error("Code could not be copied", {
      description: "Copy the code manually and try again.",
    });
  }
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { role?: string };
    const normalized = parsed.role?.trim().toLowerCase();
    return normalized || null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

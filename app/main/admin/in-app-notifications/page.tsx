"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  IconArchive,
  IconCalendarClock,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconSend,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { useAuth } from "@/app/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import { InAppAnnouncementPreview } from "@/components/notifications/in-app-announcement-preview";
import { SiteHeader } from "@/components/site-header";
import {
  NotificationComposer,
  NotificationDetailPanel,
  NotificationEmptyState,
  NotificationPagination,
  NotificationRowMenu,
  NotificationSummary,
  NotificationWorkspaceHeader,
} from "@/components/notifications/notification-workspace";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AnnouncementAudience,
  AdminInAppAnnouncement,
  AnnouncementReader,
  AnnouncementPayload,
  InAppAnnouncementStatus,
} from "@/lib/api/admin-in-app-announcements";
import {
  useAdminInAppAnnouncementQuery,
  useAdminInAppAnnouncementAudienceQuery,
  useAdminInAppAnnouncementsQuery,
  useArchiveAdminInAppAnnouncementMutation,
  useCreateAdminInAppAnnouncementMutation,
  useDeleteAdminInAppAnnouncementMutation,
  usePublishAdminInAppAnnouncementMutation,
  useUpdateAdminInAppAnnouncementMutation,
} from "@/lib/hooks/queries/useAdminInAppAnnouncementsQuery";

const PAGE_LIMIT = 10;
const TITLE_MAX_LENGTH = 100;
const BODY_MAX_LENGTH = 300;
const HREF_MAX_LENGTH = 150;

const EMPTY_FORM: AnnouncementDraft = {
  title: "",
  body: "",
  href: "",
  startAt: "",
  endsAt: "",
};

interface AnnouncementDraft {
  title: string;
  body: string;
  href: string;
  startAt: string;
  endsAt: string;
}

type ConfirmationAction =
  | { type: "archive"; announcement: AdminInAppAnnouncement }
  | { type: "delete"; announcement: AdminInAppAnnouncement }
  | null;

export default function AdminInAppNotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const role = user?.role?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InAppAnnouncementStatus | "all">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AdminInAppAnnouncement | null>(
    null,
  );
  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY_FORM);
  const [createStatus, setCreateStatus] = useState<"draft" | "published">("draft");
  const [detailID, setDetailID] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("overview");
  const [audienceStatus, setAudienceStatus] = useState<"read" | "unread">("read");
  const [audiencePage, setAudiencePage] = useState(1);
  const [confirmation, setConfirmation] = useState<ConfirmationAction>(null);

  const statusQuery = statusFilter === "all" ? "" : statusFilter;
  const announcementsQuery = useAdminInAppAnnouncementsQuery(
    page,
    PAGE_LIMIT,
    statusQuery,
    isAdmin,
  );
  const detailQuery = useAdminInAppAnnouncementQuery(detailID, detailOpen && isAdmin);

  const createMutation = useCreateAdminInAppAnnouncementMutation();
  const updateMutation = useUpdateAdminInAppAnnouncementMutation();
  const publishMutation = usePublishAdminInAppAnnouncementMutation();
  const archiveMutation = useArchiveAdminInAppAnnouncementMutation();
  const deleteMutation = useDeleteAdminInAppAnnouncementMutation();

  const announcements = useMemo(
    () => announcementsQuery.data?.announcements ?? [],
    [announcementsQuery.data?.announcements],
  );
  const totalPages = Math.max(announcementsQuery.data?.total_pages ?? 1, 1);
  const counts = announcementsQuery.data?.status_counts ?? {};
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedAnnouncement = detailQuery.data;
  const busy = publishMutation.isPending || archiveMutation.isPending || deleteMutation.isPending;

  const openCreate = () => {
    setEditingAnnouncement(null);
    setDraft(EMPTY_FORM);
    setCreateStatus("draft");
    setDetailOpen(false);
    setEditorOpen(true);
  };

  const openEdit = (announcement: AdminInAppAnnouncement) => {
    setEditingAnnouncement(announcement);
    setDraft({
      title: announcement.title,
      body: announcement.body,
      href: announcement.href ?? "",
      startAt: toLocalInputValue(announcement.start_at),
      endsAt: toLocalInputValue(announcement.ends_at),
    });
    setDetailOpen(false);
    setEditorOpen(true);
  };

  const openDetail = (announcement: AdminInAppAnnouncement, tab = "overview") => {
    setDetailID(announcement.id);
    setDetailTab(tab);
    setAudienceStatus("read");
    setAudiencePage(1);
    setDetailOpen(true);
  };

  const changeStatusFilter = (value: string) => {
    setStatusFilter(value as InAppAnnouncementStatus | "all");
    setPage(1);
  };

  const saveAnnouncement = async () => {
    const payload = buildPayload(draft);
    if (!payload) {
      return;
    }

    try {
      if (editingAnnouncement) {
        await updateMutation.mutateAsync({ id: editingAnnouncement.id, payload });
        toast.success("Announcement updated");
      } else {
        await createMutation.mutateAsync({
          ...payload,
          status: createStatus,
          published_at: createStatus === "published" ? publicationTimestamp(payload) : null,
        });
        toast.success(
          createStatus === "published" ? "Announcement published" : "Draft announcement created",
        );
      }
      setEditorOpen(false);
    } catch (error) {
      showError("Announcement could not be saved", error);
    }
  };

  const togglePublished = async (announcement: AdminInAppAnnouncement) => {
    try {
      if (announcement.status === "published") {
        await archiveMutation.mutateAsync(announcement.id);
        toast.success("Announcement archived", {
          description: "It no longer appears for any account.",
        });
        return;
      }
      await publishMutation.mutateAsync(announcement.id);
      toast.success("Announcement published");
    } catch (error) {
      showError("Announcement status could not be changed", error);
    }
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    try {
      if (confirmation.type === "archive") {
        await archiveMutation.mutateAsync(confirmation.announcement.id);
        toast.success("Announcement archived");
      } else {
        await deleteMutation.mutateAsync(confirmation.announcement.id);
        toast.success("Announcement deleted");
        if (detailID === confirmation.announcement.id) {
          setDetailOpen(false);
        }
      }
      setConfirmation(null);
    } catch (error) {
      showError(
        confirmation.type === "archive"
          ? "Announcement could not be archived"
          : "Announcement could not be deleted",
        error,
      );
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
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
          <NotificationWorkspaceHeader
            channel="in-app"
            onCreate={openCreate}
            onRefresh={() => void announcementsQuery.refetch()}
            refreshing={announcementsQuery.isFetching}
            canCreate={isAdmin}
          />

          {authLoading ? (
            <PageSkeleton />
          ) : !isAdmin ? (
            <NotificationEmptyState
              title="Admin access required"
              description="Sign in with an administrator account to manage announcements."
            />
          ) : (
            <div className="-mt-6">
              <NotificationSummary
                items={[
                  {
                    label: "announcements",
                    value: Object.values(counts).reduce((total, value) => total + value, 0),
                  },
                  { label: "published", value: counts.published ?? 0 },
                  { label: "drafts", value: counts.draft ?? 0 },
                  { label: "archived", value: counts.archived ?? 0 },
                ]}
                note="Published messages follow their visibility window."
              />
              <section aria-label="In-app announcements" className="pt-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Announcements</h2>
                    <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                      Open a message to preview it or review its readers.
                    </p>
                  </div>
                  <Select value={statusFilter} onValueChange={changeStatusFilter}>
                    <SelectTrigger aria-label="Announcement status filter" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className="overflow-hidden rounded-xl border"
                  aria-busy={announcementsQuery.isFetching}
                >
                  {announcementsQuery.isLoading ? (
                    <div className="p-5">
                      <TableSkeleton />
                    </div>
                  ) : announcementsQuery.isError ? (
                    <NotificationEmptyState
                      title="Announcements could not be loaded"
                      description={announcementsQuery.error.message || "Please try again."}
                      action={
                        <Button variant="outline" onClick={() => void announcementsQuery.refetch()}>
                          Retry
                        </Button>
                      }
                    />
                  ) : announcements.length === 0 ? (
                    <NotificationEmptyState
                      title={
                        statusFilter === "all"
                          ? "Your next update starts here"
                          : "No announcements with this status"
                      }
                      description={
                        statusFilter === "all"
                          ? "Create a short product notice. Preview it, choose its visibility window, then publish when ready."
                          : "Choose another status to find your announcements."
                      }
                      action={
                        statusFilter === "all" ? (
                          <Button onClick={openCreate}>
                            <IconPlus className="size-4" />
                            Create announcement
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => changeStatusFilter("all")}>
                            Show all announcements
                          </Button>
                        )
                      }
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="pl-5">Announcement</TableHead>
                          <TableHead className="hidden sm:table-cell">Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Visibility window</TableHead>
                          <TableHead className="hidden sm:table-cell">Readers</TableHead>
                          <TableHead className="w-14">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {announcements.map((announcement) => (
                          <AnnouncementRow
                            key={announcement.id}
                            announcement={announcement}
                            busy={busy}
                            onView={() => openDetail(announcement)}
                            onAudience={() => openDetail(announcement, "audience")}
                            onEdit={() => openEdit(announcement)}
                            onPublishOrArchive={() => void togglePublished(announcement)}
                            onDelete={() => setConfirmation({ type: "delete", announcement })}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                <NotificationPagination
                  page={page}
                  totalPages={totalPages}
                  total={announcementsQuery.data?.total ?? 0}
                  busy={announcementsQuery.isFetching}
                  onPageChange={setPage}
                />
              </section>
            </div>
          )}
        </div>
      </SidebarInset>

      <AnnouncementEditorDialog
        key={editorOpen ? (editingAnnouncement?.id ?? "new") : "closed"}
        open={editorOpen}
        announcement={editingAnnouncement}
        draft={draft}
        createStatus={createStatus}
        saving={isSaving}
        onOpenChange={setEditorOpen}
        onDraftChange={setDraft}
        onCreateStatusChange={setCreateStatus}
        onSubmit={() => void saveAnnouncement()}
      />

      <AnnouncementDetailDialog
        open={detailOpen}
        announcement={selectedAnnouncement}
        loading={detailQuery.isLoading}
        error={detailQuery.error}
        onRetry={() => void detailQuery.refetch()}
        busy={busy}
        tab={detailTab}
        onTabChange={setDetailTab}
        audienceStatus={audienceStatus}
        onAudienceStatusChange={(status) => {
          setAudienceStatus(status);
          setAudiencePage(1);
        }}
        audiencePage={audiencePage}
        onAudiencePageChange={setAudiencePage}
        onOpenChange={setDetailOpen}
        onEdit={() => selectedAnnouncement && openEdit(selectedAnnouncement)}
        onPublishOrArchive={() =>
          selectedAnnouncement ? void togglePublished(selectedAnnouncement) : undefined
        }
        onArchive={() =>
          selectedAnnouncement &&
          setConfirmation({ type: "archive", announcement: selectedAnnouncement })
        }
      />

      <AlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation?.type === "archive"
                ? "Archive this announcement?"
                : "Delete this announcement?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.type === "archive"
                ? "The announcement stops appearing for every account, including accounts that never dismissed it."
                : "This permanently removes the announcement and every dismissal record tied to it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep announcement</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmAction()}
              disabled={archiveMutation.isPending || deleteMutation.isPending}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

function AnnouncementRow({
  announcement,
  busy,
  onView,
  onAudience,
  onEdit,
  onPublishOrArchive,
  onDelete,
}: {
  announcement: AdminInAppAnnouncement;
  busy: boolean;
  onView: () => void;
  onAudience: () => void;
  onEdit: () => void;
  onPublishOrArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="group">
      <TableCell className="max-w-sm py-4 pl-5">
        <button
          type="button"
          onClick={onView}
          className="block w-full min-w-40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-56"
        >
          <span className="block text-sm font-medium group-hover:text-primary-ink">
            {announcement.title}
          </span>
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
            {announcement.body}
          </span>
          <span className="mt-2 inline-flex sm:hidden">
            <AnnouncementStatusBadge
              status={announcement.status}
              scheduled={isScheduled(announcement)}
            />
          </span>
        </button>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <AnnouncementStatusBadge
          status={announcement.status}
          scheduled={isScheduled(announcement)}
        />
      </TableCell>
      <TableCell className="hidden text-xs leading-5 text-muted-foreground lg:table-cell">
        <p>{scheduleWindow(announcement)}</p>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <button
          type="button"
          onClick={onAudience}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm tabular-nums hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View readers of ${announcement.title}`}
        >
          <IconUsers className="size-4 text-muted-foreground" />
          {(announcement.read_count ?? 0).toLocaleString()}
        </button>
      </TableCell>
      <TableCell className="pr-3">
        <NotificationRowMenu label={announcement.title} disabled={busy}>
          <DropdownMenuItem onSelect={onView}>
            <IconEye />
            View announcement
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onAudience}>
            <IconUsers />
            View readers
          </DropdownMenuItem>
          {announcement.status === "draft" && (
            <DropdownMenuItem onSelect={onEdit}>
              <IconPencil />
              Edit draft
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onPublishOrArchive}>
            {announcement.status === "published" ? <IconArchive /> : <IconSend />}
            {announcement.status === "published" ? "Archive" : "Publish"}
          </DropdownMenuItem>
          {announcement.status !== "published" && (
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <IconTrash />
              Delete
            </DropdownMenuItem>
          )}
        </NotificationRowMenu>
      </TableCell>
    </TableRow>
  );
}

function AnnouncementEditorDialog({
  open,
  announcement,
  draft,
  createStatus,
  saving,
  onOpenChange,
  onDraftChange,
  onCreateStatusChange,
  onSubmit,
}: {
  open: boolean;
  announcement: AdminInAppAnnouncement | null;
  draft: AnnouncementDraft;
  createStatus: "draft" | "published";
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: AnnouncementDraft) => void;
  onCreateStatusChange: (status: "draft" | "published") => void;
  onSubmit: () => void;
}) {
  const update = (field: keyof AnnouncementDraft, value: string) =>
    onDraftChange({ ...draft, [field]: value });
  const initialDraft = announcement
    ? {
        title: announcement.title,
        body: announcement.body,
        href: announcement.href ?? "",
        startAt: toLocalInputValue(announcement.start_at),
        endsAt: toLocalInputValue(announcement.ends_at),
      }
    : EMPTY_FORM;
  const dirty =
    JSON.stringify(initialDraft) !== JSON.stringify(draft) ||
    (!announcement && createStatus !== "draft");
  return (
    <NotificationComposer
      open={open}
      onOpenChange={onOpenChange}
      title={announcement ? "Edit announcement" : "New announcement"}
      description="A short update for your users. Choose when it appears in their dashboard."
      saving={saving}
      dirty={dirty}
      onSubmit={onSubmit}
      submitLabel={
        announcement
          ? "Save changes"
          : createStatus === "published"
            ? "Publish announcement"
            : "Save draft"
      }
      preview={<InAppAnnouncementPreview title={draft.title} body={draft.body} href={draft.href} />}
    >
      <div className="grid gap-2">
        <Label htmlFor="announcement-title">Title</Label>
        <Input
          id="announcement-title"
          value={draft.title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => update("title", event.target.value)}
          placeholder="API request limits have changed"
        />
        <p className="text-right text-xs text-muted-foreground">
          {draft.title.length}/{TITLE_MAX_LENGTH}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="announcement-body">Message</Label>
        <textarea
          id="announcement-body"
          value={draft.body}
          maxLength={BODY_MAX_LENGTH}
          onChange={(event) => update("body", event.target.value)}
          placeholder="Free accounts now allow 60 requests per minute."
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring min-h-24 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
        />
        <p className="text-right text-xs text-muted-foreground">
          {draft.body.length}/{BODY_MAX_LENGTH}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="announcement-href">Link</Label>
        <Input
          id="announcement-href"
          type="url"
          value={draft.href}
          maxLength={HREF_MAX_LENGTH}
          onChange={(event) => update("href", event.target.value)}
          placeholder="https://lihat.in/main/api-integrations/docs"
        />
        <p className="text-xs text-muted-foreground">
          Optional. Add a full HTTP or HTTPS URL for users to open.
        </p>
      </div>

      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="announcement-start-at">Starts at</Label>
          <Input
            id="announcement-start-at"
            type="datetime-local"
            value={draft.startAt}
            onChange={(event) => update("startAt", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to start as soon as it is published.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="announcement-ends-at">Ends at</Label>
          <Input
            id="announcement-ends-at"
            type="datetime-local"
            value={draft.endsAt}
            onChange={(event) => update("endsAt", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty for no expiry. It stays available until archived.
          </p>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Times use your browser’s local timezone.
        </p>
      </div>

      {announcement ? (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Visibility is controlled separately. Use publish or archive from the announcement list.
        </p>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="announcement-status">After saving</Label>
          <Select
            value={createStatus}
            onValueChange={(value) => onCreateStatusChange(value as "draft" | "published")}
          >
            <SelectTrigger id="announcement-status" aria-label="After saving">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Save as draft</SelectItem>
              <SelectItem value="published">Publish using this schedule</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {createStatus === "published"
              ? "Users inside the schedule window see it right away."
              : "Drafts stay invisible until you publish them."}
          </p>
        </div>
      )}
    </NotificationComposer>
  );
}

function AnnouncementDetailDialog({
  open,
  announcement,
  loading,
  error,
  onRetry,
  busy,
  tab,
  onTabChange,
  audienceStatus,
  onAudienceStatusChange,
  audiencePage,
  onAudiencePageChange,
  onOpenChange,
  onEdit,
  onPublishOrArchive,
  onArchive,
}: {
  open: boolean;
  announcement?: AdminInAppAnnouncement;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  busy: boolean;
  tab: string;
  onTabChange: (tab: string) => void;
  audienceStatus: "read" | "unread";
  onAudienceStatusChange: (status: "read" | "unread") => void;
  audiencePage: number;
  onAudiencePageChange: (page: number) => void;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onPublishOrArchive: () => void;
  onArchive: () => void;
}) {
  const audienceQuery = useAdminInAppAnnouncementAudienceQuery(
    announcement?.id ?? "",
    audienceStatus,
    audiencePage,
    PAGE_LIMIT,
    open && Boolean(announcement) && tab === "audience",
  );

  return (
    <NotificationDetailPanel
      open={open}
      onOpenChange={onOpenChange}
      title={announcement?.title ?? "Announcement details"}
      description="Preview the message, check its schedule, and see who has read it."
    >
      {error ? (
        <NotificationEmptyState
          title="Announcement could not be loaded"
          description={error.message}
          action={
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : loading || !announcement ? (
        <div className="space-y-3 py-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="min-h-0 flex-1">
            <div className="h-full min-h-0 touch-pan-y space-y-5 overflow-y-auto overscroll-y-contain pr-1">
              <div className="flex items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums">
                    {(announcement.read_count ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(announcement.read_count ?? 0) === 1 ? "account" : "accounts"} marked as read
                  </span>
                </div>
                <AnnouncementStatusBadge
                  status={announcement.status}
                  scheduled={isScheduled(announcement)}
                />
              </div>

              <InAppAnnouncementPreview
                title={announcement.title}
                body={announcement.body}
                href={announcement.href}
              />

              <Card className="shadow-none">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <IconCalendarClock className="size-4 text-muted-foreground" />
                      Schedule
                    </p>
                    <AnnouncementStatusBadge
                      status={announcement.status}
                      scheduled={isScheduled(announcement)}
                    />
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>
                      Starts:{" "}
                      {announcement.start_at
                        ? formatDateTime(announcement.start_at)
                        : "Immediately"}
                    </p>
                    <p>
                      Ends: {announcement.ends_at ? formatDateTime(announcement.ends_at) : "No end"}
                    </p>
                    <p>
                      Published:{" "}
                      {announcement.published_at
                        ? formatDateTime(announcement.published_at)
                        : "Not published"}
                    </p>
                    <p>Created: {formatDateTime(announcement.created_at)}</p>
                    <p>Updated: {formatDateTime(announcement.updated_at)}</p>
                    <p>
                      Created by:{" "}
                      {announcement.created_by ? (
                        <Link
                          href={`/main/admin/users/${encodeURIComponent(announcement.created_by)}`}
                          className="text-primary-ink underline-offset-4 hover:underline"
                        >
                          View account
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                    </p>
                  </div>
                  {announcement.href?.trim() ? (
                    <a
                      href={announcement.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-ink hover:underline"
                    >
                      <IconExternalLink className="size-3.5" />
                      <span className="break-all">{announcement.href}</span>
                    </a>
                  ) : null}
                </CardContent>
              </Card>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={busy || announcement.status === "archived"}
                  onClick={onArchive}
                >
                  <IconArchive className="size-4" />
                  Archive
                </Button>
                {announcement.status === "draft" ? (
                  <Button variant="outline" onClick={onEdit}>
                    <IconPencil className="size-4" />
                    Edit
                  </Button>
                ) : null}
                {announcement.status !== "published" ? (
                  <Button disabled={busy} onClick={onPublishOrArchive}>
                    <IconSend className="size-4" />
                    Publish
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="audience" className="min-h-0 flex-1 overflow-hidden">
            <AnnouncementAudienceView
              status={audienceStatus}
              onStatusChange={onAudienceStatusChange}
              page={audiencePage}
              onPageChange={onAudiencePageChange}
              loading={audienceQuery.isFetching}
              error={audienceQuery.error}
              onRetry={() => void audienceQuery.refetch()}
              data={audienceQuery.data}
            />
          </TabsContent>
        </Tabs>
      )}
    </NotificationDetailPanel>
  );
}

function AnnouncementAudienceView({
  status,
  onStatusChange,
  page,
  onPageChange,
  loading,
  error,
  onRetry,
  data,
}: {
  status: "read" | "unread";
  onStatusChange: (status: "read" | "unread") => void;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  data?: AnnouncementAudience;
}) {
  const totalPages = Math.max(data?.total_pages ?? 1, 1);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={status === "read" ? "secondary" : "ghost"}
            aria-pressed={status === "read"}
            onClick={() => onStatusChange("read")}
          >
            Read{" "}
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {data?.read_count ?? 0}
            </Badge>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "unread" ? "secondary" : "ghost"}
            aria-pressed={status === "unread"}
            onClick={() => onStatusChange("unread")}
          >
            Unread{" "}
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {data?.unread_count ?? 0}
            </Badge>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {data
            ? `${data.total.toLocaleString()} ${data.total === 1 ? "account" : "accounts"} listed · ${data.total_users.toLocaleString()} eligible overall`
            : "Accounts that interacted with this announcement"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium">Audience could not be loaded.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error.message || "Please try again."}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : data?.readers.length ? (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="hidden w-24 sm:table-cell">Status</TableHead>
                <TableHead className="hidden w-40 sm:table-cell">
                  {status === "read" ? "Read at" : "First interaction"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.readers.map((reader) => (
                <AnnouncementAudienceRow key={reader.user_id} reader={reader} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-10 text-center">
            <IconUsers className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              {status === "read" ? "No readers yet" : "Nobody has marked it unread"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {status === "read"
                ? "Accounts will appear here after they mark the announcement as read."
                : "This list only includes accounts explicitly marked unread. Accounts that never interacted are not included."}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous audience page"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            <IconChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next audience page"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementAudienceRow({ reader }: { reader: AnnouncementReader }) {
  const name = [reader.first_name, reader.last_name].filter(Boolean).join(" ").trim();
  const displayName = name || reader.username || reader.email || "Unknown account";
  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const timestamp = reader.is_read ? reader.read_at : reader.first_seen_at;

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/main/admin/users/${encodeURIComponent(reader.user_id)}`}
          aria-label={`View admin details for ${displayName}`}
          className="group flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={reader.avatar || undefined} alt="" />
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium group-hover:text-primary group-hover:underline">
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {reader.email || (reader.username ? `@${reader.username}` : "No email")}
            </span>
          </span>
          <IconExternalLink className="size-4 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-12 sm:hidden">
          <Badge variant={reader.is_read ? "secondary" : "outline"}>
            {reader.is_read ? "Read" : "Unread"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {timestamp ? formatDateTime(timestamp) : "Time not recorded"}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={reader.is_read ? "secondary" : "outline"}>
          {reader.is_read ? "Read" : "Unread"}
        </Badge>
      </TableCell>
      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
        {timestamp ? formatDateTime(timestamp) : "Not recorded"}
      </TableCell>
    </TableRow>
  );
}

function AnnouncementStatusBadge({
  status,
  scheduled,
}: {
  status: InAppAnnouncementStatus;
  scheduled: boolean;
}) {
  const tones: Record<InAppAnnouncementStatus, StatusBadgeTone> = {
    draft: "neutral",
    published: "success",
    archived: "purple",
  };
  const label = status === "published" && scheduled ? "Scheduled" : capitalize(status);
  return <StatusBadge tone={scheduled ? "info" : tones[status]}>{label}</StatusBadge>;
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Validates the draft and converts it into an API payload, or returns null after reporting errors. */
function buildPayload(draft: AnnouncementDraft): AnnouncementPayload | null {
  const title = draft.title.trim();
  const body = draft.body.trim();
  const href = draft.href.trim();

  if (!title || !body) {
    toast.error("Complete the required fields", {
      description: "Title and message are required.",
    });
    return null;
  }
  if (href && !isHTTPURL(href)) {
    toast.error("Use a valid link", {
      description: "The link must be a full HTTP or HTTPS URL.",
    });
    return null;
  }

  const startAt = draft.startAt ? new Date(draft.startAt) : null;
  const endsAt = draft.endsAt ? new Date(draft.endsAt) : null;

  if (startAt && Number.isNaN(startAt.getTime())) {
    toast.error("Check the start time");
    return null;
  }
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    toast.error("Check the end time");
    return null;
  }
  if (startAt && endsAt && endsAt.getTime() <= startAt.getTime()) {
    toast.error("Check the schedule", {
      description: "The end time must be later than the start time.",
    });
    return null;
  }

  return {
    title,
    body,
    href,
    start_at: startAt ? startAt.toISOString() : null,
    ends_at: endsAt ? endsAt.toISOString() : null,
  };
}

/** Stamps publication immediately, unless the announcement is scheduled for the future. */
function publicationTimestamp(payload: AnnouncementPayload) {
  if (payload.start_at && new Date(payload.start_at).getTime() > Date.now()) {
    return null;
  }
  return new Date().toISOString();
}

function isScheduled(announcement: AdminInAppAnnouncement) {
  if (announcement.status !== "published" || !announcement.start_at) {
    return false;
  }
  const start = new Date(announcement.start_at).getTime();
  return !Number.isNaN(start) && start > Date.now();
}

function scheduleWindow(announcement: AdminInAppAnnouncement) {
  if (announcement.status === "archived") return "Not visible · Archived";
  if (announcement.status === "draft") return "Not published";
  const start = announcement.start_at ? formatDateTime(announcement.start_at) : "Immediately";
  const end = announcement.ends_at ? formatDateTime(announcement.ends_at) : "No end";
  if (!announcement.start_at && !announcement.ends_at) {
    return "Always active";
  }
  return `${start} → ${end}`;
}

/** Converts an ISO timestamp into the local `datetime-local` input value. */
function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function isHTTPURL(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function showError(title: string, error: unknown) {
  toast.error(title, {
    description: error instanceof Error ? error.message : "Please try again.",
  });
}

/** Formats an API timestamp, tolerating missing or unparseable values. */
function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

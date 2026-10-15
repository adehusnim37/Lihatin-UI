"use client";

import { useMemo, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import {
  IconCalendarClock,
  IconEye,
  IconPhoto,
  IconPencil,
  IconPlus,
  IconSend,
  IconTemplate,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { useAuth } from "@/app/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import { CampaignEmailPreview } from "@/components/email/campaign-email-preview";
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
import { Card, CardContent } from "@/components/ui/card";
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
  AdminPromotionalCampaign,
  CampaignPayload,
  PromotionalCampaignStatus,
  PromotionalDeliveryStatus,
} from "@/lib/api/admin-campaigns";
import { uploadAdminCampaignImage } from "@/lib/api/admin-campaigns";
import {
  useAdminCampaignDeliveriesQuery,
  useAdminCampaignQuery,
  useAdminCampaignsQuery,
  useCancelAdminCampaignMutation,
  useCreateAdminCampaignMutation,
  useDeleteAdminCampaignMutation,
  useScheduleAdminCampaignMutation,
  useUpdateAdminCampaignMutation,
} from "@/lib/hooks/queries/useAdminCampaignsQuery";
import { campaignTemplates } from "@/lib/email/campaign-templates";

const PAGE_LIMIT = 10;
const DELIVERY_LIMIT = 10;
const EMPTY_FORM: CampaignPayload = {
  name: "",
  subject: "",
  preheader: "",
  body: "",
  image_url: "",
  image_alt: "",
  cta_label: "",
  cta_url: "",
};

type ConfirmationAction =
  | { type: "cancel"; campaign: AdminPromotionalCampaign }
  | { type: "delete"; campaign: AdminPromotionalCampaign }
  | null;

export default function AdminEmailCampaignsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const role = user?.role?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdminPromotionalCampaign | null>(null);
  const [form, setForm] = useState<CampaignPayload>(EMPTY_FORM);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedID, setSelectedID] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryStatus, setDeliveryStatus] = useState("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleCampaign, setScheduleCampaign] = useState<AdminPromotionalCampaign | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationAction>(null);

  const campaignsQuery = useAdminCampaignsQuery(
    page,
    PAGE_LIMIT,
    isAdmin,
    statusFilter === "all" ? "" : statusFilter,
  );
  const detailQuery = useAdminCampaignQuery(selectedID, detailOpen && isAdmin);
  const deliveriesQuery = useAdminCampaignDeliveriesQuery(
    selectedID,
    deliveryPage,
    DELIVERY_LIMIT,
    deliveryStatus === "all" ? "" : deliveryStatus,
    detailOpen && detailTab === "deliveries" && isAdmin,
  );
  const createMutation = useCreateAdminCampaignMutation();
  const updateMutation = useUpdateAdminCampaignMutation();
  const scheduleMutation = useScheduleAdminCampaignMutation();
  const cancelMutation = useCancelAdminCampaignMutation();
  const deleteMutation = useDeleteAdminCampaignMutation();

  const campaigns = useMemo(
    () => campaignsQuery.data?.campaigns ?? [],
    [campaignsQuery.data?.campaigns],
  );
  const totalPages = Math.max(campaignsQuery.data?.total_pages ?? 1, 1);
  const selectedCampaign = detailQuery.data;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const counts = campaignsQuery.data?.status_counts;
  const summaryItems = counts
    ? [
        { label: "campaigns", value: Object.values(counts).reduce((sum, count) => sum + count, 0) },
        { label: "drafts", value: counts.draft ?? 0 },
        { label: "scheduled or sending", value: (counts.scheduled ?? 0) + (counts.sending ?? 0) },
        { label: "completed", value: counts.completed ?? 0 },
      ]
    : [{ label: "matching campaigns", value: campaignsQuery.data?.total ?? 0 }];

  const openCreate = () => {
    setEditingCampaign(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (campaign: AdminPromotionalCampaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      preheader: campaign.preheader ?? "",
      body: campaign.body,
      image_url: campaign.image_url ?? "",
      image_alt: campaign.image_alt ?? "",
      cta_label: campaign.cta_label ?? "",
      cta_url: campaign.cta_url ?? "",
    });
    setDetailOpen(false);
    setEditorOpen(true);
  };

  const openDetail = (campaign: AdminPromotionalCampaign) => {
    setSelectedID(campaign.id);
    setDetailTab("overview");
    setDeliveryPage(1);
    setDeliveryStatus("all");
    setDetailOpen(true);
  };

  const openSchedule = (campaign: AdminPromotionalCampaign) => {
    setScheduleCampaign(campaign);
    setScheduleMode("now");
    setScheduledAt("");
    setDetailOpen(false);
    setScheduleOpen(true);
  };

  const saveCampaign = async () => {
    const payload = normalizePayload(form);
    if (!payload.name || !payload.subject || !payload.body) {
      toast.error("Complete the required fields", {
        description: "Name, subject, and message body are required.",
      });
      return;
    }
    if (Boolean(payload.cta_label) !== Boolean(payload.cta_url)) {
      toast.error("Complete the call to action", {
        description: "CTA label and URL must be provided together.",
      });
      return;
    }
    if (payload.image_url && !isHTTPURL(payload.image_url)) {
      toast.error("Use a valid image URL", {
        description: "The campaign image must use a public HTTP or HTTPS URL.",
      });
      return;
    }

    if (payload.cta_url && !isHTTPURL(payload.cta_url)) {
      toast.error("Use a valid button link", { description: "The link must use HTTP or HTTPS." });
      return;
    }

    try {
      if (editingCampaign) {
        await updateMutation.mutateAsync({
          id: editingCampaign.id,
          payload,
        });
        toast.success("Campaign updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Campaign created", {
          description: "The campaign was saved as a draft.",
        });
      }
      setEditorOpen(false);
    } catch (error) {
      showError("Campaign could not be saved", error);
    }
  };

  const submitSchedule = async () => {
    if (!scheduleCampaign) return;
    let scheduledISO: string | undefined;
    if (scheduleMode === "later") {
      if (!scheduledAt) {
        toast.error("Choose a delivery time");
        return;
      }
      const date = new Date(scheduledAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        toast.error("Choose a future delivery time");
        return;
      }
      scheduledISO = date.toISOString();
    }

    try {
      await scheduleMutation.mutateAsync({
        id: scheduleCampaign.id,
        scheduledAt: scheduledISO,
      });
      toast.success(scheduleMode === "now" ? "Campaign queued" : "Campaign scheduled");
      setScheduleOpen(false);
    } catch (error) {
      showError("Campaign could not be scheduled", error);
    }
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    try {
      if (confirmation.type === "cancel") {
        await cancelMutation.mutateAsync(confirmation.campaign.id);
        toast.success("Campaign cancelled");
      } else {
        await deleteMutation.mutateAsync(confirmation.campaign.id);
        toast.success("Campaign deleted");
        if (selectedID === confirmation.campaign.id) {
          setDetailOpen(false);
        }
      }
      setConfirmation(null);
    } catch (error) {
      showError(
        confirmation.type === "cancel"
          ? "Campaign could not be cancelled"
          : "Campaign could not be deleted",
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
            channel="email"
            onCreate={openCreate}
            onRefresh={() => void campaignsQuery.refetch()}
            refreshing={campaignsQuery.isFetching}
            canCreate={isAdmin}
          />

          {authLoading ? (
            <PageSkeleton />
          ) : !isAdmin ? (
            <NotificationEmptyState
              title="Admin access required"
              description="Sign in with an administrator account to manage email campaigns."
              icon="mail"
            />
          ) : (
            <div className="-mt-6">
              <NotificationSummary
                items={summaryItems}
                note="Promotional email goes to verified users who opted in."
              />
              <section aria-label="Email campaigns" className="pt-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Campaigns</h2>
                    <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                      Open a campaign to review its content and recipient outcomes.
                    </p>
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger aria-label="Campaign status filter" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sending">Sending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className="overflow-hidden rounded-xl border"
                  aria-busy={campaignsQuery.isFetching}
                >
                  {campaignsQuery.isLoading ? (
                    <div className="p-5">
                      <TableSkeleton />
                    </div>
                  ) : campaignsQuery.isError ? (
                    <NotificationEmptyState
                      icon="mail"
                      title="Campaigns could not be loaded"
                      description={campaignsQuery.error.message || "Please try again."}
                      action={
                        <Button variant="outline" onClick={() => void campaignsQuery.refetch()}>
                          Retry
                        </Button>
                      }
                    />
                  ) : campaigns.length === 0 ? (
                    <NotificationEmptyState
                      icon="mail"
                      title={
                        statusFilter === "all"
                          ? "Create your first email campaign"
                          : "No campaigns with this status"
                      }
                      description={
                        statusFilter === "all"
                          ? "Start with a template or write your own message. Save a draft before choosing when to send."
                          : "Try another status to find your campaigns."
                      }
                      action={
                        statusFilter === "all" ? (
                          <Button onClick={openCreate}>
                            <IconPlus className="size-4" />
                            Create campaign
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setStatusFilter("all");
                              setPage(1);
                            }}
                          >
                            Show all campaigns
                          </Button>
                        )
                      }
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="pl-5">Campaign</TableHead>
                          <TableHead className="hidden sm:table-cell">Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Send time</TableHead>
                          <TableHead className="hidden sm:table-cell">Delivery</TableHead>
                          <TableHead className="w-14">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((campaign) => (
                          <CampaignRow
                            key={campaign.id}
                            campaign={campaign}
                            onView={() => openDetail(campaign)}
                            onEdit={() => openEdit(campaign)}
                            onSchedule={() => openSchedule(campaign)}
                            onCancel={() => setConfirmation({ type: "cancel", campaign })}
                            onDelete={() => setConfirmation({ type: "delete", campaign })}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                <NotificationPagination
                  page={page}
                  totalPages={totalPages}
                  total={campaignsQuery.data?.total ?? 0}
                  busy={campaignsQuery.isFetching}
                  onPageChange={setPage}
                />
              </section>
            </div>
          )}
        </div>
      </SidebarInset>

      <CampaignEditorDialog
        key={editorOpen ? (editingCampaign?.id ?? "new") : "closed"}
        open={editorOpen}
        campaign={editingCampaign}
        form={form}
        saving={isSaving}
        onOpenChange={setEditorOpen}
        onFormChange={setForm}
        onSubmit={() => void saveCampaign()}
      />

      <ScheduleDialog
        open={scheduleOpen}
        campaign={scheduleCampaign}
        mode={scheduleMode}
        scheduledAt={scheduledAt}
        pending={scheduleMutation.isPending}
        onOpenChange={setScheduleOpen}
        onModeChange={setScheduleMode}
        onScheduledAtChange={setScheduledAt}
        onSubmit={() => void submitSchedule()}
      />

      <CampaignDetailDialog
        open={detailOpen}
        campaign={selectedCampaign}
        loading={detailQuery.isLoading}
        error={detailQuery.error}
        onRetry={() => void detailQuery.refetch()}
        tab={detailTab}
        onTabChange={setDetailTab}
        onOpenChange={setDetailOpen}
        onEdit={() => selectedCampaign && openEdit(selectedCampaign)}
        onSchedule={() => selectedCampaign && openSchedule(selectedCampaign)}
        deliveries={deliveriesQuery.data}
        deliveriesLoading={deliveriesQuery.isFetching}
        deliveriesError={deliveriesQuery.error}
        onDeliveriesRetry={() => void deliveriesQuery.refetch()}
        deliveryPage={deliveryPage}
        deliveryStatus={deliveryStatus}
        onDeliveryPageChange={setDeliveryPage}
        onDeliveryStatusChange={(status) => {
          setDeliveryStatus(status);
          setDeliveryPage(1);
        }}
      />

      <AlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation?.type === "cancel" ? "Cancel this campaign?" : "Delete this campaign?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.type === "cancel"
                ? "The scheduled campaign will no longer be picked up by the email worker."
                : "This permanently removes the draft or cancelled campaign."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep campaign</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmAction()}
              disabled={cancelMutation.isPending || deleteMutation.isPending}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

function CampaignRow({
  campaign,
  onView,
  onEdit,
  onSchedule,
  onCancel,
  onDelete,
}: {
  campaign: AdminPromotionalCampaign;
  onView: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onCancel: () => void;
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
            {campaign.name}
          </span>
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
            {campaign.subject}
          </span>
          <span className="mt-2 inline-flex sm:hidden">
            <CampaignStatusBadge status={campaign.status} />
          </span>
        </button>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <CampaignStatusBadge status={campaign.status} />
      </TableCell>
      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
        {campaign.scheduled_at ? formatDateTime(campaign.scheduled_at) : "Not scheduled"}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <p className="text-sm tabular-nums">
          {campaign.sent_count.toLocaleString()} / {campaign.recipient_count.toLocaleString()} sent
        </p>
        {campaign.failed_count > 0 && (
          <p className="mt-1 text-xs text-destructive">
            {campaign.failed_count.toLocaleString()} failed
          </p>
        )}
      </TableCell>
      <TableCell className="pr-3">
        <NotificationRowMenu label={campaign.name}>
          <DropdownMenuItem onSelect={onView}>
            <IconEye />
            View campaign
          </DropdownMenuItem>
          {campaign.status === "draft" && (
            <DropdownMenuItem onSelect={onEdit}>
              <IconPencil />
              Edit draft
            </DropdownMenuItem>
          )}
          {(campaign.status === "draft" || campaign.status === "failed") && (
            <DropdownMenuItem onSelect={onSchedule}>
              <IconSend />
              {campaign.status === "failed" ? "Retry failed deliveries" : "Schedule campaign"}
            </DropdownMenuItem>
          )}
          {campaign.status === "scheduled" && (
            <DropdownMenuItem onSelect={onCancel}>
              <IconX />
              Cancel scheduled send
            </DropdownMenuItem>
          )}
          {(campaign.status === "draft" || campaign.status === "cancelled") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <IconTrash />
                Delete campaign
              </DropdownMenuItem>
            </>
          )}
        </NotificationRowMenu>
      </TableCell>
    </TableRow>
  );
}

function CampaignEditorDialog({
  open,
  campaign,
  form,
  saving,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  campaign: AdminPromotionalCampaign | null;
  form: CampaignPayload;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: Dispatch<SetStateAction<CampaignPayload>>;
  onSubmit: () => void;
}) {
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const [templateID, setTemplateID] = useState(campaignTemplates[0].id);
  const [uploadingImage, setUploadingImage] = useState(false);
  const update = (field: keyof CampaignPayload, value: string) =>
    onFormChange((current) => ({ ...current, [field]: value }));
  const applyTemplate = () => {
    const template = campaignTemplates.find((candidate) => candidate.id === templateID);
    if (!template) return;

    onFormChange({
      ...template.payload,
      image_url: form.image_url,
      image_alt: form.image_alt,
      name: campaign || form.name.trim() ? form.name : template.payload.name,
    });
    setTemplateConfirmOpen(false);
    toast.success("Template applied", {
      description: `${template.name} content is ready to customize.`,
    });
  };
  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large", {
        description: "Choose a JPG, PNG, WebP, or GIF image up to 5 MB.",
      });
      return;
    }
    setUploadingImage(true);
    try {
      const uploaded = await uploadAdminCampaignImage(file);
      update("image_url", uploaded.image_url);
      toast.success("Campaign image uploaded");
    } catch (error) {
      showError("Campaign image could not be uploaded", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const initialForm: CampaignPayload = campaign
    ? {
        name: campaign.name,
        subject: campaign.subject,
        preheader: campaign.preheader ?? "",
        body: campaign.body,
        image_url: campaign.image_url ?? "",
        image_alt: campaign.image_alt ?? "",
        cta_label: campaign.cta_label ?? "",
        cta_url: campaign.cta_url ?? "",
      }
    : EMPTY_FORM;
  const dirty = JSON.stringify(initialForm) !== JSON.stringify(form);
  return (
    <>
      <NotificationComposer
        open={open}
        onOpenChange={onOpenChange}
        title={campaign ? "Edit campaign" : "New email campaign"}
        description="Write a message for users who opted in. Save your draft, then choose when to send."
        saving={saving || uploadingImage}
        pendingLabel={uploadingImage ? "Uploading image…" : "Saving…"}
        dirty={dirty}
        onSubmit={onSubmit}
        submitLabel={campaign ? "Save changes" : "Save draft"}
        preview={
          <CampaignEmailPreview
            subject={form.subject}
            preheader={form.preheader}
            body={form.body}
            imageURL={form.image_url}
            imageAlt={form.image_alt}
            ctaLabel={form.cta_label}
            ctaURL={form.cta_url}
          />
        }
      >
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <IconTemplate className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Start from a template</p>
              <p className="text-xs text-muted-foreground">
                Applying a template replaces the email content and button.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Select value={templateID} onValueChange={setTemplateID}>
              <SelectTrigger aria-label="Campaign template" className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaignTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                form.subject.trim() || form.body.trim()
                  ? setTemplateConfirmOpen(true)
                  : applyTemplate()
              }
            >
              Apply template
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {campaignTemplates.find((template) => template.id === templateID)?.description}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="campaign-name">Internal name</Label>
          <Input
            id="campaign-name"
            value={form.name}
            maxLength={120}
            onChange={(event) => update("name", event.target.value)}
            placeholder="August Premium launch"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="campaign-subject">Email subject</Label>
          <Input
            id="campaign-subject"
            value={form.subject}
            maxLength={180}
            onChange={(event) => update("subject", event.target.value)}
            placeholder="A new way to understand your links"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="campaign-preheader">Preheader</Label>
          <Input
            id="campaign-preheader"
            value={form.preheader}
            maxLength={255}
            onChange={(event) => update("preheader", event.target.value)}
            placeholder="Optional inbox preview text"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="campaign-body">Message</Label>
          <textarea
            id="campaign-body"
            value={form.body}
            maxLength={20000}
            onChange={(event) => update("body", event.target.value)}
            placeholder="Write the promotional message..."
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring min-h-40 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          />
          <p className="text-right text-xs text-muted-foreground">
            {form.body.length.toLocaleString()}/20,000
          </p>
        </div>
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="flex items-start gap-2">
            <IconPhoto className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <Label htmlFor="campaign-image-url">Hero image</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional. Upload an image or use a public HTTPS URL. A 1200×630 image works well
                across email clients.
              </p>
            </div>
          </div>
          <Input
            id="campaign-image-url"
            type="url"
            value={form.image_url}
            maxLength={1000}
            onChange={(event) => update("image_url", event.target.value)}
            placeholder="https://cdn.example.com/campaign.jpg"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="campaign-image-file" className="sr-only">
              Upload campaign image
            </Label>
            <Input
              id="campaign-image-file"
              type="file"
              className="h-auto min-h-11 py-2 text-xs file:mr-2 file:font-medium"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploadingImage}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
                event.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF · maximum 5 MB</p>
          </div>
          {form.image_url?.trim() ? (
            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image_url}
                alt="Campaign hero preview"
                className="max-h-56 w-full object-contain"
              />
              <div className="flex justify-end border-t p-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onFormChange({
                      ...form,
                      image_url: "",
                      image_alt: "",
                    })
                  }
                >
                  <IconX className="size-4" />
                  Remove image
                </Button>
              </div>
            </div>
          ) : null}
          {form.image_url?.trim() ? (
            <div className="grid gap-2">
              <Label htmlFor="campaign-image-alt">Image description</Label>
              <Input
                id="campaign-image-alt"
                value={form.image_alt}
                maxLength={180}
                onChange={(event) => update("image_alt", event.target.value)}
                placeholder="Describe the image for screen readers"
              />
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="campaign-cta-label">Button label</Label>
            <Input
              id="campaign-cta-label"
              value={form.cta_label}
              maxLength={80}
              onChange={(event) => update("cta_label", event.target.value)}
              placeholder="Explore Premium"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="campaign-cta-url">Button URL</Label>
            <Input
              id="campaign-cta-url"
              value={form.cta_url}
              onChange={(event) => update("cta_url", event.target.value)}
              placeholder="https://lihat.in/main"
            />
          </div>
        </div>
      </NotificationComposer>
      <AlertDialog open={templateConfirmOpen} onOpenChange={setTemplateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace this message with a template?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subject, message, and button will be replaced. The current image and internal
              name will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my message</AlertDialogCancel>
            <AlertDialogAction onClick={applyTemplate}>Apply template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ScheduleDialog({
  open,
  campaign,
  mode,
  scheduledAt,
  pending,
  onOpenChange,
  onModeChange,
  onScheduledAtChange,
  onSubmit,
}: {
  open: boolean;
  campaign: AdminPromotionalCampaign | null;
  mode: "now" | "later";
  scheduledAt: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: "now" | "later") => void;
  onScheduledAtChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule campaign</DialogTitle>
          <DialogDescription>
            Choose when to send this campaign to verified users who opted in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">{campaign?.name}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{campaign?.subject}</p>
          </div>
          <div className="grid gap-2">
            <Label>Delivery timing</Label>
            <Select value={mode} onValueChange={(value) => onModeChange(value as "now" | "later")}>
              <SelectTrigger aria-label="Delivery timing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Send as soon as possible</SelectItem>
                <SelectItem value="later">Schedule for later</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "later" ? (
            <div className="grid gap-2">
              <Label htmlFor="campaign-scheduled-at">Date and time</Label>
              <Input
                id="campaign-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => onScheduledAtChange(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Interpreted in your browser’s local timezone.
              </p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            <IconCalendarClock className="size-4" />
            {pending ? "Scheduling..." : mode === "now" ? "Queue campaign" : "Schedule campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampaignDetailDialog({
  open,
  campaign,
  loading,
  error,
  onRetry,
  tab,
  onTabChange,
  onOpenChange,
  onEdit,
  onSchedule,
  deliveries,
  deliveriesLoading,
  deliveriesError,
  onDeliveriesRetry,
  deliveryPage,
  deliveryStatus,
  onDeliveryPageChange,
  onDeliveryStatusChange,
}: {
  open: boolean;
  campaign?: AdminPromotionalCampaign;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  tab: string;
  onTabChange: (tab: string) => void;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSchedule: () => void;
  deliveries: ReturnType<typeof useAdminCampaignDeliveriesQuery>["data"];
  deliveriesLoading: boolean;
  deliveriesError: Error | null;
  onDeliveriesRetry: () => void;
  deliveryPage: number;
  deliveryStatus: string;
  onDeliveryPageChange: (page: number) => void;
  onDeliveryStatusChange: (status: string) => void;
}) {
  return (
    <NotificationDetailPanel
      open={open}
      onOpenChange={onOpenChange}
      title={campaign?.name ?? "Campaign details"}
      description="Review the email, its send schedule, and individual delivery outcomes."
    >
      {error ? (
        <NotificationEmptyState
          icon="mail"
          title="Campaign could not be loaded"
          description={error.message}
          action={
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : loading || !campaign ? (
        <div className="space-y-3 py-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={onTabChange} className="h-full min-h-0 min-w-0">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deliveries" className="min-w-0 whitespace-normal">
              Deliveries ({campaign.recipient_count})
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="overview"
            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain pr-1"
          >
            <NotificationSummary
              items={[
                { label: "recipients", value: campaign.recipient_count },
                { label: "sent", value: campaign.sent_count },
                { label: "failed", value: campaign.failed_count },
              ]}
            />
            <CampaignEmailPreview
              subject={campaign.subject}
              preheader={campaign.preheader}
              body={campaign.body}
              imageURL={campaign.image_url}
              imageAlt={campaign.image_alt}
              ctaLabel={campaign.cta_label}
              ctaURL={campaign.cta_url}
            />
            <Card className="shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Campaign lifecycle</p>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>Created: {formatDateTime(campaign.created_at)}</p>
                  <p>
                    Scheduled:{" "}
                    {campaign.scheduled_at
                      ? formatDateTime(campaign.scheduled_at)
                      : "Not scheduled"}
                  </p>
                  <p>
                    Started:{" "}
                    {campaign.started_at ? formatDateTime(campaign.started_at) : "Not started"}
                  </p>
                  <p>
                    Completed:{" "}
                    {campaign.completed_at
                      ? formatDateTime(campaign.completed_at)
                      : "Not completed"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              {campaign.status === "draft" ? (
                <Button variant="outline" onClick={onEdit}>
                  <IconPencil className="size-4" />
                  Edit
                </Button>
              ) : null}
              {campaign.status === "draft" || campaign.status === "failed" ? (
                <Button onClick={onSchedule}>
                  <IconSend className="size-4" />
                  {campaign.status === "failed" ? "Retry failed" : "Schedule"}
                </Button>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent
            value="deliveries"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain pr-1"
          >
            <div className="flex justify-end">
              <Select value={deliveryStatus} onValueChange={onDeliveryStatusChange}>
                <SelectTrigger aria-label="Delivery status filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {deliveriesError ? (
              <NotificationEmptyState
                icon="mail"
                title="Delivery results could not be loaded"
                description={deliveriesError.message}
                action={
                  <Button variant="outline" onClick={onDeliveriesRetry}>
                    Retry
                  </Button>
                }
              />
            ) : deliveriesLoading ? (
              <TableSkeleton />
            ) : deliveries?.deliveries.length ? (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead className="hidden w-24 sm:table-cell">Status</TableHead>
                        <TableHead className="hidden w-36 sm:table-cell">Sent</TableHead>
                        <TableHead className="hidden w-28 sm:table-cell">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.deliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell>
                            <Link
                              href={`/main/admin/users/${encodeURIComponent(delivery.user_id)}`}
                              className="block truncate text-sm font-medium text-primary-ink underline-offset-4 hover:underline"
                            >
                              {delivery.email}
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                              <DeliveryStatusBadge status={delivery.status} />
                              <span className="text-xs text-muted-foreground">
                                {delivery.sent_at
                                  ? formatDateTime(delivery.sent_at)
                                  : "Not sent yet"}
                              </span>
                            </div>
                            {delivery.error_message && (
                              <p className="mt-2 whitespace-normal break-words text-xs text-destructive sm:hidden">
                                {delivery.error_message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <DeliveryStatusBadge status={delivery.status} />
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                            {delivery.sent_at ? formatDateTime(delivery.sent_at) : "—"}
                          </TableCell>
                          <TableCell className="hidden max-w-56 whitespace-normal break-words text-xs sm:table-cell">
                            {delivery.error_message ? (
                              <span className="text-destructive">{delivery.error_message}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {deliveryPage} of {Math.max(deliveries.total_pages, 1)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deliveryPage <= 1}
                      onClick={() => onDeliveryPageChange(deliveryPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={deliveryPage >= deliveries.total_pages}
                      onClick={() => onDeliveryPageChange(deliveryPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No delivery records match this filter.
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </NotificationDetailPanel>
  );
}

function CampaignStatusBadge({ status }: { status: PromotionalCampaignStatus }) {
  const tones: Record<PromotionalCampaignStatus, StatusBadgeTone> = {
    draft: "neutral",
    scheduled: "info",
    sending: "warning",
    completed: "success",
    cancelled: "neutral",
    failed: "danger",
  };
  return <StatusBadge tone={tones[status]}>{capitalize(status)}</StatusBadge>;
}

function DeliveryStatusBadge({ status }: { status: PromotionalDeliveryStatus }) {
  const tones: Record<PromotionalDeliveryStatus, StatusBadgeTone> = {
    pending: "neutral",
    sending: "warning",
    sent: "success",
    failed: "danger",
    skipped: "neutral",
  };
  return <StatusBadge tone={tones[status]}>{capitalize(status)}</StatusBadge>;
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

function normalizePayload(form: CampaignPayload): CampaignPayload {
  const imageURL = form.image_url?.trim() || "";
  return {
    name: form.name.trim(),
    subject: form.subject.trim(),
    preheader: form.preheader?.trim() || "",
    body: form.body.trim(),
    image_url: imageURL,
    image_alt: imageURL ? form.image_alt?.trim() || "" : "",
    cta_label: form.cta_label?.trim() || "",
    cta_url: form.cta_url?.trim() || "",
  };
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

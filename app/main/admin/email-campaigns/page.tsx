"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  IconCalendarClock,
  IconEye,
  IconPhoto,
  IconMail,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSend,
  IconTemplate,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { useAuth } from "@/app/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import { CampaignEmailPreview } from "@/components/email/campaign-email-preview";
import { SiteHeader } from "@/components/site-header";
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<AdminPromotionalCampaign | null>(null);
  const [form, setForm] = useState<CampaignPayload>(EMPTY_FORM);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedID, setSelectedID] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryStatus, setDeliveryStatus] = useState("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleCampaign, setScheduleCampaign] =
    useState<AdminPromotionalCampaign | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [confirmation, setConfirmation] =
    useState<ConfirmationAction>(null);

  const campaignsQuery = useAdminCampaignsQuery(
    page,
    PAGE_LIMIT,
    isAdmin,
  );
  const detailQuery = useAdminCampaignQuery(
    selectedID,
    detailOpen && isAdmin,
  );
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

  const summary = useMemo(
    () => ({
      total: campaignsQuery.data?.total ?? 0,
      active: campaigns.filter((campaign) =>
        ["scheduled", "sending"].includes(campaign.status),
      ).length,
      sent: campaigns.reduce(
        (total, campaign) => total + campaign.sent_count,
        0,
      ),
      failed: campaigns.reduce(
        (total, campaign) => total + campaign.failed_count,
        0,
      ),
    }),
    [campaigns, campaignsQuery.data?.total],
  );

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
      toast.success(
        scheduleMode === "now" ? "Campaign queued" : "Campaign scheduled",
      );
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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Email Campaigns
              </h1>
              <p className="text-sm text-muted-foreground">
                Create and schedule promotional email for opted-in users.
              </p>
            </div>
            {isAdmin ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => campaignsQuery.refetch()}
                  disabled={campaignsQuery.isFetching}
                >
                  <IconRefresh className="size-4" />
                  Refresh
                </Button>
                <Button size="sm" onClick={openCreate}>
                  <IconPlus className="size-4" />
                  New campaign
                </Button>
              </div>
            ) : null}
          </div>

          {authLoading ? (
            <PageSkeleton />
          ) : !isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>
                  This page is available only to administrators.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Total campaigns" value={summary.total} />
                <SummaryCard label="Scheduled or sending" value={summary.active} />
                <SummaryCard label="Delivered on this page" value={summary.sent} />
                <SummaryCard label="Failed on this page" value={summary.failed} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Campaigns</CardTitle>
                  <CardDescription>
                    Draft, schedule, monitor, cancel, or retry a campaign.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaignsQuery.isLoading ? (
                    <TableSkeleton />
                  ) : campaignsQuery.isError ? (
                    <div className="rounded-lg border p-6 text-center">
                      <p className="text-sm font-medium">
                        Campaigns could not be loaded.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaignsQuery.error instanceof Error
                          ? campaignsQuery.error.message
                          : "Please try again."}
                      </p>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                      <IconMail className="mx-auto size-8 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium">
                        No email campaigns yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Create a draft to prepare your first promotion.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Delivery</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                              onCancel={() =>
                                setConfirmation({
                                  type: "cancel",
                                  campaign,
                                })
                              }
                              onDelete={() =>
                                setConfirmation({
                                  type: "delete",
                                  campaign,
                                })
                              }
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>

      <CampaignEditorDialog
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
        tab={detailTab}
        onTabChange={setDetailTab}
        onOpenChange={setDetailOpen}
        onEdit={() => selectedCampaign && openEdit(selectedCampaign)}
        onSchedule={() =>
          selectedCampaign && openSchedule(selectedCampaign)
        }
        deliveries={deliveriesQuery.data}
        deliveriesLoading={deliveriesQuery.isLoading}
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
              {confirmation?.type === "cancel"
                ? "Cancel this campaign?"
                : "Delete this campaign?"}
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
              disabled={
                cancelMutation.isPending || deleteMutation.isPending
              }
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
  const schedulable =
    campaign.status === "draft" || campaign.status === "failed";
  const deletable =
    campaign.status === "draft" || campaign.status === "cancelled";

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{campaign.name}</p>
        <p className="max-w-64 truncate text-xs text-muted-foreground">
          {campaign.subject}
        </p>
      </TableCell>
      <TableCell>
        <CampaignStatusBadge status={campaign.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {campaign.scheduled_at
          ? formatDateTime(campaign.scheduled_at)
          : "Not scheduled"}
      </TableCell>
      <TableCell>
        <p className="text-sm">
          {campaign.sent_count}/{campaign.recipient_count} sent
        </p>
        {campaign.failed_count > 0 ? (
          <p className="text-xs text-destructive">
            {campaign.failed_count} failed
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onView}>
            <IconEye className="size-4" />
            <span className="sr-only">View campaign</span>
          </Button>
          {campaign.status === "draft" ? (
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <IconPencil className="size-4" />
              <span className="sr-only">Edit campaign</span>
            </Button>
          ) : null}
          {schedulable ? (
            <Button variant="ghost" size="icon-sm" onClick={onSchedule}>
              <IconSend className="size-4" />
              <span className="sr-only">Schedule campaign</span>
            </Button>
          ) : null}
          {campaign.status === "scheduled" ? (
            <Button variant="ghost" size="icon-sm" onClick={onCancel}>
              <IconX className="size-4" />
              <span className="sr-only">Cancel campaign</span>
            </Button>
          ) : null}
          {deletable ? (
            <Button variant="ghost" size="icon-sm" onClick={onDelete}>
              <IconTrash className="size-4" />
              <span className="sr-only">Delete campaign</span>
            </Button>
          ) : null}
        </div>
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
  onFormChange: (form: CampaignPayload) => void;
  onSubmit: () => void;
}) {
  const [editorTab, setEditorTab] = useState("compose");
  const [templateID, setTemplateID] = useState(campaignTemplates[0].id);
  const [uploadingImage, setUploadingImage] = useState(false);
  const update = (field: keyof CampaignPayload, value: string) =>
    onFormChange({ ...form, [field]: value });
  const applyTemplate = () => {
    const template = campaignTemplates.find(
      (candidate) => candidate.id === templateID,
    );
    if (!template) return;

    onFormChange({
      ...template.payload,
      image_url: form.image_url,
      image_alt: form.image_alt,
      name:
        campaign || form.name.trim()
          ? form.name
          : template.payload.name,
    });
    setEditorTab("compose");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90dvh] w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {campaign ? "Edit campaign" : "New promotional campaign"}
          </DialogTitle>
          <DialogDescription>
            Messages are delivered only to verified users who opted in.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={editorTab}
          onValueChange={setEditorTab}
          className="h-full min-h-0 min-w-0 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain pr-1"
        >
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">
              <IconEye className="size-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="compose"
            className="grid min-w-0 gap-4 py-2"
          >
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <IconTemplate className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start from a template</p>
                  <p className="text-xs text-muted-foreground">
                    Applying a template replaces the email content and CTA.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Select value={templateID} onValueChange={setTemplateID}>
                  <SelectTrigger className="flex-1">
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
                <Button type="button" variant="outline" onClick={applyTemplate}>
                  Apply template
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {
                  campaignTemplates.find(
                    (template) => template.id === templateID,
                  )?.description
                }
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
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-40 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
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
                    Optional. Upload an image or use a public HTTPS URL. A
                    1200×630 image works well across email clients.
                  </p>
                </div>
              </div>
              <Input
                id="campaign-image-url"
                type="url"
                value={form.image_url}
                maxLength={1000}
                onChange={(event) =>
                  update("image_url", event.target.value)
                }
                placeholder="https://cdn.example.com/campaign.jpg"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Label
                  htmlFor="campaign-image-file"
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent"
                >
                  <IconUpload className="size-4" />
                  {uploadingImage ? "Uploading..." : "Upload image"}
                </Label>
                <Input
                  id="campaign-image-file"
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingImage}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                    event.target.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, or GIF · maximum 5 MB
                </p>
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
                    onChange={(event) =>
                      update("image_alt", event.target.value)
                    }
                    placeholder="Describe the image for screen readers"
                  />
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="campaign-cta-label">CTA label</Label>
                <Input
                  id="campaign-cta-label"
                  value={form.cta_label}
                  maxLength={80}
                  onChange={(event) =>
                    update("cta_label", event.target.value)
                  }
                  placeholder="Explore Premium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-cta-url">CTA URL</Label>
                <Input
                  id="campaign-cta-url"
                  value={form.cta_url}
                  onChange={(event) =>
                    update("cta_url", event.target.value)
                  }
                  placeholder="https://lihat.in/main"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="min-w-0 py-2">
            <CampaignEmailPreview
              subject={form.subject}
              preheader={form.preheader}
              body={form.body}
              imageURL={form.image_url}
              imageAlt={form.image_alt}
              ctaLabel={form.cta_label}
              ctaURL={form.cta_url}
            />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : campaign ? "Save changes" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            {campaign?.name}. The worker checks scheduled campaigns every
            minute.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Delivery timing</Label>
            <Select
              value={mode}
              onValueChange={(value) =>
                onModeChange(value as "now" | "later")
              }
            >
              <SelectTrigger>
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
                onChange={(event) =>
                  onScheduledAtChange(event.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Interpreted in your browser’s local timezone.
              </p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            <IconCalendarClock className="size-4" />
            {pending
              ? "Scheduling..."
              : mode === "now"
                ? "Queue campaign"
                : "Schedule campaign"}
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
  tab,
  onTabChange,
  onOpenChange,
  onEdit,
  onSchedule,
  deliveries,
  deliveriesLoading,
  deliveryPage,
  deliveryStatus,
  onDeliveryPageChange,
  onDeliveryStatusChange,
}: {
  open: boolean;
  campaign?: AdminPromotionalCampaign;
  loading: boolean;
  tab: string;
  onTabChange: (tab: string) => void;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSchedule: () => void;
  deliveries:
    | ReturnType<
        typeof useAdminCampaignDeliveriesQuery
      >["data"];
  deliveriesLoading: boolean;
  deliveryPage: number;
  deliveryStatus: string;
  onDeliveryPageChange: (page: number) => void;
  onDeliveryStatusChange: (status: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90dvh] w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{campaign?.name ?? "Campaign details"}</DialogTitle>
          <DialogDescription>
            Review content, schedule, and recipient delivery outcomes.
          </DialogDescription>
        </DialogHeader>
        {loading || !campaign ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Tabs
            value={tab}
            onValueChange={onTabChange}
            className="h-full min-h-0 min-w-0 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain pr-1"
          >
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deliveries">
                Deliveries ({campaign.recipient_count})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Recipients" value={campaign.recipient_count} />
                <SummaryCard label="Sent" value={campaign.sent_count} />
                <SummaryCard label="Failed" value={campaign.failed_count} />
              </div>
              <CampaignEmailPreview
                subject={campaign.subject}
                preheader={campaign.preheader}
                body={campaign.body}
                imageURL={campaign.image_url}
                imageAlt={campaign.image_alt}
                ctaLabel={campaign.cta_label}
                ctaURL={campaign.cta_url}
              />
              <Card>
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
                      {campaign.started_at
                        ? formatDateTime(campaign.started_at)
                        : "Not started"}
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
                {campaign.status === "draft" ||
                campaign.status === "failed" ? (
                  <Button onClick={onSchedule}>
                    <IconSend className="size-4" />
                    {campaign.status === "failed" ? "Retry failed" : "Schedule"}
                  </Button>
                ) : null}
              </div>
            </TabsContent>
            <TabsContent value="deliveries" className="space-y-4">
              <div className="flex justify-end">
                <Select
                  value={deliveryStatus}
                  onValueChange={onDeliveryStatusChange}
                >
                  <SelectTrigger className="w-40">
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
              {deliveriesLoading ? (
                <TableSkeleton />
              ) : deliveries?.deliveries.length ? (
                <>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deliveries.deliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              <p className="text-sm">{delivery.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.user_id}
                              </p>
                            </TableCell>
                            <TableCell>
                              <DeliveryStatusBadge status={delivery.status} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {delivery.sent_at
                                ? formatDateTime(delivery.sent_at)
                                : "—"}
                            </TableCell>
                            <TableCell className="max-w-56 truncate text-xs text-destructive">
                              {delivery.error_message || "—"}
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
                        onClick={() =>
                          onDeliveryPageChange(deliveryPage - 1)
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deliveryPage >= deliveries.total_pages}
                        onClick={() =>
                          onDeliveryPageChange(deliveryPage + 1)
                        }
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
      </DialogContent>
    </Dialog>
  );
}

function CampaignStatusBadge({
  status,
}: {
  status: PromotionalCampaignStatus;
}) {
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

function DeliveryStatusBadge({
  status,
}: {
  status: PromotionalDeliveryStatus;
}) {
  const tones: Record<PromotionalDeliveryStatus, StatusBadgeTone> = {
    pending: "neutral",
    sending: "warning",
    sent: "success",
    failed: "danger",
    skipped: "neutral",
  };
  return <StatusBadge tone={tones[status]}>{capitalize(status)}</StatusBadge>;
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-80" />
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
    description:
      error instanceof Error ? error.message : "Please try again.",
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

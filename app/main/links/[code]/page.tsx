"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  BarChart3,
  Globe,
  TriangleAlert,
  MousePointerClick,
  Link as LinkIcon,
  Calendar,
  Lock,
  Tag,
  Clock,
  Infinity,
  ShieldAlert,
  QrCode,
  Settings,
  History,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import { useLink, useUpdateLink } from "@/lib/hooks/queries/useLinksQuery";
import { cn } from "@/lib/utils";
import { SettingsSecurity } from "@/components/links/detail/settings-security";
import { LinkQRCode } from "@/components/links/detail/link-qrcode";
import { UpdateExpirationDialog } from "@/components/links/detail/update-expiration";
import { UpdateClickLimitDialog } from "@/components/links/detail/update-click-limit";
import { RulesCard } from "@/components/links/detail/rules-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Label as ReLabel,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LinkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { data: link, isLoading, error } = useLink(code);
  const updateLink = useUpdateLink();
  const [copied, setCopied] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [slugInput, setSlugInput] = useState(code);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState("");

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
  });

  const handleUpdate = async (data: any, successMessage: string) => {
    try {
      await updateLink.mutateAsync({ code, data });
      toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error("Failed to update link");
      return false;
    }
  };

  const handleSaveSlug = async () => {
    if (!slugInput || slugInput.trim() === "") {
      toast.error("Short code cannot be empty");
      return;
    }
    if (slugInput === code) {
      setIsEditing(false);
      return;
    }

    setIsCheckingSlug(true);
    try {
      await updateLink.mutateAsync({
        code: code,
        data: { short_code: slugInput },
      });
      toast.success("Short link updated!");
      setIsEditing(false);
      // Redirect to new URL since the code changed
      router.push(`/main/links/${slugInput}`);
    } catch (err) {
      toast.error("Short link unavailable or invalid.");
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleInput || titleInput.trim() === "") {
      toast.error("Title cannot be empty");
      return;
    }
    if (await handleUpdate({ title: titleInput }, "Title updated!")) {
      setIsEditingTitle(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!urlInput || urlInput.trim() === "") {
      toast.error("Original URL cannot be empty");
      return;
    }
    if (
      await handleUpdate({ original_url: urlInput }, "Original URL updated!")
    ) {
      setIsEditingUrl(false);
    }
  };

  const handleSaveDescription = async () => {
    // Description can be empty
    if (
      await handleUpdate(
        { description: descriptionInput },
        "Description updated!"
      )
    ) {
      setIsEditingDescription(false);
    }
  };

  const handleSaveTags = async () => {
    if (
      await handleUpdate(
        {
          utm_source: tagsInput.utm_source,
          utm_medium: tagsInput.utm_medium,
          utm_campaign: tagsInput.utm_campaign,
          utm_content: tagsInput.utm_content,
        },
        "Tags updated!"
      )
    ) {
      setIsEditingTags(false);
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    const shortUrl = `${window.location.host}/${link.short_code}`;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  const handleUpdateExpiration = async (
    shortCode: string,
    data: { expires_at: string | null }
  ) => {
    await updateLink.mutateAsync({ code: shortCode, data });
    toast.success("Expiration updated successfully");
  };

  const handleUpdateClickLimit = async (
    shortCode: string,
    data: { click_limit: number | null }
  ) => {
    await updateLink.mutateAsync({ code: shortCode, data });
    toast.success("Click limit updated successfully");
  };

  if (isLoading) return <DetailPageSkeleton />;

  if (error || !link) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center p-10 space-y-4">
            <TriangleAlert className="h-12 w-12 text-destructive opacity-50" />
            <h2 className="text-xl font-bold text-foreground">
              Link Not Found
            </h2>
            <Button variant="secondary" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const host = typeof window !== "undefined" ? window.location.host : "";
  const shortUrl = `${host}/${link.short_code}`;
  const fullUrl = `https://${shortUrl}`;

  // Calculate Progress if limit exists
  const clickLimit = link.detail?.click_limit || 0;
  const currentClicks = link.detail?.current_clicks || 0;
  const progressPercent =
    clickLimit > 0 ? Math.min((currentClicks / clickLimit) * 100, 100) : 0;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="bg-muted/5">
        <SiteHeader />

        <div className="flex flex-1 flex-col p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Banned Alert */}
          {link.detail?.is_banned && (
            <Alert
              variant="destructive"
              className="border-destructive/20 bg-destructive/10"
            >
              <TriangleAlert className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold ml-2">
                Link Banned
              </AlertTitle>
              <AlertDescription className="ml-2 mt-1">
                This link has been suspended due to:{" "}
                <span className="font-medium">{link.detail.banned_reason}</span>
                {link.detail.banned_by && (
                  <span className="block text-xs mt-1 opacity-70">
                    Action by: {link.detail.banned_by}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="text-3xl font-bold h-12 min-w-[300px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") setIsEditingTitle(false);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-green-600"
                      onClick={handleSaveTitle}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-red-500"
                      onClick={() => setIsEditingTitle(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                      {link.title || link.short_code}
                    </h1>
                    <Badge
                      className={
                        link.is_active
                          ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20"
                          : "bg-gray-500/15 text-gray-600 border-gray-500/20"
                      }
                      variant="outline"
                    >
                      {link.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setTitleInput(link.title || link.short_code);
                        setIsEditingTitle(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Created{" "}
                  {format(new Date(link.created_at), "MMM d, yyyy HH:mm")}
                </span>
                {link.updated_at && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <span className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" /> Updated{" "}
                      {format(new Date(link.updated_at), "MMM d, yyyy HH:mm")}
                    </span>
                  </>
                )}
                <Separator orientation="vertical" className="h-3" />
                <span className="flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5" />{" "}
                  {link.detail?.current_clicks || 0} clicks
                </span>
                {link.detail?.custom_domain && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <span className="flex items-center gap-1.5 text-blue-500">
                      <Globe className="h-3.5 w-3.5" />{" "}
                      {link.detail.custom_domain}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-background">
                    <QrCode className="mr-2 h-4 w-4" /> QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center py-4">
                    <LinkQRCode url={fullUrl} title={link.short_code} />
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => window.open(link.original_url, "_blank")}
                className="bg-background"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Visit
              </Button>
              <Button onClick={() => router.push(`/main/analytics/${code}`)}>
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* ROW 1: Hero, Activity, Passcode */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-stretch">
              {/* Left Group: Hero & Activity */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hero Link Card */}
                <Card className="md:col-span-2 border-primary/20 shadow-sm overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background relative h-full">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Globe className="h-24 w-24 text-primary" />
                  </div>
                  <CardHeader className="pb-3 border-b bg-background/50">
                    <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Short Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6 flex flex-col justify-between h-[calc(100%-3.5rem)]">
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-bold tracking-tighter text-muted-foreground select-none">
                            {host}/
                          </span>
                          <Input
                            value={slugInput}
                            onChange={(e) => setSlugInput(e.target.value)}
                            className="text-xl font-bold h-10 min-w-[120px]"
                            autoFocus
                            disabled={isCheckingSlug}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !isCheckingSlug)
                                handleSaveSlug();
                              if (e.key === "Escape") {
                                setIsEditing(false);
                                setSlugInput(code);
                              }
                            }}
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={handleSaveSlug}
                              disabled={isCheckingSlug}
                            >
                              {isCheckingSlug ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              disabled={isCheckingSlug}
                              onClick={() => {
                                setIsEditing(false);
                                setSlugInput(code);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <div
                            className="flex items-center gap-1 cursor-pointer"
                            onClick={() => window.open(fullUrl, "_blank")}
                          >
                            <span className="text-2xl sm:text-3xl font-bold tracking-tighter text-primary break-all hover:underline decoration-primary/30 underline-offset-4 transition-all">
                              {host}/
                              <span className="text-foreground">
                                {link.short_code}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => {
                                setSlugInput(code);
                                setIsEditing(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={handleCopy}
                            >
                              {copied ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-background/50 p-3 rounded-lg border border-border/50 backdrop-blur-sm mt-auto group relative">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <LinkIcon className="h-3 w-3" /> Target Destination
                        </div>
                        {!isEditingUrl && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setUrlInput(link.original_url);
                              setIsEditingUrl(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {isEditingUrl ? (
                        <div className="space-y-2">
                          <textarea
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveUrl();
                              }
                              if (e.key === "Escape") setIsEditingUrl(false);
                            }}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsEditingUrl(false)}
                              className="h-8 px-2"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveUrl}
                              className="h-8 px-2 text-white"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-sm font-medium break-all whitespace-pre-wrap text-foreground hover:underline cursor-pointer"
                          onClick={() =>
                            window.open(link.original_url, "_blank")
                          }
                        >
                          {link.original_url}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Card */}
                <Card className="flex flex-col h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg
                      width="100"
                      height="50"
                      viewBox="0 0 100 50"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <path
                        d="M5 45L25 25L45 35L65 15L95 5"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 45L25 25L45 35L65 15L95 5V50H5V45Z"
                        fill="currentColor"
                        fillOpacity="0.2"
                      />
                    </svg>
                  </div>
                  <CardHeader className="pb-3 border-b relative z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-primary" />{" "}
                        Activity
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => setShowLimitDialog(true)}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end pt-6">
                    <ChartContainer
                      config={{
                        clicks: {
                          label: "Clicks",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="mx-auto aspect-square max-h-[250px] w-full"
                    >
                      <RadialBarChart
                        data={[
                          {
                            activity: "clicks",
                            current: currentClicks,
                            fill: "#70c5df",
                          },
                        ]}
                        startAngle={90}
                        endAngle={
                          clickLimit > 0
                            ? 90 +
                              (360 * Math.min(currentClicks, clickLimit)) /
                                clickLimit
                            : 450
                        }
                        innerRadius={80}
                        outerRadius={110}
                      >
                        <PolarGrid
                          gridType="circle"
                          radialLines={false}
                          stroke="none"
                          className="first:fill-muted last:fill-background"
                        />
                        <RadialBar
                          dataKey="current"
                          background
                          cornerRadius={10}
                        />
                        <PolarRadiusAxis
                          tick={false}
                          tickLine={false}
                          axisLine={false}
                        >
                          <ReLabel
                            content={({ viewBox }) => {
                              if (
                                viewBox &&
                                "cx" in viewBox &&
                                "cy" in viewBox
                              ) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-foreground text-4xl font-bold"
                                    >
                                      {currentClicks.toLocaleString()}
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 24}
                                      className="fill-muted-foreground"
                                    >
                                      Clicks
                                    </tspan>
                                  </text>
                                );
                              }
                            }}
                          />
                        </PolarRadiusAxis>
                      </RadialBarChart>
                    </ChartContainer>

                    <div className="text-center text-sm text-muted-foreground mt-4">
                      {clickLimit > 0 ? (
                        <span>
                          Limit: {clickLimit.toLocaleString()} (
                          {Math.round(progressPercent)}%)
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Infinity className="h-4 w-4" /> No click limit
                        </span>
                      )}
                    </div>

                    <UpdateClickLimitDialog
                      open={showLimitDialog}
                      onOpenChange={setShowLimitDialog}
                      shortCode={code}
                      currentLimit={clickLimit}
                      onUpdate={handleUpdateClickLimit}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Group: Passcode */}
              <div className="lg:col-span-1">
                <SettingsSecurity
                  shortCode={code}
                  currentPasscode={link.detail?.passcode?.toString()}
                  className="h-full"
                />
              </div>
            </div>

            {/* ROW 2: Notes, Tags, Rules */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-stretch">
              {/* Left Group: Notes & Tags */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description - Editable */}
                <Card className="h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <svg
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <path
                        d="M30 20H70C75.5228 20 80 24.4772 80 30V80C80 85.5228 75.5228 90 70 90H30C24.4772 90 20 85.5228 20 80V30C20 24.4772 24.4772 20 30 20Z"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        d="M35 40H65M35 55H65M35 70H55"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <CardHeader className="pb-3 border-b relative z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                        Description
                      </CardTitle>
                      {!isEditingDescription && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setDescriptionInput(link.description || "");
                            setIsEditingDescription(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 h-full relative z-10">
                    {isEditingDescription ? (
                      <div className="space-y-4">
                        <textarea
                          value={descriptionInput}
                          onChange={(e) => setDescriptionInput(e.target.value)}
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter a description for this link..."
                        />
                        <div className="flex justify-end gap-2 text-white">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingDescription(false)}
                            className="h-8 px-2 text-muted-foreground"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveDescription}
                            className="h-8 px-2"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {link.description ? (
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {link.description}
                          </p>
                        ) : (
                          <div className="h-full flex items-center justify-center min-h-[60px]">
                            <span className="text-sm text-muted-foreground/60 italic">
                              No description provided
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* UTM Tags - Editable */}
                <Card className="h-full group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <svg
                      width="100"
                      height="100"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                    >
                      <path
                        d="M20 50L50 20L80 50L50 80L20 50Z"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="10"
                        fill="currentColor"
                        fillOpacity="0.2"
                      />
                      <path
                        d="M50 20V10M80 50H90M50 80V90M20 50H10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <CardHeader className="pb-3 border-b relative z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" /> Tags
                      </CardTitle>
                      {!isEditingTags && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setTagsInput({
                              utm_source: link.detail?.utm_source || "",
                              utm_medium: link.detail?.utm_medium || "",
                              utm_campaign: link.detail?.utm_campaign || "",
                              utm_content: link.detail?.utm_content || "",
                            });
                            setIsEditingTags(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 h-full">
                    {isEditingTags ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Source</Label>
                            <Input
                              value={tagsInput.utm_source}
                              onChange={(e) =>
                                setTagsInput({
                                  ...tagsInput,
                                  utm_source: e.target.value,
                                })
                              }
                              placeholder="e.g. google, newsletter"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Medium</Label>
                            <Input
                              value={tagsInput.utm_medium}
                              onChange={(e) =>
                                setTagsInput({
                                  ...tagsInput,
                                  utm_medium: e.target.value,
                                })
                              }
                              placeholder="e.g. cpc, email"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Campaign</Label>
                          <Input
                            value={tagsInput.utm_campaign}
                            onChange={(e) =>
                              setTagsInput({
                                ...tagsInput,
                                utm_campaign: e.target.value,
                              })
                            }
                            placeholder="e.g. spring_sale"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Content</Label>
                          <Input
                            value={tagsInput.utm_content}
                            onChange={(e) =>
                              setTagsInput({
                                ...tagsInput,
                                utm_content: e.target.value,
                              })
                            }
                            placeholder="e.g. logolink, textlink"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingTags(false)}
                            className="h-8 px-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveTags}
                            className="h-8 px-2 text-white"
                          >
                            Save Tags
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {link.detail?.utm_source ||
                        link.detail?.utm_medium ||
                        link.detail?.utm_campaign ||
                        link.detail?.utm_content ? (
                          <div className="flex flex-wrap gap-2">
                            {[
                              {
                                k: "source",
                                v: link.detail.utm_source,
                                color:
                                  "bg-blue-50 text-blue-700 border-blue-200",
                              },
                              {
                                k: "medium",
                                v: link.detail.utm_medium,
                                color:
                                  "bg-purple-50 text-purple-700 border-purple-200",
                              },
                              {
                                k: "campaign",
                                v: link.detail.utm_campaign,
                                color:
                                  "bg-pink-50 text-pink-700 border-pink-200",
                              },
                              {
                                k: "content",
                                v: link.detail.utm_content,
                                color:
                                  "bg-orange-50 text-orange-700 border-orange-200",
                              },
                            ].map((tag) =>
                              tag.v ? (
                                <div
                                  key={tag.k}
                                  className={`px-2.5 py-1 rounded-md border text-xs font-medium ${tag.color}`}
                                >
                                  <span className="opacity-60 uppercase mr-1 text-[10px]">
                                    {tag.k}:
                                  </span>
                                  {tag.v}
                                </div>
                              ) : null
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center min-h-[60px] relative group">
                            <span className="text-sm text-muted-foreground/60 italic">
                              No tags
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Group: Rules */}
              <div className="lg:col-span-1">
                <RulesCard
                  shortCode={code}
                  expiresAt={link.expires_at}
                  detail={link.detail}
                  onUpdateExpiration={handleUpdateExpiration}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DetailPageSkeleton() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-10 max-w-7xl mx-auto w-full space-y-8">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <Skeleton className="col-span-2 h-48 rounded-xl" />
                <Skeleton className="col-span-1 h-48 rounded-xl" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

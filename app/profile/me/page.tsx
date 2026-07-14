"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBell,
  IconCrown,
  IconUserQuestion,
  IconCamera,
  IconEye,
} from "@tabler/icons-react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  redeemPremiumCode,
  saveUserData,
  uploadProfileAvatar,
  type UpdateProfileRequest,
} from "@/lib/api/auth";
import {
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/lib/hooks/queries/useProfileQuery";
import { toast } from "sonner";
import { BadgeCheckIcon, Loader2 } from "lucide-react";
import { ProfileGeneralTab } from "@/components/profile/tab/general";
import ProfileSecurityTab from "@/components/profile/tab/security";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SessionTab from "@/components/profile/tab/session";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";

/**
 * Profile Page Content Component
 * Uses useSearchParams() so must be wrapped in Suspense
 */
function ProfilePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "general",
  );
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isViewPhotoOpen, setIsViewPhotoOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hasAppliedRedeemCodeParam, setHasAppliedRedeemCodeParam] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const openPopover = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsPopoverOpen(true);
  };

  const closePopoverWithDelay = () => {
    hoverTimeoutRef.current = setTimeout(() => setIsPopoverOpen(false), 150);
  };
  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    refetch,
  } = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const refreshProfile = () => {
    void refetch();
  };

  const profile = profileResponse?.data;
  const user = profile?.user;
  const userAuth = profile?.auth;

  useEffect(() => {
    if (user) {
      saveUserData(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user || hasAppliedRedeemCodeParam || user.is_premium) {
      return;
    }

    const redeemCodeParam = searchParams.get("redeem_code");
    const normalizedRedeemCode = redeemCodeParam?.trim();
    if (!normalizedRedeemCode) {
      setHasAppliedRedeemCodeParam(true);
      return;
    }

    setSecretCode(normalizedRedeemCode);
    setIsRedeemOpen(true);
    setHasAppliedRedeemCodeParam(true);
  }, [hasAppliedRedeemCodeParam, searchParams, user]);

  const handleSaveName = async (firstName: string, lastName: string) => {
    if (!user) return;

    const payload: UpdateProfileRequest = {};
    if (firstName && firstName !== user.first_name)
      payload.first_name = firstName;
    if (lastName && lastName !== user.last_name) payload.last_name = lastName;

    if (Object.keys(payload).length === 0) return;

    await updateProfileMutation.mutateAsync(payload);
    await refetch();
    toast.success("Profile Updated", {
      description: "Your profile has been updated successfully.",
    });
  };

  const handleRedeemPremium = async () => {
    if (!secretCode.trim()) {
      toast.error("Secret code is required");
      return;
    }

    setIsRedeeming(true);
    try {
      await redeemPremiumCode({ secret_code: secretCode.trim() });
      await refetch();

      setIsRedeemOpen(false);
      setSecretCode("");

      toast.success("Premium activated", {
        description: "Your account has been upgraded to premium.",
      });
    } catch (error) {
      toast.error("Redeem failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to redeem premium code.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleAvatarUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    if (!allowedMimeTypes.has(file.type)) {
      toast.error("Invalid image format", {
        description: "Only JPG, PNG, WEBP, or GIF are allowed.",
      });
      event.target.value = "";
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("Image too large", {
        description: "Maximum file size is 5MB.",
      });
      event.target.value = "";
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await uploadProfileAvatar(file);
      const uploadedAvatar = response.data?.avatar_url;

      if (!uploadedAvatar) {
        throw new Error("Avatar URL is missing from upload response");
      }

      await refetch();

      toast.success("Profile photo updated", {
        description: "Your avatar has been uploaded successfully.",
      });
    } catch (error) {
      toast.error("Avatar upload failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload avatar image.",
      });
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const normalizeAvatarURL = (rawURL?: string) => {
    if (!rawURL) return "";

    const trimmed = rawURL.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const avatarURL = normalizeAvatarURL(user?.avatar);

  if (isProfileLoading && !user) {
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
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                {/* Header Skeleton */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-9 w-32" />
                      <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>

                {/* Profile Card Skeleton */}
                <div className="grid gap-6 md:grid-cols-1">
                  <Card className="md:col-span-1 mx-auto w-full max-w-md">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <Skeleton className="size-32 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-48 mx-auto mb-2" />
                      <Skeleton className="h-5 w-32 mx-auto" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Separator />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>

                  {/* Tabs Skeleton */}
                  <div className="md:col-span-2">
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full max-w-md" />
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-7 w-40" />
                          <Skeleton className="h-5 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!user) {
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
        <SidebarInset>
          <SiteHeader />
          <div className="flex h-full items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>No Profile Data</CardTitle>
                <CardDescription>
                  Please log in to view your profile
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {/* Profile Header */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Profile
                    </h1>
                    <p className="text-muted-foreground">
                      Manage your account settings and preferences
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="grid gap-6 md:grid-cols-1">
                {/* Center Column - Profile Card */}
                <Card className="md:col-span-1 mx-auto w-full max-w-md">
                  <CardHeader className="text-center">
                    <div className="flex flex-col items-center gap-3 mb-2">
                      <Popover
                        open={isPopoverOpen}
                        onOpenChange={setIsPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <div
                            className="relative cursor-pointer rounded-full transition-all duration-300 ease-out hover:scale-105 ring-2 ring-border hover:ring-4 hover:ring-primary/40 hover:shadow-xl hover:shadow-primary/20"
                            onMouseEnter={openPopover}
                            onMouseLeave={closePopoverWithDelay}
                          >
                            <Avatar className="size-32">
                              <AvatarImage
                                src={avatarURL}
                                alt={`${user.first_name} ${user.last_name}`}
                              />
                              <AvatarFallback className="text-2xl">
                                {getInitials(user.first_name, user.last_name)}
                              </AvatarFallback>
                            </Avatar>

                            {isUploadingAvatar && (
                              <div className="absolute inset-0 rounded-full backdrop-blur-[2px] bg-black/50 flex flex-col items-center justify-center text-white">
                                <Loader2 className="size-6 animate-spin" />
                                <span className="text-[11px] font-semibold tracking-wide">
                                  Uploading…
                                </span>
                              </div>
                            )}

                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={handleAvatarSelected}
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto min-w-[140px] p-1"
                          side="right"
                          align="center"
                          sideOffset={12}
                          onMouseEnter={openPopover}
                          onMouseLeave={closePopoverWithDelay}
                        >
                          <div className="flex flex-col gap-0.5">
                            {avatarURL && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsViewPhotoOpen(true);
                                  setIsPopoverOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors duration-150 w-full text-left"
                                aria-label="View profile photo"
                              >
                                <IconEye className="size-4" />
                                <span>View Photo</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                handleAvatarUploadClick();
                                setIsPopoverOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors duration-150 w-full text-left"
                              aria-label={
                                user.avatar
                                  ? "Change profile photo"
                                  : "Upload profile photo"
                              }
                            >
                              <IconCamera className="size-4" />
                              <span>
                                {user.avatar ? "Change Photo" : "Upload Photo"}
                              </span>
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* View Photo Dialog */}
                      <Dialog
                        open={isViewPhotoOpen}
                        onOpenChange={setIsViewPhotoOpen}
                      >
                        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Profile Photo</DialogTitle>
                            <DialogDescription>
                              Full-size profile photo preview
                            </DialogDescription>
                          </DialogHeader>
                          {avatarURL ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <Image
                                src={avatarURL}
                                alt={`${user.first_name} ${user.last_name}`}
                                className="w-full h-auto object-cover max-h-[70vh]"
                                width={500}
                                height={500}
                                unoptimized
                              />
                              {/* Name caption at bottom */}
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                                <p className="text-white font-semibold text-sm">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-white/70 text-xs">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                              No photo uploaded
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                    <CardTitle className="text-2xl">
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1">
                      @{user.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Separator />
                    <Item variant={"outline"} size={"sm"}>
                      {userAuth?.is_email_verified ? (
                        <ItemContent>
                          <ItemTitle className="text-sm text-muted-foreground">
                            Your Profile is Verified
                          </ItemTitle>
                        </ItemContent>
                      ) : (
                        <ItemContent>
                          <ItemTitle className="text-sm text-muted-foreground">
                            Your Profile is Not Verified
                          </ItemTitle>
                        </ItemContent>
                      )}
                      {userAuth?.is_email_verified ? (
                        <ItemMedia>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <BadgeCheckIcon className="size-5 text-green-600" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Verified Email Address. Enjoy access to all
                              features.
                            </TooltipContent>
                          </Tooltip>
                        </ItemMedia>
                      ) : (
                        <ItemMedia>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <IconUserQuestion className="size-5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Unverified Email Address
                            </TooltipContent>
                          </Tooltip>
                        </ItemMedia>
                      )}
                    </Item>

                    <Item variant={"outline"} size={"sm"}>
                      <ItemContent>
                        <ItemTitle className="text-sm text-muted-foreground">
                          Account Tier
                        </ItemTitle>
                      </ItemContent>
                      {user.is_premium ? (
                        <StatusBadge
                          tone="success"
                          withIcon={false}
                          className="gap-1"
                        >
                          <IconCrown className="size-3" />
                          Premium
                        </StatusBadge>
                      ) : (
                        <Dialog
                          open={isRedeemOpen}
                          onOpenChange={setIsRedeemOpen}
                        >
                          <StatusBadge
                            tone="neutral"
                            withIcon={false}
                            className="cursor-pointer transition-colors hover:bg-secondary/80"
                            onClick={() => setIsRedeemOpen(true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setIsRedeemOpen(true);
                              }
                            }}
                          >
                            Free
                          </StatusBadge>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Redeem Premium Code</DialogTitle>
                              <DialogDescription>
                                Enter your secret code to upgrade this account
                                to premium.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter secret code"
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value)}
                                disabled={isRedeeming}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsRedeemOpen(false)}
                                disabled={isRedeeming}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleRedeemPremium}
                                disabled={isRedeeming}
                              >
                                {isRedeeming ? (
                                  <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Redeeming...
                                  </>
                                ) : (
                                  "Redeem"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </Item>
                    <Item variant={"outline"} size={"sm"}>
                      <ItemContent>
                        <ItemTitle className="text-sm text-muted-foreground">
                          Member Since
                        </ItemTitle>
                      </ItemContent>
                      <span className="text-sm font-medium">
                        {formatDate(user.created_at)}
                      </span>
                    </Item>
                  </CardContent>
                </Card>

                {/* Right Column - Details & Settings */}
                <div className="md:col-span-2">
                  <Tabs
                    defaultValue={activeTab}
                    onValueChange={(value) => setActiveTab(value)}
                    className="space-y-4"
                  >
                    <TabsList>
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="session">Session</TabsTrigger>
                      <TabsTrigger value="notifications">
                        Notifications
                      </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <ProfileGeneralTab
                      user={user}
                      formatDate={formatDate}
                      onSaveName={handleSaveName}
                      onEmailChanged={refreshProfile}
                      onUsernameChanged={refreshProfile}
                    />

                    {/* Security Tab */}
                    <ProfileSecurityTab />

                    {/* Session Tab */}
                    <SessionTab />

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Notification Preferences</CardTitle>
                          <CardDescription>
                            Choose what notifications you want to receive
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <IconBell className="size-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  Email Notifications
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Receive updates via email
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Profile Page
 * 🔐 Protected by Next.js middleware (middleware.ts)
 * Shows user profile information and settings
 * Wrapped in Suspense to support useSearchParams()
 */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}

/**
 * Loading skeleton for profile page
 */
function ProfilePageSkeleton() {
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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-1">
                <Card className="md:col-span-1 mx-auto w-full max-w-md">
                  <CardHeader className="items-center text-center">
                    <Skeleton className="size-24 rounded-full" />
                    <Skeleton className="h-6 w-32 mt-4" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

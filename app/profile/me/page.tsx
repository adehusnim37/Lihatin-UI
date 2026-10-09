"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, Suspense, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";
import {
  hasActivePremiumAccess,
  redeemPremiumCode,
  saveUserData,
  uploadProfileAvatar,
  type UpdateProfileRequest,
} from "@/lib/api/auth";
import { useProfileQuery, useUpdateProfileMutation } from "@/lib/hooks/queries/useProfileQuery";
import { toast } from "sonner";
import { Loader2, UserRound, Shield, Laptop, Bell } from "lucide-react";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { ProfileGeneralTab } from "@/components/profile/tab/general";
import ProfileSecurityTab from "@/components/profile/tab/security";
import { Skeleton } from "@/components/ui/skeleton";
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
import { QueryError } from "@/components/query-error";
import Image from "next/image";
import ProfileNotificationsTab from "@/components/profile/tab/notifications";

/**
 * Profile Page Content Component
 * Uses useSearchParams() so must be wrapped in Suspense
 */
function ProfilePageContent() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(() => {
    const requested = searchParams.get("tab");
    return requested && ["general", "security", "session", "notifications"].includes(requested)
      ? requested
      : "general";
  });
  const [redeemOpenOverride, setIsRedeemOpen] = useState<boolean | null>(null);
  const [secretCode, setSecretCode] = useState(() => searchParams.get("redeem_code")?.trim() || "");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isViewPhotoOpen, setIsViewPhotoOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profileResponse, isLoading: isProfileLoading, refetch } = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const refreshProfile = () => {
    void refetch();
  };

  const profile = profileResponse?.data;
  const user = profile?.user;
  const userAuth = profile?.auth;
  const premiumAccessActive = hasActivePremiumAccess(user?.premium_access);
  const isRedeemOpen =
    redeemOpenOverride ?? (!!searchParams.get("redeem_code")?.trim() && !premiumAccessActive);

  useEffect(() => {
    if (user) {
      saveUserData(user);
    }
  }, [user]);

  const handleSaveName = async (firstName: string, lastName: string) => {
    if (!user) return;

    const payload: UpdateProfileRequest = {};
    if (firstName !== user.first_name) payload.first_name = firstName;
    if (lastName !== user.last_name) payload.last_name = lastName;

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
        description: error instanceof Error ? error.message : "Failed to redeem premium code.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleAvatarUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
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
        description: error instanceof Error ? error.message : "Failed to upload avatar image.",
      });
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
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

  if (isProfileLoading && !user) return <ProfilePageSkeleton />;

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
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div className="mx-auto w-full max-w-xl p-6">
            <QueryError
              message="Your profile could not be loaded."
              onRetry={() => void refetch()}
            />
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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-6 sm:px-6">
              {/* Profile Header */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                    <p className="text-muted-foreground">
                      Manage your account settings and preferences
                    </p>
                  </div>
                </div>
              </div>

              {/* Account overview and settings */}
              <div className="flex min-w-0 flex-col gap-6">
                <ProfileOverview
                  user={user}
                  avatarURL={avatarURL}
                  verified={!!userAuth?.is_email_verified}
                  premium={premiumAccessActive}
                  uploading={isUploadingAvatar}
                  joined={formatDate(user.created_at)}
                  onUpload={handleAvatarUploadClick}
                  onViewPhoto={() => setIsViewPhotoOpen(true)}
                  onRedeem={() => setIsRedeemOpen(true)}
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  aria-label="Upload profile photo"
                  onChange={handleAvatarSelected}
                />
                <Dialog open={isViewPhotoOpen} onOpenChange={setIsViewPhotoOpen}>
                  <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Profile Photo</DialogTitle>
                      <DialogDescription>Full-size profile photo preview</DialogDescription>
                    </DialogHeader>
                    {avatarURL ? (
                      <div className="relative">
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
                          <p className="text-white/70 text-xs">@{user.username}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                        No photo uploaded
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Redeem Premium Code</DialogTitle>
                      <DialogDescription>
                        Enter your secret code to upgrade this account to premium.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <label htmlFor="premium-code" className="text-sm font-medium">
                        Premium code
                      </label>
                      <Input
                        id="premium-code"
                        autoComplete="off"
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
                      <Button onClick={handleRedeemPremium} disabled={isRedeeming}>
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
                {/* Right Column - Details & Settings */}
                <div className="min-w-0">
                  <Tabs
                    value={activeTab}
                    orientation={isMobile ? "horizontal" : "vertical"}
                    onValueChange={(value) => setActiveTab(value)}
                    className="grid min-w-0 items-start gap-6 md:grid-cols-[176px_minmax(0,1fr)] md:gap-8 [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card-header]]:px-0 [&_[data-slot=card-content]]:px-0"
                  >
                    <TabsList
                      aria-label="Profile settings"
                      className="grid h-auto w-full grid-cols-2 gap-1 rounded-none border-b bg-transparent p-0 pb-4 md:sticky md:top-6 md:flex md:flex-col md:items-stretch md:border-0 md:pb-0 [&>[data-slot=tabs-trigger]]:h-11 [&>[data-slot=tabs-trigger]]:justify-start [&>[data-slot=tabs-trigger]]:gap-2.5 [&>[data-slot=tabs-trigger]]:px-3 [&>[data-slot=tabs-trigger]]:shadow-none [&>[data-state=active]]:bg-primary/10 [&>[data-state=active]]:text-primary-ink dark:[&>[data-state=active]]:bg-primary/10"
                    >
                      <TabsTrigger value="general" className="min-h-11 md:flex-none">
                        <UserRound aria-hidden="true" className="size-4" />
                        General
                      </TabsTrigger>
                      <TabsTrigger value="security" className="min-h-11 md:flex-none">
                        <Shield aria-hidden="true" className="size-4" />
                        Security
                      </TabsTrigger>
                      <TabsTrigger value="session" className="min-h-11 md:flex-none">
                        <Laptop aria-hidden="true" className="size-4" />
                        Sessions
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="min-h-11 md:flex-none">
                        <Bell aria-hidden="true" className="size-4" />
                        Notifications
                      </TabsTrigger>
                    </TabsList>

                    <div className="min-w-0">
                      {/* General Tab */}
                      <ProfileGeneralTab
                        key={`${user.id}:${user.first_name}:${user.last_name}`}
                        user={user}
                        onSaveName={handleSaveName}
                        onEmailChanged={refreshProfile}
                        onUsernameChanged={refreshProfile}
                      />

                      {/* Security Tab */}
                      <ProfileSecurityTab />

                      {/* Sessions Tab */}
                      <SessionTab />

                      {/* Notifications Tab */}
                      <ProfileNotificationsTab />
                    </div>
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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div
          role="status"
          aria-label="Loading profile"
          className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 sm:px-6"
        >
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-full max-w-sm" />
          </div>
          <div className="flex items-center gap-4 border-b pb-6">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="w-full space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-[176px_minmax(0,1fr)]">
            <Skeleton className="h-40 w-full" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconBell,
  IconEdit,
  IconCheck,
  IconX,
  IconCrown,
  IconUserQuestion,
} from "@tabler/icons-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AuthProfileData,
  redeemPremiumCode,
  saveUserData,
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

/**
 * Profile Page Content Component
 * Uses useSearchParams() so must be wrapped in Suspense
 */
function ProfilePageContent() {
  const [user, setUser] = useState<AuthProfileData["user"]>();
  const [userAuth, setUserAuth] = useState<AuthProfileData["auth"]>();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState<
    Partial<AuthProfileData["user"]>
  >({});
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "general",
  );
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { data: profileResponse, isLoading: isProfileLoading, refetch } =
    useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const loadUserData = async () => {
    try {
      await refetch();
    } catch (err) {
      console.error("Failed to refresh user data", err);
    }
  };

  useEffect(() => {
    if (profileResponse?.success && profileResponse.data) {
      const profile = profileResponse.data;
      setUser(profile.user);
      setUserAuth(profile.auth);
      saveUserData(profile.user);
      setEditedUser({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name,
        email: profile.user.email,
      });
    }
  }, [profileResponse]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    const payload: UpdateProfileRequest = {};
    const firstName = editedUser.first_name?.trim();
    const lastName = editedUser.last_name?.trim();

    if (firstName && firstName !== user.first_name) {
      payload.first_name = firstName;
    }
    if (lastName && lastName !== user.last_name) {
      payload.last_name = lastName;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes detected", {
        description: "Edit your name before saving.",
      });
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync(payload);
      await refetch();
      setIsEditing(false);
      toast.success("Profile Updated", {
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast.error("Update failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRedeemPremium = async () => {
    if (!secretCode.trim()) {
      toast.error("Secret code is required");
      return;
    }

    setIsRedeeming(true);
    try {
      await redeemPremiumCode({ secret_code: secretCode.trim() });

      setUser((prev) => (prev ? { ...prev, is_premium: true } : prev));
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
                        <Skeleton className="h-32 w-32 rounded-full" />
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
                  {activeTab === "general" ? (
                    !isEditing ? (
                      <Button onClick={handleEdit}>
                        <IconEdit className="mr-2 h-6 w-6" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                          <IconX className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          <IconCheck className="mr-2 h-4 w-4" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )
                  ) : null}
                </div>
              </div>

              {/* Profile Content */}
              <div className="grid gap-6 md:grid-cols-1">
                {/* Center Column - Profile Card */}
                <Card className="md:col-span-1 mx-auto w-full max-w-md">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage
                          src={user.avatar}
                          alt={`${user.first_name} ${user.last_name}`}
                        />
                        <AvatarFallback className="text-2xl">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
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
                                <BadgeCheckIcon className="h-5 w-5 text-green-600" />
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
                                <IconUserQuestion className="h-5 w-5" />
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
                        <Badge variant="default" className="gap-1">
                          <IconCrown className="h-3 w-3" />
                          Premium
                        </Badge>
                      ) : (
                        <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                          <Badge
                            variant="secondary"
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
                          </Badge>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Redeem Premium Code</DialogTitle>
                              <DialogDescription>
                                Enter your secret code to upgrade this account to premium.
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
                              <Button onClick={handleRedeemPremium} disabled={isRedeeming}>
                                {isRedeeming ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                      editedUser={editedUser}
                      setEditedUser={setEditedUser}
                      isEditing={isEditing}
                      formatDate={formatDate}
                      onEmailChanged={loadUserData}
                      onUsernameChanged={loadUserData}
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
                              <IconBell className="h-5 w-5 text-muted-foreground" />
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
                    <Skeleton className="h-24 w-24 rounded-full" />
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

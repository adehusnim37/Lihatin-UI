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
import { useState, useEffect } from "react";
import { AuthProfileData, getUserData } from "@/lib/api/auth";
import { toast } from "sonner";
import { BadgeCheckIcon, Loader2 } from "lucide-react";
import { ProfileGeneralTab } from "@/components/profile/tab/general";
import ProfileSecurityTab from "@/components/profile/tab/security";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";

/**
 * Profile Page
 * 🔐 Protected by Next.js middleware (middleware.ts)
 * Shows user profile information and settings
 */
export default function ProfilePage() {
  const [user, setUser] = useState<AuthProfileData["user"]>();
  const [userAuth, setUserAuth] = useState<AuthProfileData["auth"]>();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<
    Partial<AuthProfileData["user"]>
  >({});
  const [activeTab, setActiveTab] = useState("general");

  const loadUserData = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        setUser(userData.data?.user);
        setUserAuth(userData.data?.auth)
        setEditedUser({
          first_name: userData.data?.user.first_name,
          last_name: userData.data?.user.last_name,
          username: userData.data?.user.username,
          email: userData.data?.user.email,
        });
      }
    } catch (err) {
      console.error("Failed to load user data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    // TODO: Call API to update profile
    toast.success("Profile Updated", {
      description: "Your profile has been updated successfully.",
    });
    setIsEditing(false);

    // Update user state with edited values
    if (user) {
      setUser({
        ...user,
        ...editedUser,
      });
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

  if (isLoading) {
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                        <Button onClick={handleSave}>
                          <IconCheck className="mr-2 h-4 w-4" />
                          Save Changes
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
                      {userAuth?.is_email_verified ?(
                        <ItemMedia>
                          <BadgeCheckIcon className="size-5" />
                        </ItemMedia>
                      ) : (
                        <ItemMedia>
                          <IconUserQuestion className="size-5" />
                        </ItemMedia>
                      ) }
                    </Item>
                    
                    <Item variant={"outline"} size={"sm"}>
                      <ItemContent>
                        <ItemTitle className="text-sm text-muted-foreground">
                          Account Status
                        </ItemTitle>
                      </ItemContent>
                      {user.is_premium ? (
                        <Badge variant="default" className="gap-1">
                          <IconCrown className="h-3 w-3" />
                          Premium
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
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
                    />

                    {/* Security Tab */}
                    <ProfileSecurityTab />

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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import {
  IconBoxMultiple,
  IconChevronDown,
  IconDeviceDesktopCode,
  IconKey,
  IconLock,
  IconShield,
} from "@tabler/icons-react";
import { Label } from "recharts";
import ChangePasswordDialog from "../modal/changePassword";
import SetupTOTPModal from "../modal/setupTOTP";
import DisableTOTPModal from "../modal/disableTOTP";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";

export default function ProfileSecurityTab() {
  const searchParams = useSearchParams();
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const { data: profileResponse, isLoading, error: profileError, refetch } = useProfileQuery();
  const profileData = profileResponse?.data ?? null;
  const shouldAutoOpenTOTP =
    searchParams.get("openSetupTOTP") === "1" &&
    !profileData?.auth.is_totp_enabled;

  const handlePasswordChanged = () => {
    void refetch();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (isLoading) {
    return (
      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage your password and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  if (profileError) {
    return (
      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Failed to load security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{profileError instanceof Error ? profileError.message : "Failed to load security settings"}</p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="security" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconKey className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">
                    Last changed{" "}
                    {formatRelativeTime(profileData?.auth.password_changed_at)}
                  </p>
                </div>
              </div>
              <ChangePasswordDialog onPasswordChanged={handlePasswordChanged} />
            </div>
          </div>

          {/* Collapsible Last Login Session */}
          <div className="space-y-2">
            <Label>Last Login Session</Label>
            <Collapsible
              open={isSessionOpen}
              onOpenChange={setIsSessionOpen}
              className="space-y-2"
            >
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3 flex-1">
                  <IconBoxMultiple className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Session Information</p>
                    {!isSessionOpen && (
                      <p className="text-xs text-muted-foreground">
                        Click to view details
                      </p>
                    )}
                  </div>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <IconChevronDown
                      className={`size-4 transition-transform ${
                        isSessionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-2">
                <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last IP Address
                    </span>
                    <span className="text-sm font-medium font-mono">
                      {profileData?.auth.last_ip || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Login
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(profileData?.auth.last_login_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Account Status
                    </span>
                    <span className="text-sm font-medium">
                      {profileData?.auth.is_active ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="space-y-2">
            <Label>Device ID</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconDeviceDesktopCode className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Device Identifier</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono font-medium">
                {profileData?.auth.device_id || "N/A"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Failed Login Attempts</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconLock className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Account Security</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {profileData?.auth.failed_login_attempts || 0} unsuccessful
                attempts
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Two-Factor Authentication</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconShield className={`size-5 ${profileData?.auth.is_totp_enabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">2FA Status</p>
                  <p className="text-xs text-muted-foreground">
                    {profileData?.auth.is_totp_enabled
                      ? "Enabled - Your account is protected"
                      : "Not enabled - Add extra security"}
                  </p>
                </div>
              </div>
              {profileData?.auth.is_totp_enabled ? (
                <DisableTOTPModal onDisableComplete={() => refetch()} />
              ) : (
                <SetupTOTPModal
                  onSetupComplete={() => refetch()}
                  openOnMount={shouldAutoOpenTOTP}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

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
  IconMail,
  IconMailOff,
  IconShield,
} from "@tabler/icons-react";
import { Label } from "recharts";
import ChangePasswordDialog from "../modal/changePassword";
import VerifyEmailModal from "../modal/verifyEmail";
import SetupTOTPModal from "../modal/setupTOTP";
import DisableTOTPModal from "../modal/disableTOTP";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getProfile, AuthProfileData } from "@/lib/api/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSecurityTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [profileData, setProfileData] = useState<AuthProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getProfile();
      if (response.success && response.data) {
        setProfileData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Callback when email is verified
  const handleEmailVerified = () => {
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePasswordChanged = () => {
    // Refresh profile data to update password_changed_at timestamp
    fetchProfile();
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

  if (error) {
    return (
      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Failed to load security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
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
            <Label>Email Verification</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {profileData?.auth.is_email_verified ? (
                  <IconMail className="h-5 w-5 text-green-600" />
                ) : (
                  <IconMailOff className="h-5 w-5 text-orange-600" />
                )}
                <div>
                  <p className="text-sm font-medium">Email Status</p>
                  <p className="text-xs text-muted-foreground">
                    {profileData?.auth.is_email_verified
                      ? "Verified"
                      : "Not verified"}
                  </p>
                </div>
              </div>
              {!profileData?.auth.is_email_verified && (
                <VerifyEmailModal
                  email={profileData?.user.email}
                  onVerified={handleEmailVerified}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconKey className="h-5 w-5 text-muted-foreground" />
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
                  <IconBoxMultiple className="h-5 w-5 text-muted-foreground" />
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
                      className={`h-4 w-4 transition-transform ${
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
                <IconDeviceDesktopCode className="h-5 w-5 text-muted-foreground" />
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
                <IconLock className="h-5 w-5 text-muted-foreground" />
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
                <IconShield className={`h-5 w-5 ${profileData?.auth.is_totp_enabled ? 'text-green-600' : 'text-muted-foreground'}`} />
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
                <DisableTOTPModal onDisableComplete={fetchProfile} />
              ) : (
                <SetupTOTPModal onSetupComplete={fetchProfile} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

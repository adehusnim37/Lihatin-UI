import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import { IconKey, IconShield, IconUserCheck } from "@tabler/icons-react";
import ChangePasswordDialog from "../modal/changePassword";
import SetupTOTPModal from "../modal/setupTOTP";
import DisableTOTPModal from "../modal/disableTOTP";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";
import { useAuth } from "@/app/context/AuthContext";

export default function ProfileSecurityTab() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { data: profileResponse, isLoading, error: profileError, refetch } = useProfileQuery();
  const profileData = profileResponse?.data ?? null;
  const shouldAutoOpenTOTP =
    searchParams.get("openSetupTOTP") === "1" && !profileData?.auth.totp_enabled;

  const handlePasswordChanged = () => {
    void refetch();
  };

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (isLoading) {
    return (
      <TabsContent value="security" className="space-y-4">
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your password and security preferences</CardDescription>
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
        <Card className="min-w-0 shadow-none">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Failed to load security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              {profileError instanceof Error
                ? profileError.message
                : "Failed to load security settings"}
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="security" className="space-y-4">
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage your password and security preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Password</h3>
            <div className="flex flex-col items-start justify-between gap-4 border-b py-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <IconKey className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">
                    Last changed {formatRelativeTime(profileData?.auth.password_changed_at)}
                  </p>
                </div>
              </div>
              <ChangePasswordDialog onPasswordChanged={handlePasswordChanged} />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Two-factor authentication</h3>
            <div className="flex flex-col items-start justify-between gap-4 border-b py-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <IconShield
                  className={`size-5 ${profileData?.auth.totp_enabled ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}
                />
                <div>
                  <p className="text-sm font-medium">2FA Status</p>
                  <p className="text-xs text-muted-foreground">
                    {profileData?.auth.totp_enabled
                      ? "Enabled - Your account is protected"
                      : "Not enabled - Add extra security"}
                  </p>
                </div>
              </div>
              {profileData?.auth.totp_enabled ? (
                <DisableTOTPModal onDisableComplete={() => refetch()} disabled={isAdmin} />
              ) : (
                <SetupTOTPModal
                  onSetupComplete={() => refetch()}
                  openOnMount={shouldAutoOpenTOTP}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Account</h3>
            <div className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <IconUserCheck className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-xs text-muted-foreground">
                    Your account access is currently{" "}
                    {profileData?.auth.account_status === "active" ? "available" : "restricted"}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-medium ${
                  profileData?.auth.account_status === "active"
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {profileData?.auth.account_status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

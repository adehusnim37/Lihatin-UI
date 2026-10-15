import Link from "next/link";
import { ArrowUpRight, KeyRound, Monitor, ShieldCheck, UserCheck } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { QueryError } from "@/components/query-error";
import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";
import ChangePasswordDialog from "../modal/changePassword";

function passwordChangedLabel(value?: string | null) {
  if (!value) return "Manage the password you use to sign in.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Manage the password you use to sign in.";
  return `Last changed ${date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })}`;
}

export default function ProfileSecurityTab() {
  const { data, isLoading, error, refetch } = useProfileQuery();
  const profile = data?.data;
  const rowClass = "flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6";
  const iconClass = "mt-0.5 size-5 shrink-0 text-muted-foreground";
  const actionClass = "w-full shrink-0 sm:w-52";

  return (
    <TabsContent value="security" className="min-w-0">
      <Card className="min-w-0 gap-2 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Account security</CardTitle>
          <CardDescription>Manage how you sign in and where your account is used.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-5 py-5" aria-label="Loading security settings" role="status">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error || !profile ? (
            <div className="py-5">
              <QueryError message="Your security settings could not be loaded." onRetry={() => void refetch()} />
            </div>
          ) : (
            <div className="divide-y">
              <section className={rowClass} aria-labelledby="profile-password-title">
                <div className="flex min-w-0 items-start gap-3">
                  <KeyRound aria-hidden="true" className={iconClass} />
                  <div className="space-y-1">
                    <h3 id="profile-password-title" className="text-sm font-semibold">Password</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{passwordChangedLabel(profile.auth.password_changed_at)}</p>
                  </div>
                </div>
                <div className={`${actionClass} [&>button]:w-full`}>
                  <ChangePasswordDialog onPasswordChanged={() => void refetch()} />
                </div>
              </section>

              <section className={rowClass} aria-labelledby="profile-methods-title">
                <div className="flex min-w-0 items-start gap-3">
                  <ShieldCheck aria-hidden="true" className={iconClass} />
                  <div className="space-y-1">
                    <h3 id="profile-methods-title" className="text-sm font-semibold">Authenticator & Passkeys</h3>
                    <p className="text-sm leading-6 text-muted-foreground">Manage your authenticator, passkeys, and recovery codes.</p>
                    <StatusBadge tone={profile.auth.totp_enabled ? "success" : "neutral"} withIcon={false}>
                      {profile.auth.totp_enabled ? "Authenticator enabled" : "Authenticator not enabled"}
                    </StatusBadge>
                  </div>
                </div>
                <Button asChild variant="outline" className={actionClass}>
                  <Link href="/profile/security">Manage sign-in methods<ArrowUpRight aria-hidden="true" className="size-4" /></Link>
                </Button>
              </section>

              <section className={rowClass} aria-labelledby="profile-sessions-title">
                <div className="flex min-w-0 items-start gap-3">
                  <Monitor aria-hidden="true" className={iconClass} />
                  <div className="space-y-1">
                    <h3 id="profile-sessions-title" className="text-sm font-semibold">Sessions</h3>
                    <p className="text-sm leading-6 text-muted-foreground">Review active devices, sign out sessions, and check your login history.</p>
                  </div>
                </div>
                <Button asChild variant="outline" className={actionClass}>
                  <Link href="/profile/sessions">Manage sessions<ArrowUpRight aria-hidden="true" className="size-4" /></Link>
                </Button>
              </section>

              <section className="flex flex-wrap items-center justify-between gap-4 pt-6" aria-labelledby="profile-status-title">
                <div className="flex items-center gap-3">
                  <UserCheck aria-hidden="true" className="size-5 text-muted-foreground" />
                  <h3 id="profile-status-title" className="text-sm font-medium">Account status</h3>
                </div>
                <StatusBadge tone={profile.auth.account_status === "active" ? "success" : "warning"} withIcon={false}>
                  {profile.auth.account_status === "active" ? "Active" : "Restricted"}
                </StatusBadge>
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

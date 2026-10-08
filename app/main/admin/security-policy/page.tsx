"use client";

import { useMemo, type CSSProperties } from "react";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";
import { QueryError } from "@/components/query-error";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { EnabledDisabledBadge, EnvironmentEffectiveBadge } from "@/components/ui/app-status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useAdminDisposableEmailPolicyQuery,
  useUpdateAdminDisposableEmailPolicyMutation,
} from "@/lib/hooks/queries/useAdminQuery";

export default function AdminSecurityPolicyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const role = user?.role?.trim().toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";
  const { data: policy, isLoading, isError, refetch } = useAdminDisposableEmailPolicyQuery();
  const updatePolicyMutation = useUpdateAdminDisposableEmailPolicyMutation();

  const formattedUpdatedAt = useMemo(() => {
    if (!policy || !policy.last_updated_at) {
      return "Unknown";
    }
    return new Date(policy.last_updated_at).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [policy]);

  const handleToggle = (checked: boolean) => {
    if (!policy || updatePolicyMutation.isPending) return;
    updatePolicyMutation.mutate({ enabled: checked });
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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Admin Security Policy</h1>
            <p className="text-sm text-muted-foreground">
              Manage global security controls for account onboarding and email updates.
            </p>
          </div>

          {(authLoading || (isAdmin && isLoading)) && <PageSkeleton />}

          {!authLoading && !isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  This page is available only for admin and super admin roles.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isError && isAdmin && (
            <QueryError
              message="Could not load the security policy."
              onRetry={() => void refetch()}
            />
          )}

          {!isLoading && !isError && policy && isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="size-5" />
                  Disposable Email Protection
                </CardTitle>
                <CardDescription>
                  When enabled, disposable email addresses are blocked for signup, Google signup
                  account creation, and change-email flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Policy Status</p>
                    <p className="text-xs text-muted-foreground">
                      Effective only when backend environment is production.
                    </p>
                  </div>
                  <Switch
                    checked={policy.enabled}
                    onCheckedChange={handleToggle}
                    disabled={updatePolicyMutation.isPending}
                    aria-label="Toggle disposable email policy"
                  />
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <EnabledDisabledBadge enabled={policy.enabled} />
                  <EnvironmentEffectiveBadge effective={policy.effective_in_current_env} />
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Last updated by: {policy.last_updated_by || "system"}</p>
                  <p>Last updated at: {formattedUpdatedAt}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full max-w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-5 w-full max-w-80" />
      </CardContent>
    </Card>
  );
}

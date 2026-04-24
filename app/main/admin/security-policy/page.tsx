"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  EnabledDisabledBadge,
  EnvironmentEffectiveBadge,
} from "@/components/ui/app-status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getAdminDisposableEmailPolicy,
  updateAdminDisposableEmailPolicy,
  type AdminDisposableEmailPolicyResponse,
} from "@/lib/api/auth";

type LoadState = "loading" | "ready" | "forbidden" | "error";

export default function AdminSecurityPolicyPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [policy, setPolicy] = useState<AdminDisposableEmailPolicyResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Fast guard from same user payload used by sidebar.
        const roleFromStorage = getStoredRole();
        if (roleFromStorage && !isAdminRole(roleFromStorage)) {
          setState("forbidden");
          return;
        }

        // Authoritative check still done by admin endpoint (cookie-auth on backend).
        const policyResponse = await getAdminDisposableEmailPolicy();
        setPolicy(policyResponse.data ?? null);
        setState("ready");
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (
          message.includes("administrator") ||
          message.includes("permission") ||
          message.includes("access denied") ||
          message.includes("forbidden")
        ) {
          setState("forbidden");
          return;
        }
        console.error("Failed to load admin policy page", error);
        setState("error");
      }
    };

    void load();
  }, []);

  const formattedUpdatedAt = useMemo(() => {
    if (!policy?.last_updated_at) {
      return "Unknown";
    }
    return new Date(policy.last_updated_at).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [policy?.last_updated_at]);

  const handleToggle = async (checked: boolean) => {
    if (!policy || isSaving) {
      return;
    }

    const previous = policy;
    setPolicy({ ...policy, enabled: checked });
    setIsSaving(true);

    try {
      const response = await updateAdminDisposableEmailPolicy({ enabled: checked });
      if (response.data) {
        setPolicy(response.data);
      }
      toast.success("Policy updated", {
        description: checked
          ? "Disposable email protection is now enabled."
          : "Disposable email protection is now disabled.",
      });
    } catch (error) {
      setPolicy(previous);
      toast.error("Failed to update policy", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Admin Security Policy</h1>
            <p className="text-sm text-muted-foreground">
              Manage global security controls for account onboarding and email updates.
            </p>
          </div>

          {state === "loading" && <PageSkeleton />}

          {state === "forbidden" && (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is available only for admin and super admin roles.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {state === "error" && (
            <Card>
              <CardHeader>
                <CardTitle>Failed to Load Policy</CardTitle>
                <CardDescription>Please refresh page or try again later.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {state === "ready" && policy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Disposable Email Protection
                </CardTitle>
                <CardDescription>
                  When enabled, disposable email addresses are blocked for signup, Google signup account creation,
                  and change-email flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Policy Status</p>
                    <p className="text-xs text-muted-foreground">
                      Effective only when backend environment is production.
                    </p>
                  </div>
                  <Switch
                    checked={policy.enabled}
                    onCheckedChange={handleToggle}
                    disabled={isSaving}
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
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-5 w-80" />
      </CardContent>
    </Card>
  );
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { role?: string };
    if (!parsed.role) {
      return null;
    }
    const normalized = parsed.role.trim().toLowerCase();
    return normalized || null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

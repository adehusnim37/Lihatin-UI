"use client";

import {
  IconChartBar,
  IconMail,
  IconShieldCheck,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/lib/hooks/queries/useNotificationPreferencesQuery";
import type { UpdateNotificationPreferences } from "@/lib/api/notifications";

interface PreferenceRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  statusLabel?: string;
}

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
  statusLabel,
}: PreferenceRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="flex gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {statusLabel ? (
          <span className="text-xs font-medium text-muted-foreground">
            {statusLabel}
          </span>
        ) : null}
        <Switch
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          aria-label={title}
        />
      </div>
    </div>
  );
}

export default function ProfileNotificationsTab() {
  const preferencesQuery = useNotificationPreferencesQuery();
  const updateMutation = useUpdateNotificationPreferencesMutation();
  const preferences = preferencesQuery.data?.data;

  const updatePreference = async (
    payload: UpdateNotificationPreferences,
    successMessage: string,
  ) => {
    try {
      await updateMutation.mutateAsync(payload);
      toast.success(successMessage);
    } catch (error) {
      toast.error("Preference could not be updated", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <TabsContent value="notifications" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <IconMail className="size-5 text-muted-foreground" />
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose the optional emails you want to receive.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {preferencesQuery.isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : preferencesQuery.isError || !preferences ? (
            <div className="rounded-lg border border-destructive/40 p-4">
              <p className="text-sm font-medium">
                Notification preferences could not be loaded.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {preferencesQuery.error instanceof Error
                  ? preferencesQuery.error.message
                  : "Please try again."}
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => preferencesQuery.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <PreferenceRow
                icon={<IconShieldCheck className="size-5" />}
                title="Security alerts"
                description="Critical account activity such as new logins, password changes, and email changes."
                checked={preferences.security_alerts_email}
                disabled
                statusLabel="Always on"
              />
              <PreferenceRow
                icon={<IconChartBar className="size-5" />}
                title="Weekly analytics summary"
                description="Receive a Monday summary of clicks, visitors, newly created links, and your top-performing link."
                checked={preferences.weekly_summary_email}
                disabled={updateMutation.isPending}
                onCheckedChange={(checked) =>
                  void updatePreference(
                    { weekly_summary_email: checked },
                    checked
                      ? "Weekly summaries enabled"
                      : "Weekly summaries disabled",
                  )
                }
              />
              <PreferenceRow
                icon={<IconSpeakerphone className="size-5" />}
                title="Promotions and offers"
                description="Receive occasional Lihatin offers and promotional announcements. You can unsubscribe at any time."
                checked={preferences.promotional_email}
                disabled={updateMutation.isPending}
                onCheckedChange={(checked) =>
                  void updatePreference(
                    { promotional_email: checked },
                    checked
                      ? "Promotional emails enabled"
                      : "Promotional emails disabled",
                  )
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

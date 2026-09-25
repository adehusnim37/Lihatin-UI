"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HttpMethodBadge, HttpStatusCodeBadge } from "@/components/ui/app-status-badges";
import {
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { APIKeyResponse } from "@/lib/api/api-keys";
import { useAPIKeyUsage } from "@/lib/hooks/queries/useAPIKeysQuery";
import { formatDistanceToNow, format } from "date-fns";

interface APIKeyUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKeyResponse;
}

export function APIKeyUsageDialog({ open, onOpenChange, apiKey }: APIKeyUsageDialogProps) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: usageData,
    isLoading,
    error,
  } = useAPIKeyUsage(
    apiKey.id,
    page,
    limit,
    open, // Only fetch when dialog is open
  );

  const activityLogs = usageData?.activity_logs || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  const formatFullDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPpp");
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="size-5 text-purple-500" />
            </div>
            <DialogTitle>API Key Usage</DialogTitle>
          </div>
          <DialogDescription>
            Activity logs for <strong>{apiKey.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 sm:py-4 border-b">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate font-medium">Counted Uses</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{apiKey.usage_count}</p>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate font-medium">Key Total Cap</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{apiKey.limit_usage ?? "∞"}</p>
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate font-medium">Last Used</p>
            <p
              className="text-xs sm:text-sm font-medium truncate"
              title={apiKey.last_used_at ? formatFullDate(apiKey.last_used_at) : undefined}
            >
              {formatDate(apiKey.last_used_at)}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Rate limit berlaku bersama untuk semua key dalam akun. Request yang ditolak karena izin
          atau rate limit tidak menambah penggunaan key.
        </p>

        {/* Activity Logs */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 select-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">Failed to load usage data</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
              <Activity className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground">API requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border bg-card p-3 space-y-2 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <HttpMethodBadge method={log.activity_log.method || "GET"} />
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate max-w-[140px] xs:max-w-[240px] sm:max-w-none">
                        {log.activity_log.route || "/"}
                      </code>
                    </div>
                    <HttpStatusCodeBadge statusCode={log.activity_log.status_code} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatFullDate(log.activity_log.timestamp)}
                    </span>
                    {log.activity_log.ip_address && (
                      <span className="flex items-center gap-1">
                        <Globe className="size-3" />
                        {log.activity_log.ip_address}
                      </span>
                    )}
                    {log.activity_log.response_time && (
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="size-3" />
                        {log.activity_log.response_time}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {usageData && usageData.total_pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {usageData.total_pages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!usageData.has_prev}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!usageData.has_next}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

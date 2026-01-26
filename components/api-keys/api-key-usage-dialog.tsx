"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { getAPIKeyUsage, APIKeyResponse } from "@/lib/api/api-keys";
import { formatDistanceToNow, format } from "date-fns";

interface APIKeyUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKeyResponse;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-500",
  POST: "bg-green-500/10 text-green-500",
  PUT: "bg-amber-500/10 text-amber-500",
  PATCH: "bg-orange-500/10 text-orange-500",
  DELETE: "bg-red-500/10 text-red-500",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-500/10 text-green-500",
  error: "bg-red-500/10 text-red-500",
  warning: "bg-amber-500/10 text-amber-500",
};

export function APIKeyUsageDialog({
  open,
  onOpenChange,
  apiKey,
}: APIKeyUsageDialogProps) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["api-key-usage", apiKey.id, page],
    queryFn: () => getAPIKeyUsage(apiKey.id, page, limit),
    enabled: open,
  });

  const usageData = data?.data;
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

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return STATUS_COLORS.warning;
    if (statusCode >= 200 && statusCode < 300) return STATUS_COLORS.success;
    if (statusCode >= 400) return STATUS_COLORS.error;
    return STATUS_COLORS.warning;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <DialogTitle>API Key Usage</DialogTitle>
          </div>
          <DialogDescription>
            Activity logs for <strong>{apiKey.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{usageData?.total_count || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Usage Limit</p>
            <p className="text-2xl font-bold">{apiKey.limit_usage || "∞"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Used</p>
            <p className="text-sm font-medium">
              {formatDate(apiKey.last_used_at)}
            </p>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">Failed to load usage data</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground">
                API requests will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border bg-card p-3 space-y-2 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          METHOD_COLORS[log.activity_log.method || "GET"]
                        }
                      >
                        {log.activity_log.method || "GET"}
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {log.activity_log.route || "/"}
                      </code>
                    </div>
                    <Badge
                      variant="outline"
                      className={getStatusColor(log.activity_log.status_code)}
                    >
                      {log.activity_log.status_code || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatFullDate(log.activity_log.timestamp)}
                    </span>
                    {log.activity_log.ip_address && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {log.activity_log.ip_address}
                      </span>
                    )}
                    {log.activity_log.response_time && (
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
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
          <div className="flex items-center justify-between pt-4 border-t">
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
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!usageData.has_next}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

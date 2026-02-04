"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { useLogById } from "@/lib/hooks/queries/useLogsQuery";
import { Label } from "../ui/label";

interface LogDetailDialogProps {
  logId: string | null;
  onClose: () => void;
}

const formatTimestamp = (timestamp: string) => {
  try {
    return format(new Date(timestamp), "MMM d, HH:mm:ss");
  } catch {
    return timestamp;
  }
};

export function LogDetailDialog({ logId, onClose }: LogDetailDialogProps) {
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const { data: logDetail, isLoading: logDetailLoading } = useLogById(logId || "");

  const copyToClipboard = async (text: string, type: "request" | "response") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "request") {
        setCopiedRequest(true);
        setTimeout(() => setCopiedRequest(false), 2000);
      } else {
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={!!logId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Log Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this activity log
          </DialogDescription>
        </DialogHeader>

        {logDetailLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logDetail?.data ? (
          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Method</Label>
                <div className="mt-1">
                  <Badge 
                    variant="outline"
                    className={`font-mono ${
                      logDetail.data.method === "GET"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : logDetail.data.method === "POST"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                        : logDetail.data.method === "PUT"
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                        : logDetail.data.method === "PATCH"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : logDetail.data.method === "DELETE"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        : ""
                    }`}
                  >
                    {logDetail.data.method}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Status Code</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      logDetail.data.status_code >= 200 && logDetail.data.status_code < 300
                        ? "default"
                        : "destructive"
                    }
                    className="font-mono"
                  >
                    {logDetail.data.status_code}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Level</Label>
                <div className="mt-1">
                  <Badge 
                    variant={
                      logDetail.data.level.toLowerCase() === "error" || logDetail.data.level.toLowerCase() === "fatal"
                        ? "destructive"
                        : logDetail.data.level.toLowerCase() === "warn"
                        ? "outline"
                        : "secondary"
                    }
                    className={
                      logDetail.data.level.toLowerCase() === "warning"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : logDetail.data.level.toLowerCase() === "info"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : logDetail.data.level.toLowerCase() === "success"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : ""
                    }
                  >
                    {logDetail.data.level}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Response Time</Label>
                <p className="text-sm mt-1">{logDetail.data.response_time}ms</p>
              </div>
            </div>

            <Separator />

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Username</Label>
                <p className="text-sm mt-1">{logDetail.data.username || "Anonymous"}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Action</Label>
                <p className="text-sm mt-1">{logDetail.data.action}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">IP Address</Label>
                <p className="text-sm mt-1 font-mono">{logDetail.data.ip_address}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Timestamp</Label>
                <p className="text-sm mt-1">{formatTimestamp(logDetail.data.created_at)}</p>
              </div>
            </div>

            <Separator />

            {/* Request Info */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Route</Label>
              <code className="block mt-1 p-2 rounded bg-muted text-sm font-mono">
                {logDetail.data.route}
              </code>
            </div>

            {logDetail.data.message && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Message</Label>
                <p className="text-sm mt-1">{logDetail.data.message}</p>
              </div>
            )}

            {logDetail.data.user_agent && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground">User Agent</Label>
                <p className="text-xs mt-1 text-muted-foreground font-mono break-all">
                  {logDetail.data.user_agent}
                </p>
              </div>
            )}

            {logDetail.data.request_body && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium text-muted-foreground">Request Body</Label>
                  <button
                    onClick={() => copyToClipboard(logDetail.data.request_body, "request")}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md hover:bg-accent transition-colors"
                  >
                    {copiedRequest ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded bg-muted text-xs font-mono overflow-auto max-h-60 whitespace-pre-wrap break-words">
                  {JSON.stringify(JSON.parse(logDetail.data.request_body), null, 2)}
                </pre>
              </div>
            )}

            {logDetail.data.response_body && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium text-muted-foreground">Response Body</Label>
                  <button
                    onClick={() => copyToClipboard(logDetail.data.response_body, "response")}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md hover:bg-accent transition-colors"
                  >
                    {copiedResponse ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded bg-muted text-xs font-mono overflow-auto max-h-80 whitespace-pre-wrap break-words">
                  {JSON.stringify(JSON.parse(logDetail.data.response_body), null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>Failed to load log details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

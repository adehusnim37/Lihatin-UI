"use client";

import { useState } from "react";
import {
  Key,
  Copy,
  Check,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActiveInactiveBadge } from "@/components/ui/app-status-badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APIKeyResponse } from "@/lib/api/api-keys";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface APIKeyCardProps {
  apiKey: APIKeyResponse;
  onEdit: (apiKey: APIKeyResponse) => void;
  onDelete: (apiKey: APIKeyResponse) => void;
  onRefresh: (apiKey: APIKeyResponse) => void;
  onToggleStatus: (apiKey: APIKeyResponse) => void;
  onViewUsage: (apiKey: APIKeyResponse) => void;
}

const PERMISSION_COLORS: Record<string, string> = {
  read: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  write: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  update: "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20",
  delete: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

export function APIKeyCard({
  apiKey,
  onEdit,
  onDelete,
  onRefresh,
  onToggleStatus,
  onViewUsage,
}: APIKeyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key_preview);
      setCopied(true);
      toast.success("Key preview copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the key preview. Select and copy the text instead.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`p-2 rounded-lg ${apiKey.is_active ? "bg-green-500/10" : "bg-muted"}`}>
            <Key
              className={`size-4 ${apiKey.is_active ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-all font-medium">{apiKey.name}</h3>
              <ActiveInactiveBadge isActive={apiKey.is_active} className="text-xs" />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono break-all">
                {apiKey.key_preview}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={copied ? "Key preview copied" : "Copy key preview"}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="size-3 text-green-700 dark:text-green-400" />
                ) : (
                  <Copy className="size-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for API key ${apiKey.name}`}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(apiKey)}>
              <Pencil className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewUsage(apiKey)}>
              <Activity className="size-4 mr-2" />
              View Usage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRefresh(apiKey)}>
              <RefreshCw className="size-4 mr-2" />
              Regenerate Key
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleStatus(apiKey)}>
              {apiKey.is_active ? (
                <>
                  <PowerOff className="size-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="size-4 mr-2" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(apiKey)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Permissions */}
      <div className="flex flex-wrap gap-1.5">
        {apiKey.permissions.map((permission) => (
          <Badge
            key={permission}
            variant="outline"
            className={`text-xs capitalize ${PERMISSION_COLORS[permission] || ""}`}
          >
            {permission}
          </Badge>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span>Created {formatDate(apiKey.created_at)}</span>
          <span>Last used {formatDate(apiKey.last_used_at)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {apiKey.limit_usage != null ? (
            <span>
              {apiKey.usage_count} / {apiKey.limit_usage} uses
            </span>
          ) : (
            <span>{apiKey.usage_count} uses</span>
          )}
        </div>
      </div>
    </div>
  );
}

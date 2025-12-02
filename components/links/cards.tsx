"use client";

import { useState } from "react";

import {
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  BarChart3,
  Power,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import { DetailLink } from "@/lib/api/shortlinks";

export interface ShortLinkData {
  id: string;
  user_id?: string;
  short_code: string;
  original_url: string;
  title: string;
  description: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  click_count?: number;
  detail?: DetailLink;
}

interface ShortLinkCardProps {
  data: ShortLinkData;
  baseUrl?: string;
  onEdit?: (data: ShortLinkData) => void;
  onDelete?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
}

export default function ShortLinkCard({
  data,
  baseUrl = "https://lihat.in",
  onEdit,
  onDelete,
  onAnalytics,
  onToggleStatus,
}: ShortLinkCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [showPasscode, setShowPasscode] = useState<boolean>(false);

  const shortUrl = `${baseUrl}/${data.short_code}`;
  const hasPasscode = data.detail?.passcode !== undefined && data.detail?.passcode !== null && data.detail?.passcode !== 0;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = data.expires_at
    ? new Date(data.expires_at) < new Date()
    : false;
  const isExpiringSoon =
    !isExpired && data.expires_at
      ? new Date(data.expires_at) <
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : false;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg max-w-md w-full">
      {/* Status indicator line */}
      <div
        className={cn(
          "absolute top-0 left-0 h-1 w-full",
          data.is_active && !isExpired ? "bg-green-500" : "bg-gray-400",
          isExpiringSoon && "bg-yellow-500",
          isExpired && "bg-red-500"
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-lg">
              {data.title || "Untitled"}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {data.description || "No description"}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAnalytics?.(data.id)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(data)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleStatus?.(data.id, !data.is_active)}
              >
                <Power className="mr-2 h-4 w-4" />
                {data.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(data.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            variant={data.is_active && !isExpired ? "default" : "secondary"}
            className={cn(
              "text-xs",
              data.is_active &&
                !isExpired &&
                "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
              isExpired && "bg-red-500/10 text-red-600 dark:text-red-400",
              !data.is_active &&
                !isExpired &&
                "bg-gray-500/10 text-gray-600 dark:text-gray-400"
            )}
          >
            {isExpired ? "Expired" : data.is_active ? "Active" : "Inactive"}
          </Badge>
          {isExpiringSoon && !isExpired && (
            <Badge
              variant="outline"
              className="border-yellow-500 text-xs text-yellow-600 dark:text-yellow-400"
            >
              Expiring Soon
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {data.click_count ?? 0} Clicks
          </Badge>
          {hasPasscode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer flex items-center gap-1 select-none"
                    onClick={() => setShowPasscode(!showPasscode)}
                  >
                    <Lock className="h-3 w-3" />
                    {showPasscode ? data.detail?.passcode : "••••••"}
                    {showPasscode ? (
                      <EyeOff className="h-3 w-3 ml-1" />
                    ) : (
                      <Eye className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showPasscode ? "Click to hide passcode" : "Click to reveal passcode"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2"></div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Short URL */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">Short URL</p>
            <p className="truncate font-mono text-sm font-medium">{shortUrl}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Original URL */}
        <div className="flex items-center gap-2">
          <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0" />
          <a
            href={data.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground min-w-0 truncate text-sm transition-colors"
          >
            {data.original_url}
          </a>
        </div>
      </CardContent>

      <CardFooter className="text-muted-foreground border-t pt-3 text-xs">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {formatDate(data.created_at)}</span>
          </div>
          {data.expires_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires {formatDate(data.expires_at)}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Grid wrapper for multiple cards
export function ShortLinkCardGrid({
  links,
  onEdit,
  onDelete,
  onAnalytics,
  onToggleStatus,
}: {
  links: ShortLinkData[];
  onEdit?: (data: ShortLinkData) => void;
  onDelete?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <ShortLinkCard
          key={link.id}
          data={link}
          onEdit={onEdit}
          onDelete={onDelete}
          onAnalytics={onAnalytics}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}

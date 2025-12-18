"use client";

import { useState } from "react";

import {
  Copy,
  Check,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Edit,
  BarChart3,
  Power,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  MousePointerClick,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  baseUrl = "http://localhost:3000",
  onEdit,
  onDelete,
  onAnalytics,
  onToggleStatus,
}: ShortLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const shortUrl = `${baseUrl}/${data.short_code}${data.detail?.passcode ? `/${data.detail?.passcode}` : ""}`;
  const hasPasscode =
    data.detail?.passcode !== undefined &&
    data.detail?.passcode !== null &&
    data.detail?.passcode !== 0;

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

  const getStatusColor = () => {
    if (isExpired) return "bg-red-500";
    if (!data.is_active) return "bg-yellow-500";
    return "bg-[#BCE4F0]";
  };

  const getStatusText = () => {
    if (isExpired) return "Expired";
    return data.is_active ? "Active" : "Inactive";
  };

  return (
    <Card className="w-full w-max-xs shadow-none py-0 gap-0 overflow-hidden">
      {/* Status line */}
      <div className={cn("h-1 w-full", getStatusColor())} />

      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <Item className="w-full p-0 gap-2.5">
          {/* Status indicator dot */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    getStatusColor()
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{getStatusText()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ItemContent className="gap-0 min-w-0">
            <ItemTitle className="truncate text-sm font-semibold">
              {data.title || "Untitled"}
            </ItemTitle>
            <ItemDescription className="text-xs truncate">
              {data.short_code}
            </ItemDescription>
            {/* Badges row */}
          </ItemContent>
          <ItemActions className="-me-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
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
          </ItemActions>
        </Item>
      </CardHeader>

      <CardContent className="p-0">
        {/* Short URL Box */}
        <div className="bg-muted/50 border-y px-4 py-3 flex items-center gap-2">
          <code className="text-xs font-mono truncate flex-1">{shortUrl}</code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="py-3 px-4 space-y-2">
          {/* Description */}
          {data.description && data.description.length > 60 ? (
            <Dialog>
              <DialogTrigger asChild>
                <p className="text-xs font-medium text-muted-foreground line-clamp-1 cursor-pointer hover:text-foreground transition-colors">
                  {data.description}
                </p>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{data.title || "Description"}</DialogTitle>
                  <DialogDescription>Full description</DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {data.description}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-xs font-medium text-muted-foreground line-clamp-2">
              {data.description || "No description"}
            </p>
          )}

          {/* Original URL */}
          <a
            href={data.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 truncate transition-colors"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{data.original_url}</span>
          </a>
        </div>
      </CardContent>

      <CardFooter className="border-t flex flex-wrap gap-1.5 pb-4">
        <TooltipProvider>
          {/* Click count badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-[10px] h-7 px-1.5 cursor-pointer flex items-center gap-1"
                onClick={() => onAnalytics?.(data.id)}
              >
                <MousePointerClick className="h-2.5 w-2.5" />
                <span>{data.click_count ?? 0}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Total clicks - View analytics</p>
            </TooltipContent>
          </Tooltip>

          {/* Created date badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-[10px] h-7 px-1.5 flex items-center gap-1"
              >
                <Calendar className="h-2.5 w-2.5" />
                <span>{formatDate(data.created_at)}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                Created on {formatDate(data.created_at)}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Expiry date badge */}
          {data.expires_at && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={isExpired ? "destructive" : "outline"}
                  className="text-[10px] h-7 px-1.5 flex items-center gap-1"
                >
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatDate(data.expires_at)}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {isExpired
                    ? `Expired on ${formatDate(data.expires_at)}`
                    : `Expires on ${formatDate(data.expires_at)}`}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Passcode badge */}
          {hasPasscode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-[10px] h-7 px-1.5 cursor-pointer flex items-center gap-1"
                  onClick={() => setShowPasscode(!showPasscode)}
                >
                  <Lock className="h-2.5 w-2.5" />
                  {showPasscode ? data.detail?.passcode : "••••"}
                  {showPasscode ? (
                    <EyeOff className="h-2.5 w-2.5" />
                  ) : (
                    <Eye className="h-2.5 w-2.5" />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {showPasscode
                    ? "Click to hide passcode"
                    : "Click to reveal passcode"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
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
    <div className="">
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

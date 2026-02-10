"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Calendar,
  MousePointerClick,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import DeactivateLink from "./detail/deactivate";
import ActivateLink from "./detail/activate";
import { UpdatePasscodeDialog } from "./detail/update-passcode";
import { UpdateExpirationDialog } from "./detail/update-expiration";
import { useUpdateLink } from "@/lib/hooks/queries/useLinksQuery";

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
  onToggle?: (code: string) => Promise<void>;
}

export default function ShortLinkCard({
  data,
  baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL,
  onEdit,
  onDelete,
  onAnalytics,
  onToggle,
}: ShortLinkCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);

  const updateMutation = useUpdateLink();

  const shortUrl = `${baseUrl}/${data.short_code}${
    data.detail?.passcode ? `/${data.detail?.passcode}` : ""
  }`;

  const hasPasscode = !!data.detail?.passcode;

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
      year: "2-digit",
    });
  };

  const isExpired = data.expires_at
    ? new Date(data.expires_at) < new Date()
    : false;

  const getStatusColor = () => {
    if (isExpired) return "bg-red-500/80";
    if (!data.is_active) return "bg-yellow-500/80";
    return "bg-sky-500/80";
  };

  const getStatusText = () => {
    if (isExpired) return "Expired";
    return data.is_active ? "Active" : "Inactive";
  };

  const handleUpdate = async (code: string, updateData: any) => {
    return updateMutation.mutateAsync({ code, data: updateData });
  };

  const handleNavigateToDetail = () => {
    router.push(`/main/links/${data.short_code}`);
  };

  const handleNavigateToAnalytics = () => {
    router.push(`/main/analytics/${data.short_code}`);
  };

  return (
    <>
      <Card className="flex flex-col h-full w-full overflow-hidden hover:shadow-lg transition-all duration-300 min-h-[210px] relative group border-transparent ring-1 ring-border hover:ring-primary/20">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Decorative Stronger Blobs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all duration-500" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-blue-500/20 to-teal-500/20 rounded-full blur-3xl pointer-events-none group-hover:from-blue-500/30 group-hover:to-teal-500/30 transition-all duration-500" />

        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 relative z-10">
          <Item className="w-full p-0 gap-2.5">
            {/* Status indicator dot */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0 shadow-sm",
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
              <ItemTitle
                className="truncate text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                onClick={handleNavigateToDetail}
              >
                <span className="truncate">{data.title || "Untitled"}</span>
                {/* Icons in Title */}
                {hasPasscode && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Passcode Protected</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isExpired && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Link Expired</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </ItemTitle>
              <ItemDescription className="text-xs truncate">
                {data.short_code}
              </ItemDescription>
            </ItemContent>
            <ItemActions className="-me-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleNavigateToAnalytics}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNavigateToDetail}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>

                  {/* New Menu Items */}
                  <DropdownMenuItem onClick={() => setShowPasscodeDialog(true)}>
                    <Lock className="mr-2 h-4 w-4" />
                    {hasPasscode ? "Change Passcode" : "Set Passcode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowExpirationDialog(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {data.expires_at ? "Change Expiration" : "Set Expiration"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (data.is_active) {
                        setShowDeactivateDialog(true);
                      } else {
                        setShowActivateDialog(true);
                      }
                    }}
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

        <CardContent className="p-0 flex flex-col flex-1 relative z-10">
          {/* Short URL Box (Restored Grey Box) */}
          <div className="bg-muted/50 border-y px-4 py-3 flex items-center gap-2">
            <code className="text-xs font-mono truncate flex-1">
              {shortUrl}
            </code>
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
          <div className="py-3 px-4 space-y-2 flex flex-col flex-1">
            {/* Description */}
            {data.description && data.description.length > 60 ? (
              <Dialog>
                <DialogTrigger asChild>
                  <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed cursor-pointer hover:text-foreground transition-colors">
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
              <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                {data.description ? (
                  data.description
                ) : (
                  <span className="italic opacity-50">No description</span>
                )}
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

            {/* Metadata Row Pinned to Bottom */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 mt-auto">
              <div className="flex items-center gap-1.5" title="Total Clicks">
                <MousePointerClick className="h-3.5 w-3.5" />
                <span>{data.detail?.current_clicks ?? 0} clicks</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                title={`Created on ${formatDate(data.created_at)}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(data.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Dialogs */}
        {onToggle && (
          <>
            <DeactivateLink
              shortCode={data.short_code}
              onDeactivate={onToggle}
              open={showDeactivateDialog}
              onOpenChange={setShowDeactivateDialog}
            />
            <ActivateLink
              shortCode={data.short_code}
              onActivate={onToggle}
              open={showActivateDialog}
              onOpenChange={setShowActivateDialog}
            />
          </>
        )}
        <UpdatePasscodeDialog
          shortCode={data.short_code}
          currentPasscode={data.detail?.passcode?.toString()}
          open={showPasscodeDialog}
          onOpenChange={setShowPasscodeDialog}
          onUpdate={handleUpdate}
        />
        <UpdateExpirationDialog
          shortCode={data.short_code}
          currentExpiration={data.expires_at}
          open={showExpirationDialog}
          onOpenChange={setShowExpirationDialog}
          onUpdate={handleUpdate}
        />
      </Card>
    </>
  );
}

export function ShortLinkCardGrid({
  links,
  onEdit,
  onDelete,
  onAnalytics,
  onToggle,
}: {
  links: ShortLinkData[];
  onEdit?: (data: ShortLinkData) => void;
  onDelete?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onToggle?: (code: string) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {links.map((link) => (
        <ShortLinkCard
          key={link.id}
          data={link}
          onEdit={onEdit}
          onDelete={onDelete}
          onAnalytics={onAnalytics}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

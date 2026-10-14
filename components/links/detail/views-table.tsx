"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Smartphone,
  Tablet,
  MapPin,
  ExternalLink,
  Laptop,
  HelpCircle,
} from "lucide-react";

import { useShortLinkViews } from "@/lib/hooks/queries/useLinksQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ViewsTableProps {
  code: string;
}

export function ViewsTable({ code }: ViewsTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;
  // Note: we use 'views' query key in the hook, ensure it matches the one we updated
  const {
    data: viewsData,
    isLoading,
    error,
    refetch,
    isFetching,
    isPlaceholderData,
  } = useShortLinkViews(code, page, limit);

  const views = viewsData?.recent_views || [];
  const meta = viewsData;

  const handleNext = () => {
    if (meta && page < meta.total_pages) setPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  if (isLoading) {
    return <ViewsTableSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 rounded-xl border p-8 text-center"
      >
        <p className="text-sm text-muted-foreground">Failed to load traffic data.</p>
        <Button
          variant="outline"
          disabled={isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (views.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <Globe className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No Traffic Yet</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm text-center">
          Share your link to start collecting enhanced traffic insights like location, device, and
          referral data.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4" aria-busy={isFetching}>
      <p className="text-xs text-muted-foreground md:hidden">
        Scroll horizontally to see all traffic details.
      </p>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table className="min-w-[640px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[30%] pl-6">Visitor</TableHead>
              <TableHead className="w-[25%]">Device & OS</TableHead>
              <TableHead className="w-[25%]">Source / Referer</TableHead>
              <TableHead className="text-right pr-6">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view) => {
              const ua = parseUserAgent(view.user_agent);
              return (
                <TableRow key={view.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center shrink-0 text-muted-foreground">
                        <MapPin className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">
                          {view.city === "Local Machine"
                            ? "Local Development"
                            : `${view.city}, ${view.country}`}
                        </span>
                        <span
                          className="text-xs text-muted-foreground font-mono truncate max-w-[140px]"
                          title={view.ip_address}
                        >
                          {view.ip_address}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {ua.deviceIcon}
                        <span>{ua.browser}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
                        {ua.os}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="">
                    {view.referer ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={view.referer}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 group max-w-[200px]"
                            >
                              <Badge
                                variant="outline"
                                className="font-normal truncate max-w-full group-hover:border-primary/50 transition-colors"
                              >
                                <ExternalLink className="size-3 mr-1.5 opacity-50" />
                                {getDomain(view.referer)}
                              </Badge>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="max-w-xs break-all">{view.referer}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="secondary" className="font-normal opacity-70">
                        Direct / Unknown
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-medium">
                        {format(new Date(view.clicked_at), "HH:mm")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(view.clicked_at), "MMM dd")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.total_pages} ({meta.total_count} entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous traffic page"
              onClick={handlePrev}
              disabled={page <= 1 || isFetching || isPlaceholderData}
              className="size-10 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next traffic page"
              onClick={handleNext}
              disabled={page >= meta.total_pages || isFetching || isPlaceholderData}
              className="size-10 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading traffic" className="space-y-4 rounded-xl border p-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

// Helper: Extract domain
function getDomain(url: string) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return url;
  }
}

// Helper: User Agent Parser
function parseUserAgent(ua: string) {
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let deviceIcon = <HelpCircle className="size-3.5 text-muted-foreground" />;

  // Detect Browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Trident")) browser = "Internet Explorer";
  else if (ua.includes("Edge")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  // Detect OS
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac")) os = "iOS";

  // Detect Device Type (Icon)
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
    deviceIcon = <Smartphone className="size-3.5 text-purple-500" />;
  } else if (ua.includes("Tablet") || ua.includes("iPad")) {
    deviceIcon = <Tablet className="size-3.5 text-blue-500" />;
  } else {
    deviceIcon = <Laptop className="size-3.5 text-slate-500" />; // Default to laptop/desktop
  }

  // Refine OS for Mobile
  if (os === "macOS" && (ua.includes("iPhone") || ua.includes("iPad"))) {
    os = "iOS";
  }

  return { browser, os, deviceIcon };
}

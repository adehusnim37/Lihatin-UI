"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Globe, Search, Server } from "lucide-react";

import { useShortLinkLogs } from "@/lib/hooks/queries/useLogsQuery";
import { ActivityLog } from "@/lib/api/logs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HttpMethodBadge, HttpStatusCodeBadge } from "@/components/ui/app-status-badges";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogDetailContent } from "@/components/logs/LogDetailContent";

interface ActivityLogTableProps {
  code: string;
}

export function ActivityLogTable({ code }: ActivityLogTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, error, refetch, isFetching, isPlaceholderData } = useShortLinkLogs(
    code,
    page,
    limit,
  );

  const logs = data?.data?.logs || [];
  const paginationData = data?.data;

  const handleNext = () => {
    if (paginationData && page < paginationData.total_pages) setPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  if (isLoading)
    return (
      <div
        role="status"
        aria-label="Loading activity logs"
        className="space-y-4 rounded-xl border p-4"
      >
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">Failed to load activity logs.</p>
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

  if (logs.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border p-6 text-center">
        <Server className="size-6 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No Activity Yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Access logs will appear here once the link is visited.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4" aria-busy={isFetching}>
      <p className="text-xs text-muted-foreground md:hidden">
        Scroll horizontally to see all request details.
      </p>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Visitor</TableHead>
              <TableHead className="text-right">Time</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <HttpStatusCodeBadge
                    statusCode={log.status_code}
                    className="font-mono font-normal"
                  />
                </TableCell>
                <TableCell>
                  <HttpMethodBadge method={log.method} className="text-[10px] px-1.5 h-5" />
                </TableCell>
                <TableCell
                  className="font-mono text-xs text-muted-foreground max-w-[200px] truncate"
                  title={log.route}
                >
                  {log.route}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span className="font-medium flex items-center gap-1">
                      <Globe className="size-3 text-muted-foreground" />
                      {log.ip_address}
                    </span>
                    <span
                      className="text-muted-foreground truncate w-[150px]"
                      title={log.user_agent}
                    >
                      {log.browser_info || "Unknown Browser"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  <div>{format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}</div>
                  <div className="font-mono">{log.response_time}ms</div>
                </TableCell>
                <TableCell>
                  <LogDetailSheet log={log} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {paginationData && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {paginationData.page} of {paginationData.total_pages} ({paginationData.total_count}{" "}
            entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous activity page"
              onClick={handlePrev}
              disabled={page <= 1 || isFetching || isPlaceholderData}
              className="size-10 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next activity page"
              onClick={handleNext}
              disabled={page >= paginationData.total_pages || isFetching || isPlaceholderData}
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

function LogDetailSheet({ log }: { log: ActivityLog }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="View log details"
          className="size-10 hover:bg-muted"
        >
          <Search className="size-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl p-0 gap-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 pr-10">
            Activity Log Detail
            <HttpStatusCodeBadge statusCode={log.status_code} className="font-mono" />
            <HttpMethodBadge method={log.method} className="font-mono" />
          </SheetTitle>
          <SheetDescription>Recorded at {format(new Date(log.timestamp), "PPpp")}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <LogDetailContent log={log} className="px-4 sm:px-6 py-5" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

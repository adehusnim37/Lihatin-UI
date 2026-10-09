"use client";

import { format } from "date-fns";
import { History, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryError } from "@/components/query-error";
import { useLogById } from "@/lib/hooks/queries/useLogsQuery";
import { LogDetailContent } from "@/components/logs/LogDetailContent";

interface LogDetailDialogProps {
  logId: string | null;
  onClose: () => void;
}

const formatDateValue = (value: string) => {
  try {
    return format(new Date(value), "PPpp");
  } catch {
    return value;
  }
};

export function LogDetailDialog({ logId, onClose }: LogDetailDialogProps) {
  const { data: logDetail, isLoading: logDetailLoading, refetch } = useLogById(logId || "");

  return (
    <Dialog open={!!logId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] sm:w-[calc(100vw-3rem)] sm:max-w-[1040px] sm:max-h-[90dvh] p-0 gap-0 overflow-hidden flex flex-col rounded-xl [&>[data-slot=dialog-close]]:flex [&>[data-slot=dialog-close]]:size-11 [&>[data-slot=dialog-close]]:items-center [&>[data-slot=dialog-close]]:justify-center [&>[data-slot=dialog-close]]:top-2 [&>[data-slot=dialog-close]]:right-2">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0 text-left pr-14">
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-10">
            <History className="size-5" />
            Log Details
          </DialogTitle>
          <DialogDescription>
            {logDetail?.data
              ? `Recorded at ${formatDateValue(logDetail.data.timestamp)}`
              : "Complete information about this activity log"}
          </DialogDescription>
        </DialogHeader>

        {logDetailLoading ? (
          <div
            role="status"
            aria-label="Loading log details"
            className="flex flex-1 items-center justify-center p-12"
          >
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : logDetail?.data ? (
          <div className="min-h-0 overflow-y-auto">
            <LogDetailContent
              key={logDetail.data.id}
              log={logDetail.data}
              className="px-4 sm:px-6 py-4"
            />
          </div>
        ) : (
          <div className="p-4">
            <QueryError message="Could not load log details." onRetry={() => void refetch()} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

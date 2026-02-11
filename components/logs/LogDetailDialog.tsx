"use client";

import { format } from "date-fns";
import { AlertCircle, History, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { data: logDetail, isLoading: logDetailLoading } = useLogById(logId || "");

  return (
    <Dialog open={!!logId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] max-w-[96vw] h-[94vh] p-0 gap-0 overflow-hidden flex flex-col xl:w-[92vw] xl:max-w-[92vw]">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-10">
            <History className="h-5 w-5" />
            Log Details
            {logDetail?.data && (
              <>
                <Badge variant="outline" className="font-mono">
                  {logDetail.data.status_code}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  {logDetail.data.method}
                </Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {logDetail?.data
              ? `Recorded at ${formatDateValue(logDetail.data.timestamp)}`
              : "Complete information about this activity log"}
          </DialogDescription>
        </DialogHeader>

        {logDetailLoading ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logDetail?.data ? (
          <ScrollArea className="flex-1 min-h-0">
            <LogDetailContent log={logDetail.data} className="px-6 py-5" />
          </ScrollArea>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>Failed to load log details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

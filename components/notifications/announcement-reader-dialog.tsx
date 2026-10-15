"use client";

import { BellRing, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AnnouncementReaderDialog({
  open,
  onOpenChange,
  title,
  body,
  href,
  busy = false,
  onDone,
  onOpenLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  body?: string;
  href?: string;
  busy?: boolean;
  onDone: () => void;
  onOpenLink: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md">
        <DialogHeader className="text-left">
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary-ink">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="break-words pr-5 text-xl leading-snug">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="overflow-y-auto overscroll-y-contain whitespace-pre-wrap break-words text-sm leading-6">
          {body}
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onDone}>
            {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}Done
          </Button>
          {href?.trim() && (
            <Button disabled={busy} onClick={onOpenLink}>
              <ExternalLink className="size-4" />
              Open link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

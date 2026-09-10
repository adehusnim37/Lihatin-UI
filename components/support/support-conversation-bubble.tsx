"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportMessageResponse } from "@/lib/api/support";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export interface SupportConversationBubbleProps {
  message: SupportMessageResponse;
  getAttachmentUrl?: (attachmentId: string) => string;
  onDownloadAttachment?: (
    attachment: NonNullable<SupportMessageResponse["attachments"]>[number],
  ) => void;
  isAdminView?: boolean;
}

export function SupportConversationBubble({
  message,
  getAttachmentUrl,
  onDownloadAttachment,
  isAdminView = false,
}: SupportConversationBubbleProps) {
  const attachments = message.attachments ?? [];
  const [preview, setPreview] = useState<SupportAttachment | null>(null);

  const getUrl = (id: string, inline = false) => {
    const url = getAttachmentUrl?.(id) || "#";
    return inline && url !== "#"
      ? `${url}${url.includes("?") ? "&" : "?"}disposition=inline`
      : url;
  };

  const download = (attachment: SupportAttachment) => {
    if (onDownloadAttachment) return onDownloadAttachment(attachment);
    const link = document.createElement("a");
    link.href = getUrl(attachment.id);
    link.download = attachment.file_name;
    link.click();
  };

  const mine = isAdminView 
    ? message.sender_type === "admin"
    : message.sender_type === "public" || message.sender_type === "user";

  const senderLabel = mine 
    ? "You" 
    : isAdminView 
      ? (message.sender_type === "system" ? "System" : "User")
      : (message.sender_type === "admin" ? "Support Team" : "System");

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-xl border px-3.5 py-3 text-sm sm:max-w-[76%]",
          mine
            ? "border-primary/15 bg-primary/10 text-foreground"
            : "bg-background text-card-foreground",
        )}
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <p className="font-medium text-foreground">{senderLabel}</p>
          <p className="text-muted-foreground">{formatDate(message.created_at)}</p>
        </div>

        {message.body ? (
          <p className="whitespace-pre-wrap break-words leading-6 text-foreground/90">
            {message.body}
          </p>
        ) : null}

        {attachments.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((attachment) =>
              isPreviewable(attachment) && getAttachmentUrl ? (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => setPreview(attachment)}
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60"
                >
                  {attachment.file_name} ({formatBytes(attachment.size_bytes)})
                </button>
              ) : (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => download(attachment)}
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60"
                >
                  {attachment.file_name} ({formatBytes(attachment.size_bytes)})
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="flex h-[90dvh] max-w-5xl flex-col">
          <DialogHeader className="pr-8">
            <DialogTitle className="truncate">{preview?.file_name}</DialogTitle>
            <DialogDescription>
              Preview attachment{preview ? ` · ${formatBytes(preview.size_bytes)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/30">
            {preview && isPdf(preview) ? (
              <iframe
                src={getUrl(preview.id, true)}
                title={preview.file_name}
                className="h-full w-full"
              />
            ) : preview ? (
              // The source is an authenticated API URL rather than a Next.js image asset.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getUrl(preview.id, true)}
                alt={preview.file_name}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
          <Button type="button" onClick={() => preview && download(preview)} className="self-end">
            <Download className="size-4" />
            Download
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type SupportAttachment = NonNullable<SupportMessageResponse["attachments"]>[number];

function isPdf(attachment: SupportAttachment) {
  return attachment.content_type === "application/pdf" || /\.pdf$/i.test(attachment.file_name);
}

function isPreviewable(attachment: SupportAttachment) {
  return isPdf(attachment) ||
    attachment.content_type === "image/jpeg" ||
    /\.jpe?g$/i.test(attachment.file_name);
}

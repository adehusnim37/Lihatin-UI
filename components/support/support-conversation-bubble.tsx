import { cn } from "@/lib/utils";
import type { SupportMessageResponse } from "@/lib/api/support";

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
  getAttachmentUrl: (attachmentId: string) => string;
  isAdminView?: boolean;
}

export function SupportConversationBubble({
  message,
  getAttachmentUrl,
  isAdminView = false,
}: SupportConversationBubbleProps) {
  const attachments = message.attachments ?? [];

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
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={getAttachmentUrl(attachment.id)}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60"
              >
                {attachment.file_name} ({formatBytes(attachment.size_bytes)})
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

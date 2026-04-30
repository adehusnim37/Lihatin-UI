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

  const badgeLabel = message.sender_type === "admin" 
    ? "Support" 
    : message.sender_type === "system" 
      ? "System" 
      : "User";

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl border px-4 py-3 text-sm shadow-sm sm:max-w-[80%]",
          mine
            ? "border-primary/15 bg-primary/5 text-foreground"
            : "bg-card text-card-foreground",
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="font-medium">{senderLabel}</p>
            <p className="text-xs text-muted-foreground">{formatDate(message.created_at)}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              message.sender_type === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {badgeLabel}
          </span>
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
                className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-muted/60"
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

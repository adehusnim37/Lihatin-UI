import { BellRing, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InAppAnnouncementPreviewProps {
  title?: string;
  body?: string;
  href?: string;
  className?: string;
}

/** A non-interactive preview of the same content shown in the reader dialog. */
export function InAppAnnouncementPreview({
  title,
  body,
  href,
  className,
}: InAppAnnouncementPreviewProps) {
  return (
    <div className={cn("mx-auto w-full max-w-md rounded-xl border bg-background p-5", className)}>
      <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary-ink">
        <BellRing className="size-5" aria-hidden="true" />
      </span>
      <h3
        className={cn(
          "break-words text-lg font-semibold leading-snug",
          !title?.trim() && "text-muted-foreground",
        )}
      >
        {title?.trim() || "Your announcement title"}
      </h3>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
        {body?.trim() || "Write a short message to see how it will appear to your users."}
      </p>
      <div aria-hidden="true" className="mt-6 flex flex-wrap justify-end gap-2">
        <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium">
          Done
        </span>
        {href?.trim() && (
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
            <ExternalLink className="size-4" />
            Open link
          </span>
        )}
      </div>
      {href?.trim() && (
        <p className="mt-4 break-all border-t pt-3 text-xs leading-5 text-muted-foreground">
          {href}
        </p>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { BellRing, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInAppAnnouncements } from "@/lib/hooks/queries/useInAppAnnouncementsQuery";

export function InAppAnnouncementDialog({ blocked = false }: { blocked?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const { query, markRead } = useInAppAnnouncements(user?.id);
  const announcement = query.data?.data?.[0];

  const acknowledge = async (openDocs: boolean) => {
    if (!announcement || markRead.isPending) return;
    try {
      await markRead.mutateAsync(announcement.id);
      if (openDocs) router.push(announcement.href);
    } catch {
      toast.error("Could not save this notification. Please try again.");
    }
  };

  return (
    <Dialog
      open={Boolean(announcement) && !blocked}
      onOpenChange={(open) => {
        if (!open) void acknowledge(false);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
            Product update
          </p>
          <DialogTitle>{announcement?.title}</DialogTitle>
          <DialogDescription className="pt-2 leading-6">{announcement?.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={markRead.isPending}
            onClick={() => void acknowledge(false)}
          >
            {markRead.isPending && <Loader2 className="size-4 animate-spin" />}
            Got it
          </Button>
          <Button disabled={markRead.isPending} onClick={() => void acknowledge(true)}>
            <BookOpen className="size-4" />
            View API docs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { AnnouncementReaderDialog } from "@/components/notifications/announcement-reader-dialog";
import {
  dismissAnnouncement,
  presentAnnouncement,
  useAnnouncementSession,
} from "@/lib/hooks/useAnnouncementSessionGuard";
import { useInAppAnnouncements } from "@/lib/hooks/queries/useInAppAnnouncementsQuery";

/**
 * Presents undismissed announcements one at a time on the dashboard.
 *
 * An announcement is only auto-presented once per browser session: the
 * presentation state lives in `sessionStorage` via `useAnnouncementSession`, so
 * client-side navigation cannot re-open it. The header inbox always keeps the
 * full list, so nothing becomes unreachable after dismissal.
 */
export function InAppAnnouncementDialog({ blocked = false }: { blocked?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const { query, markRead } = useInAppAnnouncements(user?.id);
  const { shown, active, hydrated } = useAnnouncementSession();

  // Stable identity so the queueing effect does not re-run on every render.
  const pending = useMemo(() => query.data?.data ?? [], [query.data]);

  // Queue the next announcement that has not been presented in this session.
  // Only runs when nothing is on screen, so dismissing one advances the queue
  // instead of stacking dialogs. This updates an external store, not React
  // state, which is why it is safe inside an effect.
  useEffect(() => {
    if (!hydrated || blocked || active !== null) return;
    const next = pending.find((item) => !shown.includes(item.id));
    if (next) {
      presentAnnouncement(next.id);
    }
  }, [hydrated, blocked, active, pending, shown]);

  const announcement = active ? pending.find((item) => item.id === active) : undefined;

  const acknowledge = async () => {
    if (!announcement || markRead.isPending) return;
    dismissAnnouncement();
    try {
      await markRead.mutateAsync(announcement.id);
    } catch {
      toast.error("Could not save this notification. Please try again.");
    }
  };

  const openLink = () => {
    if (!announcement?.href) return;
    if (/^https?:\/\//i.test(announcement.href))
      window.open(announcement.href, "_blank", "noopener,noreferrer");
    else router.push(announcement.href);
    void acknowledge();
  };

  return (
    <AnnouncementReaderDialog
      open={Boolean(announcement) && !blocked}
      onOpenChange={(next) => {
        if (!next) void acknowledge();
      }}
      title={announcement?.title}
      body={announcement?.body}
      href={announcement?.href}
      busy={markRead.isPending}
      onDone={() => void acknowledge()}
      onOpenLink={openLink}
    />
  );
}

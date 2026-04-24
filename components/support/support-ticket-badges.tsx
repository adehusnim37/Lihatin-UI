import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CircleDotIcon,
  Clock3Icon,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import type { SupportPriority, SupportTicketStatus } from "@/lib/api/support";

const statusMap: Record<
  SupportTicketStatus,
  { label: string; tone: StatusBadgeTone }
> = {
  open: {
    label: "Open",
    tone: "warning",
  },
  in_progress: {
    label: "In Progress",
    tone: "info",
  },
  resolved: {
    label: "Resolved",
    tone: "success",
  },
  closed: {
    label: "Closed",
    tone: "neutral",
  },
};

const priorityMap: Record<
  SupportPriority,
  { label: string; tone: StatusBadgeTone }
> = {
  low: {
    label: "Low",
    tone: "neutral",
  },
  normal: {
    label: "Normal",
    tone: "info",
  },
  high: {
    label: "High",
    tone: "warning",
  },
  urgent: {
    label: "Urgent",
    tone: "danger",
  },
};

export function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  const item = statusMap[status];

  return (
    <StatusBadge tone={item.tone}>
      {item.label}
    </StatusBadge>
  );
}

export function SupportPriorityBadge({ priority }: { priority: SupportPriority }) {
  const item = priorityMap[priority];

  return (
    <StatusBadge tone={item.tone}>
      {item.label}
    </StatusBadge>
  );
}

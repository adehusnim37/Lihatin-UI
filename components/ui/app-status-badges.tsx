import {
  AlertTriangleIcon,
  BanIcon,
  CheckCircleIcon,
  Clock3Icon,
  CrownIcon,
  MinusCircleIcon,
  ShieldAlertIcon,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | string;

function resolveHttpStatusTone(statusCode?: number): StatusBadgeTone {
  if (!statusCode) return "warning";
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "info";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  return "danger";
}

function resolveHttpMethodMeta(method: HttpMethod): {
  tone: StatusBadgeTone;
} {
  const normalized = method.toUpperCase();

  if (normalized === "POST") {
    return { tone: "success" };
  }
  if (normalized === "PUT" || normalized === "PATCH") {
    return { tone: "warning" };
  }
  if (normalized === "DELETE") {
    return { tone: "danger" };
  }
  return { tone: "info" };
}

export function ActiveInactiveBadge({
  isActive,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className,
}: {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}) {
  return (
    <StatusBadge
      tone={isActive ? "success" : "danger"}
      className={className}
    >
      {isActive ? activeLabel.toLocaleUpperCase() : inactiveLabel.toLocaleUpperCase()}
    </StatusBadge>
  );
}

export function EnabledDisabledBadge({
  enabled,
  enabledLabel = "Enabled",
  disabledLabel = "Disabled",
  className,
}: {
  enabled: boolean;
  enabledLabel?: string;
  disabledLabel?: string;
  className?: string;
}) {
  return (
    <StatusBadge
      tone={enabled ? "success" : "neutral"}
      className={className}
    >
      {enabled ? enabledLabel : disabledLabel}
    </StatusBadge>
  );
}

export function EnvironmentEffectiveBadge({
  effective,
  className,
}: {
  effective: boolean;
  className?: string;
}) {
  return (
    <StatusBadge
      tone={effective ? "success" : "warning"}
      className={className}
    >
      {effective ? "Effective in current environment" : "Not effective in current environment"}
    </StatusBadge>
  );
}

export function HttpStatusCodeBadge({
  statusCode,
  className,
}: {
  statusCode?: number;
  className?: string;
}) {
  return (
    <StatusBadge
      tone={resolveHttpStatusTone(statusCode)}
      className={className}
    >
      {statusCode ?? "N/A"}
    </StatusBadge>
  );
}

export function HttpMethodBadge({
  method,
  className,
  withIcon = false,
}: {
  method?: HttpMethod;
  className?: string;
  withIcon?: boolean;
}) {
  const safeMethod = (method || "GET").toUpperCase();
  const meta = resolveHttpMethodMeta(safeMethod);

  return (
    <StatusBadge
      tone={meta.tone}
      withIcon={withIcon}
      className={className}
    >
      {safeMethod}
    </StatusBadge>
  );
}

export function PremiumStateBadge({
  isPremium,
  isRevoked,
  className,
}: {
  isPremium: boolean;
  isRevoked?: boolean;
  className?: string;
}) {
  if (isRevoked) {
    return (
      <StatusBadge tone="danger" className={className}>
        REVOKED
      </StatusBadge>
    );
  }

  if (isPremium) {
    return (
      <StatusBadge tone="success" className={className}>
        PREMIUM
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone="sky" className={className}>
      FREE
    </StatusBadge>
  );
}

export function PremiumEventActionBadge({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  const normalized = (action || "").toLowerCase();
  if (normalized === "revoke") {
    return (
      <StatusBadge tone="danger" className={className}>
        REVOKED
      </StatusBadge>
    );
  }
  if (normalized === "reactivate") {
    return (
      <StatusBadge tone="success" className={className}>
        REACTIVATE
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone="neutral" className={className}>
      {action || "Unknown"}
    </StatusBadge>
  );
}

export function RevokeTypeBadge({
  revokeType,
  className,
}: {
  revokeType?: string | null;
  className?: string;
}) {
  if (!revokeType) return null;

  if (revokeType === "permanent") {
    return (
      <StatusBadge tone="danger" className={className}>
        {revokeType}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone="warning" className={className}>
      {revokeType}
    </StatusBadge>
  );
}

export function LoginAttemptBadge({
  success,
  className,
}: {
  success: boolean;
  className?: string;
}) {
  return (
    <StatusBadge
      tone={success ? "success" : "danger"}
      className={className}
    >
      {success ? "Success" : "Failed"}
    </StatusBadge>
  );
}

export function RoleBadge({
  role,
  className,
}: {
  role?: string | null;
  className?: string;
}) {
  const normalized = (role || "user").toLowerCase();
  
  if (normalized === "super_admin") {
    return (
      <StatusBadge tone="danger" className={className}>
        SUPER ADMIN
      </StatusBadge>
    );
  }
  
  if (normalized === "admin") {
    return (
      <StatusBadge tone="warning" className={className}>
        ADMIN
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone="info" className={className}>
      USER
    </StatusBadge>
  );
}

export function SkyBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Badge className={cn("bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300", className)}>
      {children}
    </Badge>
  );
}

export function PurpleBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Badge className={cn("bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300", className)}>
      {children}
    </Badge>
  );
}

export function AccountHistoryActionBadge({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  const normalized = (action || "").toLowerCase();
  if (normalized === "account_unlock") {
    return (
      <StatusBadge tone="success" className={className}>
        UNLOCKED
      </StatusBadge>
    );
  }
  if (normalized === "account_lock") {
    return (
      <StatusBadge tone="danger" className={className}>
        LOCKED
      </StatusBadge>
    );
  }
  if (normalized.includes("unlock")) {
    return (
      <StatusBadge tone="success" className={className}>
        {action.toUpperCase()}
      </StatusBadge>
    );
  }
  if (normalized.includes("lock")) {
    return (
      <StatusBadge tone="danger" className={className}>
        {action.toUpperCase()}
      </StatusBadge>
    );
  }
  if (normalized.includes("verification") || normalized.includes("change")) {
    return (
      <StatusBadge tone="warning" className={className}>
        {action.toUpperCase()}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="neutral" className={className}>
      {action.toUpperCase()}
    </StatusBadge>
  );
}

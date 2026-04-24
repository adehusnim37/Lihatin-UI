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
      tone={isActive ? "success" : "neutral"}
      className={className}
    >
      {isActive ? activeLabel : inactiveLabel}
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
    <StatusBadge tone="neutral" className={className}>
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
        Revoke
      </StatusBadge>
    );
  }
  if (normalized === "reactivate") {
    return (
      <StatusBadge tone="success" className={className}>
        Reactivate
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

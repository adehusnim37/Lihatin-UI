"use client";

import { format } from "date-fns";
import {
  Clock3,
  Globe,
  Info,
  LaptopMinimal,
  Monitor,
  Network,
  Radar,
  Server,
  Terminal,
} from "lucide-react";

import { ActivityLog } from "@/lib/api/logs";
import { cn } from "@/lib/utils";

interface LogDetailContentProps {
  log: ActivityLog;
  className?: string;
}

const parseJson = (value: unknown) => {
  try {
    if (!value) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
      return JSON.parse(trimmed);
    }
    return value;
  } catch {
    return value;
  }
};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value.trim() ? value : "-";
  return String(value);
};

const hasContent = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

const formatDateValue = (value: string) => {
  try {
    return format(new Date(value), "PPpp");
  } catch {
    return value;
  }
};

export function LogDetailContent({ log, className }: LogDetailContentProps) {
  const headers = parseJson(log.request_headers);
  const routeParams = parseJson(log.route_params);
  const queryParams = parseJson(log.query_params);
  const requestBody = parseJson(log.request_body);
  const responseBody = parseJson(log.response_body);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Request"
          subtitle="Inbound request context"
          icon={<Monitor className="h-4 w-4" />}
        >
          <Field label="Route" value={displayValue(log.route)} mono />
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              icon={<Terminal className="h-3.5 w-3.5" />}
              label="Method"
              value={displayValue(log.method)}
            />
            <MiniStat
              icon={<Clock3 className="h-3.5 w-3.5" />}
              label="Timestamp"
              value={formatDateValue(log.timestamp)}
            />
          </div>

          {hasContent(routeParams) && (
            <ExpandableJson
              title="Route Params"
              icon={<Terminal className="h-3.5 w-3.5" />}
              data={routeParams}
            />
          )}
          {hasContent(queryParams) && (
            <ExpandableJson
              title="Query Params"
              icon={<Info className="h-3.5 w-3.5" />}
              data={queryParams}
            />
          )}
          {hasContent(requestBody) && (
            <ExpandableJson
              title="Request Body"
              icon={<Server className="h-3.5 w-3.5" />}
              data={requestBody}
            />
          )}
          {hasContent(headers) && (
            <ExpandableJson
              title="Request Headers"
              icon={<Info className="h-3.5 w-3.5" />}
              data={headers}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Client"
          subtitle="Visitor and device details"
          icon={<Globe className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              icon={<Network className="h-3.5 w-3.5" />}
              label="IP Address"
              value={displayValue(log.ip_address)}
            />
            <MiniStat
              icon={<LaptopMinimal className="h-3.5 w-3.5" />}
              label="Browser"
              value={displayValue(log.browser_info)}
            />
          </div>
          <Field label="User Agent" value={displayValue(log.user_agent)} mono />
          <Field label="Username" value={displayValue(log.username)} />
        </SectionCard>

        <SectionCard
          title="Response"
          subtitle="Server response metadata"
          icon={<Server className="h-4 w-4" />}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MiniStat
              icon={<Radar className="h-3.5 w-3.5" />}
              label="Status"
              value={displayValue(log.status_code)}
            />
            <MiniStat
              icon={<Clock3 className="h-3.5 w-3.5" />}
              label="Response Time"
              value={
                log.response_time === null || log.response_time === undefined
                  ? "-"
                  : `${log.response_time} ms`
              }
            />
            <MiniStat
              icon={<Info className="h-3.5 w-3.5" />}
              label="Level"
              value={displayValue(log.level)}
            />
          </div>
          <Field label="Message" value={displayValue(log.message)} />
          <Field label="Action" value={displayValue(log.action)} />
          <Field label="Log ID" value={displayValue(log.id)} mono />
          {hasContent(responseBody) && (
            <ExpandableJson
              title="Response Body"
              icon={<Server className="h-3.5 w-3.5" />}
              data={responseBody}
              defaultOpen
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

const SectionCard = ({
  title,
  subtitle,
  icon,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={`rounded-xl border bg-card p-4 shadow-sm space-y-3 ${className}`}>
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const Field = ({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) => (
  <div className="space-y-1">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div
      className={`rounded-md border bg-muted/30 px-3 py-2 text-sm text-foreground whitespace-pre-wrap break-all ${
        mono ? "font-mono text-xs" : ""
      } ${className}`}
    >
      {value}
    </div>
  </div>
);

const MiniStat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-md border bg-muted/20 p-2">
    <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-xs font-medium break-all">{value}</div>
  </div>
);

const ExpandableJson = ({
  title,
  icon,
  data,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  data: unknown;
  defaultOpen?: boolean;
}) => (
  <details className="rounded-md border bg-muted/20 p-2.5" open={defaultOpen}>
    <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-foreground">
      {icon}
      {title}
    </summary>
    <div className="mt-2">
      <JsonBlock data={data} />
    </div>
  </details>
);

const JsonBlock = ({ data }: { data: unknown }) => (
  <div className="relative rounded-md bg-muted/30 p-3 font-mono text-[11px] text-foreground overflow-auto max-h-[320px] border">
    <pre>{typeof data === "string" ? data : JSON.stringify(data, null, 2)}</pre>
  </div>
);

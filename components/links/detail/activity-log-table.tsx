"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe,
  LaptopMinimal,
  Info,
  Monitor,
  Network,
  Radar,
  Search,
  Server,
  Terminal,
} from "lucide-react";

import { useShortLinkLogs } from "@/lib/hooks/queries/useLogsQuery";
import { ActivityLog } from "@/lib/api/logs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityLogTableProps {
  code: string;
}

export function ActivityLogTable({ code }: ActivityLogTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, error } = useShortLinkLogs(code, page, limit);

  const logs = data?.data?.logs || [];
  const paginationData = data?.data;

  const handleNext = () => {
    if (paginationData && page < paginationData.total_pages) setPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
    if (status >= 300 && status < 400)
      return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200";
    if (status >= 400 && status < 500)
      return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200";
    return "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200";
  };

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "secondary";
      case "POST":
        return "default";
      case "PUT":
        return "outline";
      case "DELETE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading activity logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">Failed to load logs.</div>
    );
  }

  if (logs.length === 0) {
    // Empty state
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/10 border-2 border-dashed rounded-lg">
        <Server className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">No Activity Yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Access logs will appear here once the link is visited.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Visitor</TableHead>
              <TableHead className="text-right">Time</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`font-mono font-normal ${getStatusColor(
                      log.status_code
                    )}`}
                  >
                    {log.status_code}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getMethodColor(log.method)}
                    className="text-[10px] px-1.5 h-5"
                  >
                    {log.method}
                  </Badge>
                </TableCell>
                <TableCell
                  className="font-mono text-xs text-muted-foreground max-w-[200px] truncate"
                  title={log.route}
                >
                  {log.route}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span className="font-medium flex items-center gap-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {log.ip_address}
                    </span>
                    <span
                      className="text-muted-foreground/70 truncate w-[150px]"
                      title={log.user_agent}
                    >
                      {log.browser_info || "Unknown Browser"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  <div>
                    {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                  </div>
                  <div className="font-mono">{log.response_time}ms</div>
                </TableCell>
                <TableCell>
                  <LogDetailSheet log={log} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {paginationData && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Page {paginationData.page} of {paginationData.total_pages} ({paginationData.total_count}{" "}
            entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page === paginationData.total_pages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Detail Sheet Subcomponent ---

function LogDetailSheet({ log }: { log: ActivityLog }) {
  // Helper to parse JSON fields safely
  const parseJson = (value: unknown) => {
    try {
      if (!value) return null;
      if (typeof value === "string") return JSON.parse(value);
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

  const headers = parseJson(log.request_headers);
  const responseBody = parseJson(log.response_body);
  const routeParams = parseJson(log.route_params);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <Search className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl p-0 gap-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 pr-10">
            Activity Log Detail
            <Badge variant="outline" className="font-mono">
              {log.status_code}
            </Badge>
            <Badge variant="secondary" className="font-mono">
              {log.method}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Recorded at {format(new Date(log.timestamp), "PPpp")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-6 py-5">
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
                    value={format(new Date(log.timestamp), "PPpp")}
                  />
                </div>
                {routeParams && (
                  <ExpandableJson
                    title="Route Params"
                    icon={<Terminal className="h-3.5 w-3.5" />}
                    data={routeParams}
                  />
                )}
                {headers && (
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
                    value={`${displayValue(log.response_time)} ms`}
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
                {responseBody && (
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
  <details
    className="rounded-md border bg-muted/20 p-2.5"
    open={defaultOpen}
  >
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
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

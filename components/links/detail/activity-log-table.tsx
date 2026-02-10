"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Info,
  Monitor,
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const parseJson = (str: string) => {
    try {
      if (!str) return null;
      return JSON.parse(str);
    } catch {
      return str;
    }
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
      <SheetContent className="w-[400px] sm:w-[540px] overflow-hidden flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            Log Details
            <Badge variant="outline" className="ml-2 font-mono">
              {log.id.slice(0, 8)}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Recorded at {format(new Date(log.timestamp), "PPpp")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-8">
            {/* Request Info */}
            <Section
              title="Request Info"
              icon={<Monitor className="h-4 w-4" />}
            >
              <Field label="Method" value={log.method} />
              <Field label="Route" value={log.route} />
              <Field label="IP Address" value={log.ip_address} />
              <Field
                label="User Agent"
                value={log.user_agent}
                className="break-all font-mono text-[10px]"
              />
            </Section>

            {/* Response Info */}
            <Section title="Response" icon={<Server className="h-4 w-4" />}>
              <div className="flex items-center justify-between mb-2">
                <Field label="Status Code" value={log.status_code.toString()} />
                <Field label="Latency" value={`${log.response_time}ms`} />
              </div>
              {responseBody && (
                <div className="mt-2">
                  <Label>Response Body</Label>
                  <JsonBlock data={responseBody} />
                </div>
              )}
            </Section>

            {/* Headers */}
            {headers && (
              <Section title="Headers" icon={<Info className="h-4 w-4" />}>
                <JsonBlock data={headers} />
              </Section>
            )}

            {/* Route Params */}
            {routeParams && (
              <Section
                title="Route Params"
                icon={<Terminal className="h-4 w-4" />}
              >
                <JsonBlock data={routeParams} />
              </Section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90 pb-1 border-b">
      {icon}
      {title}
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const Field = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className="grid grid-cols-3 gap-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`col-span-2 font-medium ${className}`}>{value}</span>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs font-medium text-muted-foreground mb-1.5">
    {children}
  </div>
);

const JsonBlock = ({ data }: { data: any }) => (
  <div className="relative rounded-md bg-muted/50 p-3 font-mono text-[10px] text-muted-foreground overflow-auto max-h-[200px] border">
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

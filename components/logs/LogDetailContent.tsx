"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ChevronDown, Copy, FileJson, WrapText } from "lucide-react";
import { toast } from "sonner";
import type { ActivityLog } from "@/lib/api/logs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HttpMethodBadge, HttpStatusCodeBadge } from "@/components/ui/app-status-badges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LogDetailContentProps {
  log: ActivityLog;
  className?: string;
}

function parsePayload(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function valueText(value: unknown) {
  return value === null || value === undefined || value === "" ? "Not recorded" : String(value);
}

function recordedAt(value: string) {
  try {
    return format(new Date(value), "MMM d, yyyy · HH:mm:ss");
  } catch {
    return value;
  }
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}. Select and copy the text instead.`);
  }
}

export function LogDetailContent({ log, className }: LogDetailContentProps) {
  const [metadataOpen, setMetadataOpen] = useState(false);
  const metadataId = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <div className="space-y-3 border-b pb-5 sm:pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <HttpMethodBadge method={log.method} className="font-mono" />
          <HttpStatusCodeBadge statusCode={log.status_code} className="font-mono" />
          <span className="text-sm tabular-nums text-muted-foreground">
            {log.response_time == null ? "Duration not recorded" : `${log.response_time} ms`}
          </span>
          <span className="text-sm text-muted-foreground">{valueText(log.level)}</span>
          {log.route && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              aria-label="Copy request route"
              onClick={() => void copyText(log.route, "Route")}
            >
              <Copy className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 font-mono text-base font-semibold leading-relaxed [overflow-wrap:anywhere] sm:text-xl">
            {valueText(log.route)}
          </p>
        </div>
        <p className="max-w-[80ch] text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
          {valueText(log.message)}
        </p>
      </div>

      <div className="grid min-w-0 gap-6 pt-5 sm:pt-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0">
          <Button
            variant="outline"
            className="w-full justify-between lg:hidden"
            aria-expanded={metadataOpen}
            aria-controls={metadataId}
            onClick={() => setMetadataOpen(!metadataOpen)}
          >
            Event & client details
            <ChevronDown
              className={cn("size-4 transition-transform", metadataOpen && "rotate-180")}
            />
          </Button>
          <aside
            id={metadataId}
            className={cn(
              "min-w-0 space-y-6 lg:block",
              metadataOpen ? "mt-5 block lg:mt-0" : "hidden",
            )}
          >
            <section aria-label="Event metadata">
              <h3 className="mb-3 text-sm font-semibold">Event</h3>
              <dl className="space-y-3 text-sm">
                <Metadata label="Recorded">{recordedAt(log.timestamp)}</Metadata>
                <Metadata label="Action">{valueText(log.action)}</Metadata>
              </dl>
            </section>
            <section aria-label="Client metadata" className="border-t pt-5">
              <h3 className="mb-3 text-sm font-semibold">Client</h3>
              <dl className="space-y-3 text-sm">
                <Metadata label="Username">{valueText(log.username)}</Metadata>
                <Metadata label="IP address" mono>
                  {valueText(log.ip_address)}
                </Metadata>
                <Metadata label="Browser">{valueText(log.browser_info)}</Metadata>
              </dl>
              <details className="group mt-4">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  User agent
                  <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-1 font-mono text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                  {valueText(log.user_agent)}
                </p>
              </details>
            </section>
            <section className="border-t pt-5" aria-label="Log identifier">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Log ID</h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy log ID"
                  onClick={() => void copyText(log.id, "Log ID")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="font-mono text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                {valueText(log.id)}
              </p>
            </section>
          </aside>
        </div>

        <Tabs defaultValue="response" className="min-w-0 gap-4">
          <TabsList aria-label="Log payload" className="grid h-auto w-full grid-cols-4">
            <TabsTrigger
              value="response"
              className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
            >
              Response
            </TabsTrigger>
            <TabsTrigger
              value="request"
              className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
            >
              Request
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
            >
              Headers
            </TabsTrigger>
            <TabsTrigger
              value="params"
              className="min-w-0 whitespace-normal px-1 text-xs sm:text-sm"
            >
              Params
            </TabsTrigger>
          </TabsList>
          <TabsContent value="response" className="min-w-0">
            <PayloadViewer
              title="Response body"
              value={log.response_body}
              emptyText="No response body was recorded for this request."
            />
          </TabsContent>
          <TabsContent value="request" className="min-w-0">
            <PayloadViewer
              title="Request body"
              value={log.request_body}
              emptyText="No request body was recorded. Requests such as GET often have no body."
            />
          </TabsContent>
          <TabsContent value="headers" className="min-w-0">
            <PayloadViewer
              title="Request headers"
              value={log.request_headers}
              emptyText="No request headers were recorded."
            />
          </TabsContent>
          <TabsContent value="params" className="min-w-0 space-y-5">
            <PayloadViewer
              title="Route parameters"
              value={log.route_params}
              emptyText="No route parameters were recorded."
            />
            <PayloadViewer
              title="Query parameters"
              value={log.query_params}
              emptyText="No query parameters were recorded."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Metadata({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 leading-5 [overflow-wrap:anywhere]", mono && "font-mono text-xs")}>
        {children}
      </dd>
    </div>
  );
}

function PayloadViewer({
  title,
  value,
  emptyText,
}: {
  title: string;
  value: unknown;
  emptyText: string;
}) {
  const [wrap, setWrap] = useState(true);
  const payload = useMemo(() => parsePayload(value), [value]);
  const empty = payload === null || payload === undefined;
  const serialized = useMemo(
    () => (empty ? "" : typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)),
    [payload, empty],
  );
  const isJson = typeof payload !== "string";
  const lines = serialized.split("\n").length;
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {!empty && (
            <p className="mt-1 text-xs text-muted-foreground">
              {isJson ? "JSON" : "Text"} · {lines} {lines === 1 ? "line" : "lines"}
            </p>
          )}
        </div>
        {!empty && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={wrap}
              aria-label={`Wrap lines in ${title.toLowerCase()}`}
              onClick={() => setWrap(!wrap)}
            >
              <WrapText className="size-4" />
              <span className="hidden sm:inline">Wrap</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label={`Copy ${title.toLowerCase()}`}
              onClick={() => void copyText(serialized, title)}
            >
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
        )}
      </div>
      {empty ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
          <FileJson className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div
          role="region"
          aria-label={`${title}, code viewer`}
          tabIndex={0}
          className="max-h-[min(56dvh,640px)] min-h-40 overflow-auto bg-muted/10 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <pre
            className={cn(
              "p-4 font-mono text-[13px] leading-6 tabular-nums sm:p-5",
              wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre",
            )}
          >
            <code>{isJson ? <JsonText text={serialized} /> : serialized}</code>
          </pre>
        </div>
      )}
    </section>
  );
}

function JsonText({ text }: { text: string }) {
  const tokens = text.split(
    /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g,
  );
  return tokens.map((token, index) => {
    if (!token) return null;
    const next = tokens[index + 1] ?? "";
    const color = token.startsWith('"')
      ? /^\s*:/.test(next)
        ? "text-primary-ink"
        : "text-emerald-800 dark:text-emerald-300"
      : /^(true|false|null)$/.test(token)
        ? "text-violet-800 dark:text-violet-300"
        : /^-?\d/.test(token)
          ? "text-amber-800 dark:text-amber-300"
          : "text-foreground";
    return (
      <span key={index} className={color}>
        {token}
      </span>
    );
  });
}

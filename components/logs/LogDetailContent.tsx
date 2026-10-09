"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  return (
    <div className={cn("min-w-0", className)}>
      <section aria-label="Request summary" className="space-y-4">
        <div className="relative">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-h-11 flex-wrap items-center gap-2 pr-14">
              <HttpMethodBadge method={log.method} className="font-mono" />
              <HttpStatusCodeBadge statusCode={log.status_code} className="font-mono" />
              <span className="text-xs font-medium text-muted-foreground">
                {valueText(log.level).toLowerCase()}
              </span>
            </div>
            <p className="font-mono text-base font-semibold leading-6 [overflow-wrap:anywhere] sm:text-lg">
              {valueText(log.route)}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-0"
            aria-label="Copy request route"
            disabled={!log.route}
            onClick={() => void copyText(log.route, "Route")}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-y py-3 sm:grid-cols-4">
          <Summary label="Response time" mono>
            {log.response_time == null ? "Not recorded" : `${log.response_time} ms`}
          </Summary>
          <Summary label="Action">{valueText(log.action)}</Summary>
          <Summary label="User">{valueText(log.username)}</Summary>
          <Summary label="IP address" mono>
            {valueText(log.ip_address)}
          </Summary>
        </dl>
      </section>
      <Tabs defaultValue="response" className="mt-4 min-w-0 gap-4">
        <TabsList
          aria-label="Log information"
          className="grid h-auto w-full grid-cols-5 rounded-none border-b bg-transparent p-0"
        >
          {[
            ["response", "Response"],
            ["request", "Request"],
            ["headers", "Headers"],
            ["params", "Params"],
            ["details", "Details"],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="min-h-11 min-w-0 rounded-none border-0 border-b-2 border-transparent px-1 text-xs shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary-ink data-[state=active]:shadow-none sm:text-sm"
            >
              {label}
            </TabsTrigger>
          ))}
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
        <TabsContent value="params" className="min-w-0 space-y-4">
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
        <TabsContent value="details" className="min-w-0 space-y-5 py-1">
          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-label="Event metadata">
              <h3 className="mb-4 text-sm font-semibold">Event</h3>
              <dl className="space-y-4 text-sm">
                <Metadata label="Recorded">{recordedAt(log.timestamp)}</Metadata>
                <Metadata label="Action">{valueText(log.action)}</Metadata>
                <Metadata label="Level">{valueText(log.level)}</Metadata>
                <Metadata label="Message">{valueText(log.message)}</Metadata>
              </dl>
            </section>
            <section aria-label="Client metadata">
              <h3 className="mb-4 text-sm font-semibold">Client</h3>
              <dl className="space-y-4 text-sm">
                <Metadata label="Username">{valueText(log.username)}</Metadata>
                <Metadata label="IP address" mono>
                  {valueText(log.ip_address)}
                </Metadata>
                <Metadata label="Browser">{valueText(log.browser_info)}</Metadata>
              </dl>
              <details className="group mt-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  User agent
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <p className="font-mono text-xs leading-6 [overflow-wrap:anywhere]">
                  {valueText(log.user_agent)}
                </p>
              </details>
            </section>
          </div>
          <section
            aria-label="Log identifier"
            className="flex items-start justify-between gap-3 border-t pt-4"
          >
            <div className="min-w-0">
              <h3 className="mb-1 text-xs text-muted-foreground">Log ID</h3>
              <p className="font-mono text-xs leading-6 [overflow-wrap:anywhere]">
                {valueText(log.id)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copy log ID"
              onClick={() => void copyText(log.id, "Log ID")}
            >
              <Copy className="size-4" />
            </Button>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Summary({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm font-medium [overflow-wrap:anywhere]",
          mono && "font-mono tabular-nums",
        )}
      >
        {children}
      </dd>
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
          className="max-h-[32dvh] min-h-40 sm:max-h-[min(420px,calc(90dvh-440px))] overflow-auto bg-muted/20 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <pre
            className={cn(
              "py-3 font-mono text-xs leading-6 tabular-nums sm:text-[13px]",
              wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre",
            )}
          >
            <code className="block">
              {serialized.split("\n").map((line, index) => (
                <span key={index} className="flex min-w-full">
                  <span
                    aria-hidden="true"
                    className="sticky left-0 mr-4 w-10 shrink-0 select-none border-r bg-muted px-2 text-right text-muted-foreground"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 pr-4">
                    {isJson ? <JsonText text={line} /> : line || " "}
                  </span>
                </span>
              ))}
            </code>
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

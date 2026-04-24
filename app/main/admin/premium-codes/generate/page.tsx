"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker24hForm } from "@/components/ui/datepickerhour";
import { Input } from "@/components/ui/input";
import {
  generateAdminPremiumCodes,
  type AdminGeneratePremiumCodeBulkResponse,
  type AdminPremiumCode,
} from "@/lib/api/auth";

type LoadState = "ready" | "forbidden";

export default function AdminGeneratePremiumCodesPage() {
  const [state, setState] = useState<LoadState>(() => {
    const roleFromStorage = getStoredRole();
    if (roleFromStorage && !isAdminRole(roleFromStorage)) {
      return "forbidden";
    }
    return "ready";
  });
  const [validUntilDate, setValidUntilDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [limitUsage, setLimitUsage] = useState(1);
  const [isBulk, setIsBulk] = useState(false);
  const [amount, setAmount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<AdminPremiumCode[]>([]);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  const generatedCount = useMemo(() => generatedCodes.length, [generatedCodes]);

  const handleGenerate = async () => {
    if (state === "forbidden" || isSubmitting) {
      return;
    }

    if (!validUntilDate || Number.isNaN(validUntilDate.getTime())) {
      toast.error("Invalid date time", {
        description: "Please provide a valid expiration date.",
      });
      return;
    }
    if (validUntilDate.getTime() <= Date.now()) {
      toast.error("Invalid valid until", {
        description: "Valid until must be in the future.",
      });
      return;
    }
    if (!Number.isFinite(limitUsage) || limitUsage < 1) {
      toast.error("Invalid usage limit", {
        description: "Limit usage must be at least 1.",
      });
      return;
    }
    if (isBulk && (!Number.isFinite(amount) || amount < 1 || amount > 100)) {
      toast.error("Invalid amount", {
        description: "Bulk amount must be between 1 and 100.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await generateAdminPremiumCodes({
        valid_until: validUntilDate.toISOString(),
        limit_usage: limitUsage,
        is_bulk: isBulk,
        amount: isBulk ? amount : undefined,
      });
      const data = response.data;
      const normalized = normalizeGeneratedCodes(data);
      setGeneratedCodes(normalized);
      setLastGeneratedAt(new Date().toISOString());
      toast.success("Premium code generated", {
        description: `Generated ${normalized.length} code(s).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (
        message.includes("administrator") ||
        message.includes("permission") ||
        message.includes("access denied") ||
        message.includes("forbidden")
      ) {
        setState("forbidden");
        return;
      }
      toast.error("Failed to generate premium code", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Generate Premium Codes</h1>
            <p className="text-sm text-muted-foreground">
              Create single or bulk premium secret codes for subscription activation.
            </p>
          </div>

          {state === "forbidden" ? (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is available only for admin and super admin roles.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Generate Form</CardTitle>
                  <CardDescription>
                    Set expiry time and usage limit, then generate premium code(s).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="valid_until">Valid Until</Label>
                    <DateTimePicker24hForm
                      value={validUntilDate}
                      onChange={setValidUntilDate}
                      disablePast
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="limit_usage">Usage Limit</Label>
                    <Input
                      id="limit_usage"
                      type="number"
                      min={1}
                      value={limitUsage}
                      onChange={(event) => setLimitUsage(Number(event.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Bulk Generate</p>
                      <p className="text-xs text-muted-foreground">
                        Enable if you want multiple codes in one request.
                      </p>
                    </div>
                    <Switch checked={isBulk} onCheckedChange={setIsBulk} />
                  </div>

                  {isBulk && (
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        min={1}
                        max={100}
                        value={amount}
                        onChange={(event) => setAmount(Number(event.target.value))}
                      />
                    </div>
                  )}

                  <Button onClick={handleGenerate} disabled={isSubmitting}>
                    {isSubmitting ? "Generating..." : "Generate Premium Code"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generated Result</CardTitle>
                  <CardDescription>
                    {generatedCount > 0
                      ? `Generated ${generatedCount} code(s).`
                      : "No generated code yet."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedCodes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Generate code first to see results.</p>
                  ) : (
                    generatedCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                      >
                        <div className="space-y-1">
                          <p className="font-mono text-xs break-all">{code.secret_code}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">Limit: {code.limit_usage ?? "-"}</Badge>
                            <Badge variant="outline">Used: {code.usage_count}</Badge>
                            <Badge variant="outline">
                              Valid Until: {formatDateTime(code.valid_until)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyText(code.secret_code)}
                        >
                          Copy
                        </Button>
                      </div>
                    ))
                  )}

                  {lastGeneratedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last generated at {formatDateTime(lastGeneratedAt)}.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function normalizeGeneratedCodes(
  data: AdminPremiumCode | AdminGeneratePremiumCodeBulkResponse | null
): AdminPremiumCode[] {
  if (!data) {
    return [];
  }
  if ("items" in data) {
    return data.items ?? [];
  }
  return [data];
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied", { description: "Secret code copied to clipboard." });
  } catch {
    toast.error("Copy failed", { description: "Unable to copy secret code." });
  }
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { role?: string };
    if (!parsed.role) {
      return null;
    }
    const normalized = parsed.role.trim().toLowerCase();
    return normalized || null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

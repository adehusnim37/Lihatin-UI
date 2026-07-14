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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Generate Premium Codes</h1>
              <p className="text-sm text-muted-foreground">
                Create single or bulk premium secret codes for subscription activation.
              </p>
            </div>
          </div>

          {state === "forbidden" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>
                    This page is available only for admin and super admin roles.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Form</CardTitle>
                    <CardDescription>
                      Set the expiration and usage rules for the new premium code.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div
                      className={`grid gap-5 md:grid-cols-2 ${
                        isBulk ? "lg:grid-cols-3" : ""
                      }`}
                    >
                      <div className="grid min-w-0 gap-2">
                        <Label htmlFor="valid_until">Valid Until</Label>
                        <DateTimePicker24hForm
                          value={validUntilDate}
                          onChange={setValidUntilDate}
                          disablePast
                        />
                        <p className="text-xs leading-5 text-muted-foreground">
                          Code activation will stop after this date.
                        </p>
                      </div>

                      <div className="grid content-start gap-2">
                        <Label htmlFor="limit_usage">Usage Limit</Label>
                        <Input
                          id="limit_usage"
                          type="number"
                          min={1}
                          max={100}
                          inputMode="numeric"
                          value={limitUsage}
                          onChange={(event) => setLimitUsage(Number(event.target.value))}
                        />
                        <p className="text-xs leading-5 text-muted-foreground">
                          Maximum successful activations for each code.
                        </p>
                      </div>

                      {isBulk && (
                        <div className="grid content-start gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="amount">Amount</Label>
                            <span className="text-xs text-muted-foreground">Maximum 100</span>
                          </div>
                          <Input
                            id="amount"
                            type="number"
                            min={1}
                            max={100}
                            inputMode="numeric"
                            value={amount}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              if (!Number.isFinite(nextValue)) {
                                return;
                              }
                              setAmount(clampInteger(nextValue, 1, 100));
                            }}
                            onBlur={() => setAmount((prev) => clampInteger(prev, 1, 100))}
                          />
                          <p className="text-xs leading-5 text-muted-foreground">
                            Number of unique premium codes to generate.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                        <div className="min-w-0 space-y-1">
                          <Label htmlFor="bulk_generate" className="cursor-pointer">
                            Bulk Generate
                          </Label>
                          <p className="text-xs leading-5 text-muted-foreground">
                            Generate multiple unique codes in one request.
                          </p>
                        </div>
                        <Switch
                          id="bulk_generate"
                          checked={isBulk}
                          onCheckedChange={setIsBulk}
                          aria-label="Enable bulk code generation"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        {isBulk
                          ? `${Number.isFinite(amount) ? amount : 0} codes will be generated.`
                          : "1 code will be generated."}
                      </p>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={handleGenerate}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Generating..." : "Generate Premium Code"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>Generated Result</CardTitle>
                          {generatedCount > 0 && (
                            <Badge variant="secondary">{generatedCount} codes</Badge>
                          )}
                        </div>
                        <CardDescription>
                          {generatedCount > 0
                            ? "Copy and distribute these codes securely."
                            : "Generated premium codes will appear here."}
                        </CardDescription>
                      </div>
                      {generatedCount > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() =>
                            copyText(
                              generatedCodes.map((code) => code.secret_code).join("\n"),
                              `${generatedCount} secret codes copied to clipboard.`
                            )
                          }
                        >
                          Copy All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {generatedCodes.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                        <p className="text-sm font-medium">No generated codes yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Complete the form above to generate a premium code.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {generatedCodes.map((code, index) => (
                          <div
                            key={code.id}
                            className="flex min-w-0 flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 space-y-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Code {index + 1}</span>
                              </div>
                              <code className="block break-all rounded-md bg-muted/50 px-3 py-2 text-xs font-medium">
                                {code.secret_code}
                              </code>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  Usage: {code.usage_count} / {code.limit_usage ?? "-"}
                                </Badge>
                                <Badge variant="outline">
                                  Expires: {formatDateTime(code.valid_until)}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full shrink-0 sm:w-auto"
                              onClick={() => copyText(code.secret_code)}
                            >
                              Copy Code
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {lastGeneratedAt && (
                      <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
                        Last generated at {formatDateTime(lastGeneratedAt)}.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
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

function clampInteger(value: number, min: number, max: number): number {
  const truncated = Math.trunc(value);
  return Math.min(max, Math.max(min, truncated));
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

async function copyText(
  value: string,
  description = "Secret code copied to clipboard."
): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied", { description });
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

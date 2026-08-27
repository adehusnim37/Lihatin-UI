"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconCopy,
  IconKey,
  IconPackages,
  IconSparkles,
  IconStack2,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CounterInput } from "@/components/ui/counter-input";
import { DateTimePicker24hForm } from "@/components/ui/datepickerhour";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateAdminPremiumCodes,
  type AdminGeneratePremiumCodeBulkResponse,
  type AdminPremiumCode,
} from "@/lib/api/auth";

type GenerationMode = "single" | "batch";

const DEFAULT_EXPIRY_DAYS = 7;
const MAX_BATCH_SIZE = 100;

export default function AdminGeneratePremiumCodesPage() {
  const [roleFromStorage, setRoleFromStorage] = useState<
    string | null | undefined
  >(undefined);
  const [mode, setMode] = useState<GenerationMode>("single");
  const [validUntilDate, setValidUntilDate] = useState<Date | undefined>(() =>
    addDays(new Date(), DEFAULT_EXPIRY_DAYS)
  );
  const [limitUsage, setLimitUsage] = useState(1);
  const [amount, setAmount] = useState(5);
  const [isLifetime, setIsLifetime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<AdminPremiumCode[]>([]);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setRoleFromStorage(getStoredRole()),
      0
    );
    return () => window.clearTimeout(timer);
  }, []);

  const isAdmin = roleFromStorage ? isAdminRole(roleFromStorage) : false;
  const isBatch = mode === "batch";
  const codeCount = isBatch ? amount : 1;
  const totalEntitlements = codeCount * limitUsage;
  const generatedCount = generatedCodes.length;
  const expirySummary = useMemo(
    () => getExpirySummary(validUntilDate, isLifetime),
    [validUntilDate, isLifetime]
  );

  const handleGenerate = async () => {
    if (!isAdmin || isSubmitting) return;

    if (!isLifetime) {
      if (!validUntilDate || Number.isNaN(validUntilDate.getTime())) {
        toast.error("Expiration required", {
          description: "Choose when these premium codes should expire.",
        });
        return;
      }
      if (validUntilDate.getTime() <= Date.now()) {
        toast.error("Expiration must be in the future", {
          description: "Choose a later date and time.",
        });
        return;
      }
    }
    if (!Number.isFinite(limitUsage) || limitUsage < 1) {
      toast.error("Usage limit must be at least 1");
      return;
    }
    if (
      isBatch &&
      (!Number.isFinite(amount) || amount < 1 || amount > MAX_BATCH_SIZE)
    ) {
      toast.error("Batch size must be between 1 and 100");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await generateAdminPremiumCodes({
        valid_until: isLifetime
          ? undefined
          : validUntilDate?.toISOString(),
        limit_usage: limitUsage,
        is_bulk: isBatch,
        amount: isBatch ? amount : undefined,
        is_lifetime: isLifetime,
      });
      const normalized = normalizeGeneratedCodes(response.data);
      setGeneratedCodes(normalized);
      setLastGeneratedAt(new Date().toISOString());
      toast.success(
        normalized.length === 1 ? "Premium code issued" : "Code batch issued",
        {
          description: `${normalized.length} code${
            normalized.length === 1 ? "" : "s"
          } generated successfully.`,
        }
      );
    } catch (error) {
      toast.error("Codes could not be generated", {
        description: error instanceof Error ? error.message : "Try again.",
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
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <header className="max-w-2xl space-y-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Generate premium codes
              </h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Define one entitlement policy, then issue a single code or a
                controlled batch.
              </p>
            </div>
          </header>

          {typeof roleFromStorage === "undefined" ? (
            <GeneratePageSkeleton />
          ) : !isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>
                  This issuance desk is available only to admins and super
                  admins.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <Card className="overflow-hidden py-0">
                  <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
                    <CardTitle>Issuance rules</CardTitle>
                    <CardDescription>
                      Every generated code in this run shares these rules.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-7 px-5 py-6 md:px-6">
                    <div className="space-y-3">
                      <Label>Generation mode</Label>
                      <Tabs
                        value={mode}
                        onValueChange={(value) =>
                          setMode(value as GenerationMode)
                        }
                      >
                        <TabsList className="grid h-auto w-full grid-cols-2 p-1">
                          <TabsTrigger
                            value="single"
                            className="h-auto justify-start px-3 py-3"
                          >
                            <IconKey />
                            <span className="text-left">
                              <span className="block">Single code</span>
                              <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                                Issue one code now
                              </span>
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="batch"
                            className="h-auto justify-start px-3 py-3"
                          >
                            <IconPackages />
                            <span className="text-left">
                              <span className="block">Batch</span>
                              <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                                Up to 100 codes
                              </span>
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <Label>Valid until</Label>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Redemption stops immediately after this time.
                          </p>
                        </div>
                        <DateTimePicker24hForm
                          value={validUntilDate}
                          onChange={setValidUntilDate}
                          disablePast
                        />
                        <div className="flex flex-wrap gap-2">
                          {[7, 30, 90, 180, 360].map((days) => (
                            <Button
                              key={days}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setValidUntilDate(addDays(new Date(), days))
                              }
                            >
                              {days} days
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="limit_usage">
                            Redemptions per code
                          </Label>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Maximum successful activations allowed for each
                            code.
                          </p>
                        </div>
                        <CounterInput
                          value={limitUsage}
                          onChange={setLimitUsage}
                          min={1}
                          max={100_000}
                          className="max-w-xs"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label htmlFor="is_lifetime">Lifetime access</Label>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Codes never expire. Redemption stays available
                            indefinitely instead of stopping at a valid-until
                            date.
                          </p>
                        </div>
                        <Switch
                          id="is_lifetime"
                          checked={isLifetime}
                          onCheckedChange={setIsLifetime}
                        />
                      </div>
                    </div>

                    {isBatch && (
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-center">
                          <div>
                            <Label>Number of codes</Label>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              Each code is unique and follows the same expiry
                              and redemption limit.
                            </p>
                          </div>
                          <CounterInput
                            value={amount}
                            onChange={setAmount}
                            min={1}
                            max={MAX_BATCH_SIZE}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Codes are shown once generated. Store them securely.
                      </p>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={handleGenerate}
                        disabled={isSubmitting}
                      >
                        <IconSparkles />
                        {isSubmitting
                          ? "Generating..."
                          : isBatch
                            ? `Generate ${amount} codes`
                            : "Generate code"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <IssuanceManifest
                  codeCount={codeCount}
                  limitUsage={limitUsage}
                  totalEntitlements={totalEntitlements}
                  validUntil={isLifetime ? undefined : validUntilDate}
                  expirySummary={expirySummary}
                  mode={mode}
                  isLifetime={isLifetime}
                />
              </div>

              <Card className="overflow-hidden py-0">
                <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>Issued codes</CardTitle>
                        {generatedCount > 0 && (
                          <Badge variant="secondary">
                            {generatedCount} code
                            {generatedCount === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {generatedCount > 0
                          ? "This is the latest issuance run."
                          : "New codes will appear here after generation."}
                      </CardDescription>
                    </div>
                    {generatedCount > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyText(
                            generatedCodes
                              .map((code) => code.secret_code)
                              .join("\n"),
                            `${generatedCount} premium codes copied.`
                          )
                        }
                      >
                        <IconCopy />
                        Copy all
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {generatedCount === 0 ? (
                    <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
                      <div className="grid size-11 place-items-center rounded-full bg-muted">
                        <IconKey className="size-5 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-sm font-medium">
                        No codes issued in this session
                      </p>
                      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                        Configure the issuance rules above, then generate your
                        first code or batch.
                      </p>
                    </div>
                  ) : generatedCount > 5 ? (
                    <ScrollArea className="h-[460px]">
                      <GeneratedCodeList codes={generatedCodes} />
                    </ScrollArea>
                  ) : (
                    <GeneratedCodeList codes={generatedCodes} />
                  )}

                  {lastGeneratedAt && (
                    <div className="flex items-center gap-2 border-t px-5 py-3 text-xs text-muted-foreground md:px-6">
                      <IconClock className="size-3.5" />
                      Issued {formatDateTime(lastGeneratedAt)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function IssuanceManifest({
  codeCount,
  limitUsage,
  totalEntitlements,
  validUntil,
  expirySummary,
  mode,
  isLifetime,
}: {
  codeCount: number;
  limitUsage: number;
  totalEntitlements: number;
  validUntil?: Date;
  expirySummary: string;
  mode: GenerationMode;
  isLifetime: boolean;
}) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-primary py-0 xl:sticky xl:top-6">
      <CardHeader className="border-b px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Issuance manifest</CardTitle>
            <CardDescription className="mt-1">
              Live summary before generation
            </CardDescription>
          </div>
          <StatusBadge tone="info">
            {mode === "batch" ? "Batch" : "Single"}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 px-5 py-2">
        <ManifestRow
          icon={<IconStack2 />}
          label="Codes"
          value={codeCount.toLocaleString()}
        />
        <ManifestRow
          icon={<IconUsers />}
          label="Per code"
          value={`${limitUsage.toLocaleString()} redemption${
            limitUsage === 1 ? "" : "s"
          }`}
        />
        <ManifestRow
          icon={<IconSparkles />}
          label="Total capacity"
          value={totalEntitlements.toLocaleString()}
        />
        <ManifestRow
          icon={<IconCalendar />}
          label="Expires"
          value={
            isLifetime
              ? "Never"
              : validUntil
                ? formatDateTime(validUntil.toISOString())
                : "Not set"
          }
          detail={isLifetime ? "Lifetime access" : expirySummary}
        />
      </CardContent>
      <div className="flex items-center gap-2 border-t bg-muted/20 px-5 py-4 text-xs text-muted-foreground">
        <IconArrowRight className="size-3.5" />
        Review the manifest, then generate.
      </div>
    </Card>
  );
}

function ManifestRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b py-4 last:border-0">
      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
        {detail && (
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}

function GeneratedCodeList({ codes }: { codes: AdminPremiumCode[] }) {
  return (
    <div>
      {codes.map((code, index) => (
        <div
          key={code.id}
          className="grid gap-3 border-b px-5 py-4 last:border-0 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-center md:px-6"
        >
          <div className="grid size-8 place-items-center rounded-md bg-muted font-mono text-xs text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="min-w-0">
            <code
              className="block truncate font-mono text-xs font-semibold tracking-wide"
              title={code.secret_code}
            >
              {code.secret_code}
            </code>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                {code.usage_count} / {code.limit_usage ?? "∞"} used
              </span>
              <span>
                {code.is_lifetime || !code.valid_until
                  ? "Never expires"
                  : `Expires ${formatDateTime(code.valid_until)}`}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => copyText(code.secret_code)}
          >
            <IconCopy />
            Copy
          </Button>
        </div>
      ))}
    </div>
  );
}

function GeneratePageSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="h-[480px] animate-pulse bg-muted/30" />
      <Card className="h-[360px] animate-pulse bg-muted/30" />
    </div>
  );
}

function normalizeGeneratedCodes(
  data: AdminPremiumCode | AdminGeneratePremiumCodeBulkResponse | null
): AdminPremiumCode[] {
  if (!data) return [];
  return "items" in data ? (data.items ?? []) : [data];
}

function addDays(source: Date, days: number): Date {
  return new Date(source.getTime() + days * 86_400_000);
}

function getExpirySummary(value?: Date, isLifetime?: boolean): string {
  if (isLifetime) return "Never expires";
  if (!value || Number.isNaN(value.getTime())) return "Choose a valid date";
  const remainingMs = value.getTime() - Date.now();
  if (remainingMs <= 0) return "Expiration is in the past";
  const days = Math.ceil(remainingMs / 86_400_000);
  return days === 1 ? "About 1 day from now" : `About ${days} days from now`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
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
  description = "Premium code copied."
): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied", { description });
  } catch {
    toast.error("Code could not be copied", {
      description: "Copy the code manually and try again.",
    });
  }
}

function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { role?: string };
    return parsed.role?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

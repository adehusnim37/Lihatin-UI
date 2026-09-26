"use client";

import { Fragment, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useGuideT, renderInline } from "@/lib/api-docs/locale";
import { guideTranslations as gt } from "@/lib/api-docs/translations";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1").replace(/\/$/, "");
function CodeBlock({ code }: { code: string }) {
  const { t } = useGuideT();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="rounded-lg border bg-muted/40 overflow-hidden">
      <div className="flex justify-end border-b p-1">
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t(gt.copySuccess) : t(gt.copyLabel)}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed" tabIndex={0}>
        <code>{code}</code>
      </pre>
      <span role="status" className={error ? "block p-2 text-sm text-destructive" : "sr-only"}>
        {error ? t(gt.copyError) : copied ? t(gt.copyStatus) : ""}
      </span>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function FieldList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y rounded-lg border">
      {rows.map(([name, description]) => (
        <div
          key={name}
          className="grid min-w-0 gap-1 p-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="break-words font-mono text-xs font-semibold leading-6">{name}</dt>
          <dd className="min-w-0 break-words text-muted-foreground">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

export function APIReference() {
  const { t } = useGuideT();
  return (
    <div className="min-w-0 space-y-6 text-sm leading-7 [&_p]:max-w-prose [&_p_code]:break-words">
      <Breadcrumb aria-label={t(gt.breadcrumbAriaLabel)}>
        <BreadcrumbList>
          {[
            ["quick-start", t(gt.breadcrumbQuickStart)],
            ["payload", t(gt.breadcrumbPayload)],
            ["key-management", t(gt.breadcrumbKeyManagement)],
            ["limits-errors", t(gt.breadcrumbLimitsErrors)],
          ].map(([id, label], index) => (
            <Fragment key={id}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbLink href={`#${id}`}>{label}</BreadcrumbLink>
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <Section id="quick-start" title={t(gt.sectionQuickStartTitle)}>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{t(gt.step1)}</li>
          <li>{t(gt.step2)}</li>
          <li>{t(gt.step3)}</li>
          <li>{renderInline(t(gt.step4))}</li>
        </ol>
        <FieldList
          rows={[
            ["read", t(gt.permRead)],
            ["write", t(gt.permWrite)],
            ["update", t(gt.permUpdate)],
            ["delete", t(gt.permDelete)],
          ]}
        />
        <div className="rounded-lg bg-muted p-3">
          <span className="text-muted-foreground">{t(gt.baseUrlLabel)}</span>
          <code className="mt-1 block break-all">{baseURL}</code>
        </div>
        <p>{t(gt.saveKeyWarning)}</p>
        <CodeBlock
          code={`# Isi LIHATIN_API_KEY melalui environment server terlebih dahulu\nexport LIHATIN_API_URL='${baseURL}'\n\ncurl "$LIHATIN_API_URL/api/short?page=1&limit=10" \\\n  --header "X-API-Key: $LIHATIN_API_KEY"`}
        />
        <p>{t(gt.scopeNote)}</p>
      </Section>
      <Section id="payload" title={t(gt.sectionPayloadTitle)}>
        <h3 className="font-semibold">{t(gt.createSingleTitle)}</h3>
        <p>{renderInline(t(gt.createSingleDesc))}</p>
        <CodeBlock
          code={`curl -X POST "${baseURL}/api/short" \\
  -H "X-API-Key: $LIHATIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "is_bulky": false,
    "link": {
      "original_url": "https://example.com/artikel",
      "title": "Artikel contoh",
      "description": "Link untuk artikel contoh",
      "custom_code": "artikel-contoh",
      "expires_at": "2030-12-31T23:59:59+07:00",
      "passcode": "482915"
    }
  }'`}
        />
        <p>{t(gt.payloadSentLabel)}</p>
        <CodeBlock
          code={JSON.stringify(
            {
              is_bulky: false,
              link: {
                original_url: "https://example.com/artikel",
                title: "Artikel contoh",
              },
            },
            null,
            2,
          )}
        />
        <FieldList
          rows={[
            ["original_url", t(gt.fieldOriginalUrl)],
            ["title", t(gt.fieldTitle)],
            ["description", t(gt.fieldDescription)],
            ["custom_code", t(gt.fieldCustomCode)],
            ["passcode", t(gt.fieldPasscode)],
            ["expires_at", t(gt.fieldExpiresAt)],
          ]}
        />
        <h3 className="font-semibold">{t(gt.createBulkTitle)}</h3>
        <p>
          {t(gt.createBulkDesc1)}
          <code>is_bulky</code>
          {t(gt.createBulkDesc2)}
          <code>links</code>
          {t(gt.createBulkDesc3)} <code>original_url</code>.
        </p>
        <CodeBlock
          code={`curl -X POST "${baseURL}/api/short" \\
  -H "X-API-Key: $LIHATIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "is_bulky": true,
    "links": [
      {
        "original_url": "https://example.com/pertama",
        "title": "Artikel pertama"
      },
      {
        "original_url": "https://example.com/kedua",
        "custom_code": "artikel-kedua"
      }
    ]
  }'`}
        />
        <p>{t(gt.bulkPayloadLabel)}</p>
        <CodeBlock
          code={JSON.stringify(
            {
              is_bulky: true,
              links: [
                { original_url: "https://example.com/pertama" },
                { original_url: "https://example.com/kedua" },
              ],
            },
            null,
            2,
          )}
        />
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          {t(gt.bulkLimitWarning)}
        </p>
        <h3 className="font-semibold">{t(gt.updateLinkTitle)}</h3>
        <p>{t(gt.updateLinkDesc)}</p>
        <CodeBlock
          code={JSON.stringify(
            {
              title: "Artikel terbaru",
              is_active: true,
              click_limit: 0,
              expires_at: null,
            },
            null,
            2,
          )}
        />
        <FieldList
          rows={[
            ["title / description", t(gt.fieldTitleDesc)],
            ["short_code", t(gt.fieldShortCode)],
            ["is_active", t(gt.fieldIsActive)],
            ["click_limit", t(gt.fieldClickLimit)],
            ["expires_at", t(gt.fieldExpiresAtUpdate)],
            ["passcode / enable_stats", t(gt.fieldPasscodeStats)],
            ["custom_domain", t(gt.fieldCustomDomain)],
            ["utm_*", t(gt.fieldUtm)],
          ]}
        />
        <h3 className="font-semibold">{t(gt.readResponseTitle)}</h3>
        <p>{t(gt.readResponseDesc)}</p>
        <CodeBlock
          code={JSON.stringify(
            {
              success: true,
              data: {
                id: "contoh-id",
                short_code: "artikel-contoh",
                original_url: "https://example.com/artikel",
                is_active: true,
                expires_at: null,
                created_at: "2026-09-24T10:00:00Z",
              },
              message: t(gt.respMessageExample),
            },
            null,
            2,
          )}
        />
        <FieldList
          rows={[
            ["success", t(gt.fieldSuccess)],
            ["data", t(gt.fieldData)],
            ["message", t(gt.fieldMessage)],
            ["error", t(gt.fieldError)],
          ]}
        />
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold">{t(gt.jsServerExampleSummary)}</summary>
          <div className="mt-4">
            <CodeBlock
              code={`const response = await fetch(process.env.LIHATIN_API_URL + "/api/short", {\n  method: "POST",\n  headers: {\n    "X-API-Key": process.env.LIHATIN_API_KEY,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ link: { original_url: "https://example.com" } }),\n});\nconst result = await response.json();\nif (!response.ok || !result.success) {\n  throw new Error(result.message || "${t(gt.jsServerExampleError)}");\n}\nconsole.log(result.data.short_code);`}
            />
          </div>
        </details>
      </Section>
      <Section id="key-management" title={t(gt.sectionKeyManagementTitle)}>
        <p>{t(gt.keyMgmtDesc)}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t(gt.keyLimit)}</li>
          <li>{t(gt.keyDefaultPerm)}</li>
          <li>{t(gt.keyRefresh)}</li>
          <li>{t(gt.keyUsageCount)}</li>
          <li>{t(gt.keyUsageLimit)}</li>
        </ul>
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold">{t(gt.keyEndpointRefSummary)}</summary>
          <div className="mt-4 space-y-4">
            <p>{t(gt.keyEndpointRefDesc)}</p>
            <FieldList
              rows={[
                ["GET /api-keys/", t(gt.epListKeys)],
                ["POST /api-keys/", t(gt.epCreateKey)],
                ["GET /api-keys/:id", t(gt.epGetKey)],
                ["PUT /api-keys/:id", t(gt.epUpdateKey)],
                ["DELETE /api-keys/:id", t(gt.epDeleteKey)],
                ["POST /api-keys/:id/activate", t(gt.epActivateKey)],
                ["POST /api-keys/:id/deactivate", t(gt.epDeactivateKey)],
                ["POST /api-keys/:id/refresh", t(gt.epRefreshKey)],
                ["GET /api-keys/:id/usage", t(gt.epUsageKey)],
                ["GET /api-keys/stats", t(gt.epStatsKey)],
              ]}
            />
          </div>
        </details>
        <details className="rounded-lg border border-amber-500/40 p-4">
          <summary className="cursor-pointer font-semibold">{t(gt.keyLimitationsSummary)}</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>{t(gt.keyLimitationIps)}</li>
          </ul>
        </details>
      </Section>
      <Section id="limits-errors" title={t(gt.sectionLimitsTitle)}>
        <FieldList
          rows={[
            [t(gt.limitRateLabel), t(gt.limitRateDesc)],
            [t(gt.authThrottleLabel), t(gt.authThrottleDesc)],
            [t(gt.limitUsageLabel), t(gt.limitUsageDesc)],
            [t(gt.quotaCountLabel), t(gt.quotaCountDesc)],
            [t(gt.ipRestrictionLabel), t(gt.ipRestrictionDesc)],
            [t(gt.keyStatusLabel), t(gt.keyStatusDesc)],
          ]}
        />
        <h3 className="font-semibold">{t(gt.errorsHeading)}</h3>
        <FieldList
          rows={[
            ["400", t(gt.err400)],
            ["401 / 403", t(gt.err401403)],
            ["404", t(gt.err404)],
            ["409", t(gt.err409)],
            ["429", t(gt.err429)],
            ["500", t(gt.err500)],
          ]}
        />
        <p>{t(gt.retryWarning)}</p>
      </Section>
    </div>
  );
}

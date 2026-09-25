"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { APIReference } from "./api-reference";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DocsLocaleProvider, useDocsLocale, useGuideT } from "@/lib/api-docs/locale";
import { guideTranslations as gt } from "@/lib/api-docs/translations";

const ScalarReference = dynamic(() => import("./scalar-reference"), {
  ssr: false,
  loading: () => (
    <div role="status" className="rounded-xl border p-8 text-muted-foreground">
      Loading API reference…
    </div>
  ),
});

function LocaleToggle() {
  const { locale, setLocale } = useDocsLocale();
  const { t } = useGuideT();
  return (
    <ToggleGroup
      type="single"
      value={locale}
      onValueChange={(value) => value && setLocale(value as "id" | "en")}
      aria-label={t(gt.localeToggleLabel)}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="id">ID</ToggleGroupItem>
      <ToggleGroupItem value="en">EN</ToggleGroupItem>
    </ToggleGroup>
  );
}

function APIDocumentationContent() {
  const { t } = useGuideT();
  return (
    <Tabs defaultValue="reference" className="w-full min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList
          aria-label={t(gt.docTypeAriaLabel)}
          className="grid h-auto w-full grid-cols-2 sm:w-auto"
        >
          <TabsTrigger value="reference">{t(gt.tabReference)}</TabsTrigger>
          <TabsTrigger value="guide">{t(gt.tabGuide)}</TabsTrigger>
        </TabsList>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <LocaleToggle />
          {(["json", "yaml"] as const).map((format) => (
            <Button key={format} asChild variant="outline" size="sm">
              <a href={`/main/api-integrations/docs/spec?format=${format}`}>
                <Download className="size-4" /> {t(gt.downloadFormat)} {format.toUpperCase()}
              </a>
            </Button>
          ))}
        </div>
      </div>
      <TabsContent value="reference" className="w-full min-w-0 space-y-5">
        <ol className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm leading-6 md:grid-cols-3">
          <li>
            <strong className="block">{t(gt.refStep1Title)}</strong>
            <span className="text-muted-foreground">{t(gt.refStep1Desc)}</span>
          </li>
          <li>
            <strong className="block">{t(gt.refStep2Title)}</strong>
            <span className="text-muted-foreground">{t(gt.refStep2Desc)}</span>
          </li>
          <li>
            <strong className="block">{t(gt.refStep3Title)}</strong>
            <span className="text-muted-foreground">{t(gt.refStep3Desc)}</span>
          </li>
        </ol>
        <p className="text-sm leading-6 text-muted-foreground">{t(gt.refStructureNote)}</p>
        <ScalarReference />
      </TabsContent>
      <TabsContent value="guide" className="min-w-0">
        <APIReference />
      </TabsContent>
    </Tabs>
  );
}

export function APIDocumentation() {
  return (
    <DocsLocaleProvider>
      <APIDocumentationContent />
    </DocsLocaleProvider>
  );
}

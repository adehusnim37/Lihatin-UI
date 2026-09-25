"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import { getOpenAPIDocument } from "@/lib/api-docs/document";
import { useDocsLocale } from "@/lib/api-docs/locale";
import "@scalar/api-reference-react/style.css";

export default function ScalarReference() {
  const { resolvedTheme } = useTheme();
  const { locale } = useDocsLocale();

  const configuration = useMemo(
    () => ({
      content: getOpenAPIDocument(locale),
      theme: "none" as const,
      layout: "modern" as const,
      darkMode: resolvedTheme === "dark",
      hideDarkModeToggle: true,
      showSidebar: false,
      hideModels: true,
      hideClientButton: true,
      showDeveloperTools: "never" as const,
      // Send requests directly to Lihatin, without a third-party proxy.
      proxyUrl: "",
      persistAuth: false,
      telemetry: false,
      agent: { disabled: true },
      withDefaultFonts: false,
      authentication: { preferredSecurityScheme: "ApiKeyAuth" },
    }),
    [resolvedTheme, locale],
  );

  return (
    <div className="lihatin-api-reference min-w-0 overflow-hidden rounded-xl border">
      <ApiReferenceReact configuration={configuration} />
    </div>
  );
}

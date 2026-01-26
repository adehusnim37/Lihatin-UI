"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// INSTRUCTION:
// 1. Place your 'openapi.json' or 'openapi.yaml' file in the 'public' folder.
// 2. Update the 'spec.url' below to point to '/openapi.json' or '/openapi.yaml'.
// Alternatively, if you have the content as a JSON object, you can pass it to 'spec.content'.

export default function ApiDocsPage() {
  return (
    <div className="relative flex flex-col h-screen w-full bg-background text-foreground">
      <header className="flex items-center justify-between h-14 px-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/main">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted text-muted-foreground">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs font-medium bg-background text-foreground shadow-sm hover:bg-background/80"
          >
            Scalar (Interactive)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-medium hover:bg-background/50 hover:text-foreground"
            asChild
          >
            <Link
              href="https://www.postman.com/adehusnim/workspace/lihatin/collection/13183823-585cf118-ae9e-4e0d-af3c-f599d1caaf38?action=share&creator=13183823"
              target="_blank"
              rel="noopener noreferrer"
            >
              Postman Collection
            </Link>
          </Button>
        </div>
        <div className="w-[100px]" />{" "}
        {/* Spacer for centering if needed, or just empty */}
      </header>

      {/* Scalar API Reference */}
      <div className="flex-1 overflow-y-auto scalar-container">
        <ApiReferenceReact
          configuration={{
            url: process.env.NEXT_PUBLIC_API_DOCS_URL || "/openapi.yaml", // Fallback to local file if env var not set
            theme: "none", // We will provide custom styles
            darkMode: true,
            hideDownloadButton: true,
          }}
        />
      </div>

      {/* Custom Theme Styles mapped to Shadcn UI variables */}
      <style jsx global>{`
        .scalar-container {
          /* Sidebar */
          --scalar-sidebar-background-1: var(--sidebar);
          --scalar-sidebar-color-1: var(--sidebar-foreground);
          --scalar-sidebar-color-2: var(--sidebar-foreground);
          --scalar-sidebar-border-color: var(--sidebar-border);
          --scalar-sidebar-item-hover-background: var(--sidebar-accent);
          --scalar-sidebar-item-hover-color: var(--sidebar-accent-foreground);
          --scalar-sidebar-item-active-background: var(--sidebar-accent);
          --scalar-sidebar-color-active: var(--sidebar-accent-foreground);

          /* Main Content */
          --scalar-background-1: var(--background);
          --scalar-background-2: var(--muted);
          --scalar-background-3: var(--card);
          --scalar-color-1: var(--foreground);
          --scalar-color-2: var(--muted-foreground);
          --scalar-color-3: var(--muted-foreground);
          --scalar-border-color: var(--border);

          /* Accents & Buttons */
          --scalar-color-accent: var(--primary);
          --scalar-button-1: var(--primary);
          --scalar-button-1-color: var(--primary-foreground);
          --scalar-button-1-hover: var(--primary);

          /* Typography */
          --scalar-font: var(--font-sans);
          --scalar-font-code: var(--font-mono);
        }

        /* Ensure the Scalar layout fits well */
        .scalar-api-reference {
          height: 100%;
        }
      `}</style>
    </div>
  );
}

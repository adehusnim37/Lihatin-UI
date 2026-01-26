import { ApiReference } from "@scalar/nextjs-api-reference";
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
      {/* Navigation Header */}
      <header className="flex items-center h-14 px-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </header>

      {/* Scalar API Reference */}
      <div className="flex-1 overflow-hidden scalar-container">
        <ApiReference
          configuration={{
            spec: {
              url: "/openapi.yaml", // Replace with your actual file path
            },
            theme: "none", // We will provide custom styles
            darkMode: true,
            hideDownloadButton: true,
          }}
        />
      </div>

      {/* Custom Theme Styles mapped to Shadcn UI variables */}
      <style jsx global>{`
        .scalar-container {
          --scalar-color-1: var(--foreground);
          --scalar-color-2: var(--muted-foreground);
          --scalar-color-3: var(--muted-foreground);
          --scalar-color-accent: var(--primary);

          --scalar-background-1: var(--background);
          --scalar-background-2: var(--muted); // Sidebar/secondary bg
          --scalar-background-3: var(--card);

          --scalar-border-color: var(--border);

          --scalar-button-1: var(--primary);
          --scalar-button-1-color: var(--primary-foreground);
          --scalar-button-1-hover: var(--primary);

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

"use client";

import {
  Key,
  Plus,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CreateAPIKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { APIKeyList } from "@/components/api-keys/api-key-list";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
const API_DOCS_URL =
  process.env.NEXT_PUBLIC_API_DOCS_URL || `${API_BASE_URL}/docs/postman`;
const POSTMAN_COLLECTION_URL =
  process.env.NEXT_PUBLIC_POSTMAN_COLLECTION_URL ||
  "https://www.postman.com/adehusnim/workspace/lihatin/collection/13183823-585cf118-ae9e-4e0d-af3c-f599d1caaf38?action=share&creator=13183823";

export default function ApiIntegrationsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const docsUrl = API_DOCS_URL;
  const { data: docsAvailable, isLoading: docsLoading } = useQuery({
    queryKey: ["api-docs", "available", docsUrl] as const,
    queryFn: async () => {
      try {
        const res = await fetch(docsUrl);
        return res.ok;
      } catch {
        return false;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              API & Documentation
            </h1>
            <p className="text-muted-foreground">
              Manage your API keys and explore the API documentation.
            </p>
          </div>

          {/* Tabs for API Keys and Documentation */}
          <Tabs defaultValue="api-keys" className="space-y-6 w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="size-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger
                value="documentation"
                className="flex items-center gap-2"
              >
                <BookOpen className="size-4" />
                Documentation
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="api-keys" className="space-y-6">
              <div>
                {/* API Key Section */}
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Key className="size-5 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="font-semibold">API Keys</h2>
                        <p className="text-sm text-muted-foreground">
                          Manage your API access tokens
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="size-4 mr-2" />
                      Generate New Key
                    </Button>
                  </div>

                  {/* API Key List */}
                  <APIKeyList />

                  <p className="text-xs text-muted-foreground">
                    ⚠️ Keep your API keys secure. Never share them in public
                    repositories or client-side code.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-6">
              {/* Header with download button */}
              <div>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold">API Reference</h2>
                      <p className="text-sm text-muted-foreground">
                        Interactive API documentation
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <a
                      href={POSTMAN_COLLECTION_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4 mr-2" />
                      Open Postman Collection
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {docsLoading
                    ? "Checking docs endpoint..."
                    : docsAvailable
                      ? "Docs endpoint is reachable."
                      : "Docs endpoint is not reachable from this browser."}{" "}
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    Open docs endpoint
                  </a>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Create API Key Dialog */}
        <CreateAPIKeyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

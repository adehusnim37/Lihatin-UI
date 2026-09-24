"use client";

import { Key, Plus, BookOpen, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { APIDocumentation } from "@/components/api-docs/api-documentation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CreateAPIKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { APIKeyList } from "@/components/api-keys/api-key-list";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const POSTMAN_COLLECTION_URL =
  process.env.NEXT_PUBLIC_POSTMAN_COLLECTION_URL ||
  "https://www.postman.com/adehusnim/workspace/lihatin/collection/13183823-585cf118-ae9e-4e0d-af3c-f599d1caaf38?action=share&creator=13183823";

export default function ApiIntegrationsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
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
          <Tabs defaultValue="api-keys" className="space-y-6 w-full min-w-0">
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

                  <div
                    role="note"
                    className="flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                      <Info className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-semibold">Account API request limits</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="border-sky-500/30 bg-background/70 text-sky-700 dark:text-sky-300"
                        >
                          Standard · 50/hour
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-background/70 text-amber-700 dark:text-amber-300"
                        >
                          Premium · 100/10 min
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        All API keys in your account share this rate limit. Each
                        key can also have its own optional total-use cap.
                      </p>
                    </div>
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
            <TabsContent value="documentation" className="min-w-0 space-y-6">
              <APIDocumentation />
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

"use client";

import {
  Key,
  Webhook,
  Code2,
  Zap,
  Copy,
  Eye,
  EyeOff,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ApiIntegrationsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const demoApiKey = "lht_sk_************************";

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
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              API & Integrations
            </h1>
            <p className="text-muted-foreground">
              Connect Lihatin with your favorite tools and automate your
              workflow.
            </p>
          </div>

          {/* API Key Section */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Key className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-semibold">API Keys</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your API access tokens
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Generate New Key
              </button>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Production Key</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {showApiKey ? "lht_sk_1234567890abcdef" : demoApiKey}
                    </code>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Created: --
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Keep your API keys secure. Never share them in public
              repositories or client-side code.
            </p>
          </div>

          {/* Webhooks Section */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Webhook className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-semibold">Webhooks</h2>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time notifications for link events
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors">
                <Plus className="h-4 w-4" />
                Add Webhook
              </button>
            </div>

            <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
              <Webhook className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No webhooks configured</p>
              <p className="text-sm text-muted-foreground">
                Add a webhook to receive event notifications
              </p>
            </div>
          </div>

          {/* Integrations Section */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="font-semibold">Integrations</h2>
                <p className="text-sm text-muted-foreground">
                  Connect with third-party services
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "Zapier",
                  desc: "Automate workflows",
                  status: "available",
                },
                { name: "Slack", desc: "Get notifications", status: "coming" },
                {
                  name: "Google Analytics",
                  desc: "Track conversions",
                  status: "coming",
                },
                { name: "Discord", desc: "Bot integration", status: "coming" },
                { name: "Notion", desc: "Sync links", status: "coming" },
                {
                  name: "Custom Webhook",
                  desc: "Any HTTP endpoint",
                  status: "available",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between hover:border-primary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.desc}
                    </p>
                  </div>
                  {integration.status === "available" ? (
                    <button className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      Connect
                    </button>
                  ) : (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* API Documentation Link */}
          <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code2 className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">API Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to integrate Lihatin into your applications
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-background transition-colors">
                View Docs
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <p className="text-center text-sm text-muted-foreground">
            🚧 Full API & Integration features coming soon
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

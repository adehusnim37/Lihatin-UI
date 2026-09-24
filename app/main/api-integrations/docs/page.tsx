import type { Metadata } from "next";
import Link from "next/link";
import { APIDocumentation } from "@/components/api-docs/api-documentation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "API Documentation | Lihatin" };

export default function APIDocsPage() {
  return <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
    <AppSidebar />
    <SidebarInset className="min-w-0">
      <SiteHeader />
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm text-muted-foreground">Developer reference · v1</p><h1 className="text-3xl font-bold">Dokumentasi API</h1><p className="mt-2 text-muted-foreground">Panduan API key dan integrasi short link, langkah demi langkah.</p></div>
          <Button asChild variant="outline"><Link href="/main/api-integrations">Kelola API Keys</Link></Button>
        </header>
        <APIDocumentation />
      </div>
    </SidebarInset>
  </SidebarProvider>;
}

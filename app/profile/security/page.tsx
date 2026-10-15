"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SecuritySettings } from "@/components/profile/security-settings";

export default function SecurityPage() {
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
        <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <header className="space-y-2">
            <Link
              href="/profile/me?tab=security"
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Profile
            </Link>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Sign-in &amp; Security
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Choose how you sign in, protect your account, and keep a way back in.
              </p>
            </div>
          </header>
          <Suspense
            fallback={
              <p role="status" className="text-sm text-muted-foreground">
                Loading security settings…
              </p>
            }
          >
            <SecuritySettings />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

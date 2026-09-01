"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowRight, IconKey, IconLifebuoy } from "@tabler/icons-react";

import { PublicSupportInfoCard } from "@/components/support/public-support-info";
import { PublicSupportShell } from "@/components/support/public-support-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPublicSupportConversationURL } from "@/lib/support/public-access";
import { getSupportReasonFromSearch } from "@/lib/support/public-support";

function SupportChooserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) {
      return;
    }

    const ticket = (searchParams.get("ticket") || "").trim().toUpperCase();
    const email = (searchParams.get("email") || "").trim();
    const code = (searchParams.get("code") || "").trim();
    const reason = getSupportReasonFromSearch(searchParams.get("reason"));

    if (ticket && email && code) {
      redirectedRef.current = true;
      router.replace(buildPublicSupportConversationURL(ticket, email, code));
      return;
    }

    if (ticket || email || code) {
      redirectedRef.current = true;
      const params = new URLSearchParams();
      if (ticket) params.set("ticket", ticket);
      if (email) params.set("email", email);
      if (code) params.set("code", code);
      router.replace(`/support/access${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }

    if (reason) {
      redirectedRef.current = true;
      const params = new URLSearchParams({ reason });
      if (email) {
        params.set("email", email);
      }
      router.replace(`/support/new?${params.toString()}`);
    }
  }, [router, searchParams]);

  return (
    <PublicSupportShell
      title="How can we help?"
      description="Create a new request or securely continue an existing support conversation."
      centered
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gap-4 shadow-none transition-colors hover:border-foreground/20">
            <CardHeader className="gap-3 px-5">
              <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-foreground">
                <IconLifebuoy className="size-5" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg">Submit a new ticket</CardTitle>
                <CardDescription className="leading-6">
                  Report an account, billing, or product issue. No sign-in required.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto px-5">
              <Button asChild size="sm">
                <Link href="/support/new">
                  Create ticket
                  <IconArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="gap-4 shadow-none transition-colors hover:border-foreground/20">
            <CardHeader className="gap-3 px-5">
              <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-foreground">
                <IconKey className="size-5" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg">Open an existing ticket</CardTitle>
                <CardDescription className="leading-6">
                  Check status and continue a secure conversation using your ticket details.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-auto px-5">
              <Button asChild variant="outline" size="sm">
                <Link href="/support/access">
                  Track ticket
                  <IconArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <PublicSupportInfoCard />
      </div>
    </PublicSupportShell>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Loading support page...
        </div>
      }
    >
      <SupportChooserContent />
    </Suspense>
  );
}

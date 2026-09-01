import { Suspense } from "react";
import { PublicSupportAccessCard } from "@/components/support/public-support-access-card";
import { PublicSupportShell } from "@/components/support/public-support-shell";

export default function SupportAccessPage() {
  return (
    <PublicSupportShell
      title="Open an existing ticket"
      description="Find your request, verify access, and continue the conversation."
      centered
    >
      <div className="mx-auto w-full max-w-xl">
        <div className="min-w-0">
          <Suspense
            fallback={
              <div className="flex min-h-32 items-center justify-center rounded-xl border bg-background text-sm text-muted-foreground">
                Loading form…
              </div>
            }
          >
            <PublicSupportAccessCard />
          </Suspense>
        </div>
      </div>
    </PublicSupportShell>
  );
}

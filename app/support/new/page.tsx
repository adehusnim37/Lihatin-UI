import { Suspense } from "react";
import { PublicSupportShell } from "@/components/support/public-support-shell";
import { PublicSupportSubmitCard } from "@/components/support/public-support-submit-card";

export default function SupportNewPage() {
  return (
    <PublicSupportShell
      title="Submit a support ticket"
      description="Tell us what happened and we'll follow up by email."
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
            <PublicSupportSubmitCard />
          </Suspense>
        </div>
      </div>
    </PublicSupportShell>
  );
}

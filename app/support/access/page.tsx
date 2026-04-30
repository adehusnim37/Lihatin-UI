import { PublicSupportAccessCard } from "@/components/support/public-support-access-card";
import { PublicSupportInfoCard } from "@/components/support/public-support-info";
import { PublicSupportShell } from "@/components/support/public-support-shell";

export default function SupportAccessPage() {
  return (
    <PublicSupportShell
      title="Open Existing Ticket"
      description="Track support ticket, verify access, then continue to secure conversation."
    >
      <div className="space-y-6">
        <PublicSupportAccessCard />
        <PublicSupportInfoCard
          introLabel="Existing Request"
          introTitle="Before you reopen ticket"
          introDescription="Use existing ticket flow when support already emailed you ticket code and you want to continue secure conversation."
          introPoints={[
            "Check ticket code and email first before requesting OTP.",
            "Access code from support email is fastest way to reopen thread.",
            "Use OTP only if secure email link is not available anymore.",
          ]}
          ctaLabel="Submit New Ticket"
          ctaHref="/support/new"
          note="For safety, OTP verification only works for email attached to ticket."
          className="xl:min-h-0"
        />
      </div>
    </PublicSupportShell>
  );
}

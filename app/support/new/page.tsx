import { PublicSupportInfoCard } from "@/components/support/public-support-info";
import { PublicSupportShell } from "@/components/support/public-support-shell";
import { PublicSupportSubmitCard } from "@/components/support/public-support-submit-card";

export default function SupportNewPage() {
  return (
    <PublicSupportShell
      title="Submit Support Ticket"
      description="Create new support request. No login required."
    >
      <div className="space-y-6">
        <PublicSupportSubmitCard />
        <PublicSupportInfoCard
          introLabel="New Request"
          introTitle="Before you submit"
          introDescription="Use this form for new problems, bug reports, billing issues, or account help. If you already have ticket code, open existing ticket instead."
          introPoints={[
            "Explain problem clearly, including exact error message if you have one.",
            "Use same email you can access, because updates and secure links go there.",
            "Have ticket code already? Continue in existing ticket flow instead of creating duplicate request.",
          ]}
          ctaLabel="Open Existing Ticket"
          ctaHref="/support/access"
          note="Secure ticket links and OTP are sent only to ticket email address."
          className="xl:min-h-0"
        />
      </div>
    </PublicSupportShell>
  );
}

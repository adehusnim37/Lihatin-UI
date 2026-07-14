import Link from "next/link";
import { IconArrowLeft, IconScale } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        
        {/* Navigation */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <IconArrowLeft className="mr-2 size-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Document Card */}
        <div className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="mb-10 flex items-center gap-4 border-b pb-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <IconScale className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Terms of Service</h1>
              <p className="mt-1 text-sm text-muted-foreground">Last updated: May 12, 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <section>
              <p className="text-foreground font-medium mb-4">
                Welcome to Lihat.in. By accessing and using our service, you agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Description of Service</h2>
              <p>
                Lihat.in provides URL shortening, link management, and analytics services. We allow users to create shortened URLs, track clicks, and manage links for personal or commercial use.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. User Conduct and Restrictions</h2>
              <p className="mb-3">You agree not to use the Service to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create short links to any websites containing malware, phishing, or spam.</li>
                <li>Link to content that is illegal, abusive, harassing, or violates any third party&apos;s rights.</li>
                <li>Attempt to bypass any limitations or security measures of the Service.</li>
                <li>Use the Service for any automated scraping or mass link creation without explicit permission or API access.</li>
              </ul>
              <p className="mt-3">We reserve the right to disable any link or terminate any account that violates these terms without prior notice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Account Registration</h2>
              <p>
                To access advanced features, you may need to register for an account. You must provide accurate and complete information and keep your account credentials secure. You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Data and Analytics</h2>
              <p>
                While we strive to provide accurate analytics and link tracking data, we do not guarantee the absolute accuracy or completeness of the data provided through our Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Limitation of Liability &amp; Modifications</h2>
              <p>
                Lihat.in shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your access to or use of the Service. We reserve the right to modify or discontinue the Service at any time with or without notice.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for how we handle your data? Read our <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>

      </div>
    </div>
  );
}

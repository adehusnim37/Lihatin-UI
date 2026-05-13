import Link from "next/link";
import { IconArrowLeft, IconShieldCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        
        {/* Navigation */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Document Card */}
        <div className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm">
          {/* Header */}
          <div className="mb-10 flex items-center gap-4 border-b pb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <IconShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
              <p className="mt-1 text-sm text-muted-foreground">Last updated: May 12, 2026</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
            <section>
              <p className="text-foreground font-medium mb-4">
                At Lihat.in, we take your privacy seriously. This policy explains what information we collect, why we collect it, and how we protect it when you use our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground">Account Information</h3>
                  <p>When you register, we collect your email address, name, and password. This is required to provide secure access to your link management dashboard.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Link Tracking Data</h3>
                  <p className="mb-2">When users click your short links, we collect data to provide you with analytics. This includes:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>IP addresses (used to determine general geolocation)</li>
                    <li>Browser type and user agent</li>
                    <li>Device information (desktop, mobile, OS)</li>
                    <li>Referring websites and timestamps</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide, operate, and maintain our Service and dashboards.</li>
                <li>To generate click analytics and detailed reports for the links you manage.</li>
                <li>To find, prevent, and address fraud, spam, and technical issues.</li>
                <li>To communicate with you for customer support and important service updates.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Data Sharing and Disclosure</h2>
              <p>
                We <strong>never sell or rent</strong> your personal information. We only share information with trusted third-party Service Providers (such as our hosting infrastructure on Cloudflare or email delivery services) who need access to perform tasks on our behalf. We may also disclose information when strictly required by law or to protect our legal rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Security &amp; Protection</h2>
              <p>
                We strive to use commercially acceptable means to protect your personal information and the data collected through your links. We utilize modern encryption and secure server infrastructures. However, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at the top.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Want to know the rules of using our service? Read our <Link href="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">Terms of Service</Link>.
          </p>
        </div>

      </div>
    </div>
  );
}

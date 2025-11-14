"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
  children: React.ReactNode; // Trigger element (text/button)
}

export function TermsDialog({ children }: TermsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="underline text-foreground hover:text-primary transition-colors">
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
          <DialogDescription>
            Last updated: November 14, 2025
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using Lihatin, you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to these terms, please
                do not use our service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Use License</h3>
              <p className="text-muted-foreground">
                Permission is granted to temporarily use Lihatin for personal, non-commercial
                transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User Account</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account and
                password. You agree to accept responsibility for all activities that occur
                under your account.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Privacy Policy</h3>
              <p className="text-muted-foreground">
                Your use of Lihatin is also governed by our Privacy Policy. Please review
                our Privacy Policy, which also governs the site and informs users of our
                data collection practices.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Prohibited Uses</h3>
              <p className="text-muted-foreground mb-2">
                You may not use Lihatin:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>For any unlawful purpose</li>
                <li>To solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, or state regulations</li>
                <li>To infringe upon intellectual property rights</li>
                <li>To transmit any malicious code or viruses</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                Lihatin shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users
                of any changes by updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at
                support@lihatin.com
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
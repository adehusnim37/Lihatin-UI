"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function EnterPasscodePage() {
  const params = useParams<{ short_code: string }>();
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length !== 6) return;

    setIsSubmitting(true);
    // Redirect to the route handler with passcode
    router.push(`/r/${params.short_code}/${passcode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Protected Link
          </h1>
          <p className="text-muted-foreground text-sm">
            This link requires a 6-digit passcode to access.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            /{params.short_code}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="passcode" className="text-center block">
              Passcode
            </Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={passcode}
                onChange={(value) => setPasscode(value)}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={passcode.length !== 6 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Access Link"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don&apos;t have the passcode? Contact the link owner.
        </p>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconShieldOff,
  IconAlertTriangle,
  IconLock,
  IconKey,
} from "@tabler/icons-react";
import { useState, useCallback } from "react";
import { disableTOTP } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DisableTOTPModalProps {
  onDisableComplete?: () => void;
}

export default function DisableTOTPModal({
  onDisableComplete,
}: DisableTOTPModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"password" | "totp">("password");

  const handleDisable = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await disableTOTP(
        method === "password" ? password : undefined,
        method === "totp" ? totpCode : undefined
      );

      if (response.success) {
        toast.success("2FA Disabled", {
          description: "Two-factor authentication has been disabled.",
        });

        setIsOpen(false);
        if (onDisableComplete) {
          onDisableComplete();
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to disable 2FA. Please try again."
      );
      toast.error("Failed to Disable", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  }, [method, password, totpCode, onDisableComplete]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state
      setPassword("");
      setTotpCode("");
      setError("");
      setMethod("password");
    }
  };

  const canSubmit = method === "password" ? password.length >= 8 : totpCode.length === 6;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconShieldOff className="h-4 w-4 mr-2" />
          Disable 2FA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconShieldOff className="h-5 w-5 text-orange-600" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Confirm your identity to disable 2FA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Security Warning
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Disabling 2FA will make your account less secure. You can always
                  re-enable it later.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Method */}
          <Tabs value={method} onValueChange={(v) => setMethod(v as "password" | "totp")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">
                <IconLock className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>
              <TabsTrigger value="totp">
                <IconKey className="h-4 w-4 mr-2" />
                2FA Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter Your Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Confirm your identity by entering your account password.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="totp" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totp-code">Enter 2FA Code</Label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setTotpCode(value);
                    setError("");
                  }}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? "Disabling..." : "Disable 2FA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

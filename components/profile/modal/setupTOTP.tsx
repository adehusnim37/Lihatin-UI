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
  IconShield,
  IconQrcode,
  IconKey,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconLock,
} from "@tabler/icons-react";
import { useState, useCallback, useEffect } from "react";
import { setupTOTP, verifyTOTP, TOTPSetupResponse } from "@/lib/api/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import QRCode from "qrcode";

interface SetupTOTPModalProps {
  onSetupComplete?: () => void;
}

export default function SetupTOTPModal({
  onSetupComplete,
}: SetupTOTPModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"init" | "scan" | "verify" | "complete">(
    "init"
  );
  const [totpData, setTotpData] = useState<TOTPSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  // Generate QR code as data URL when totpData changes
  useEffect(() => {
    if (totpData?.qr_code_url) {
      QRCode.toDataURL(totpData.qr_code_url, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url: string) => setQrCodeDataURL(url))
        .catch((err: Error) => {
          console.error("Failed to generate QR code:", err);
          toast.error("QR Code Error", {
            description: "Failed to generate QR code. Please use manual setup.",
          });
        });
    }
  }, [totpData]);

  const handleSetup = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await setupTOTP();
      if (response.success && response.data) {
        setTotpData(response.data);
        setStep("scan");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to setup 2FA. Please try again."
      );
      toast.error("Setup Failed", {
        description: err instanceof Error ? err.message : "Failed to setup 2FA",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await verifyTOTP(verificationCode);
      if (response.success) {
        setStep("complete");
        toast.success("2FA Enabled", {
          description: "Two-factor authentication has been enabled successfully.",
        });
        
        setTimeout(() => {
          setIsOpen(false);
          if (onSetupComplete) {
            onSetupComplete();
          }
        }, 2000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid code. Please try again."
      );
      toast.error("Verification Failed", {
        description: err instanceof Error ? err.message : "Invalid code",
      });
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode, onSetupComplete]);

  const copyToClipboard = async (text: string, type: "secret" | "codes") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
      }
      toast.success("Copied!", {
        description: type === "secret" ? "Secret key copied" : "Recovery codes copied",
      });
    } catch (err) {
      toast.error("Failed to copy", {
        description: "Please copy manually",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state
      setStep("init");
      setTotpData(null);
      setVerificationCode("");
      setError("");
      setCopiedSecret(false);
      setCopiedCodes(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconShield className="h-4 w-4 mr-2" />
          Enable 2FA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            Setup Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Introduction */}
          {step === "init" && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                  <IconLock className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure Your Account</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Two-factor authentication adds an extra layer of security by
                    requiring a code from your authenticator app.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">You&apos;ll need:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Google Authenticator, Authy, or similar app</li>
                  <li>• Your phone or tablet</li>
                  <li>• A few minutes to complete setup</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Scan QR Code */}
          {step === "scan" && totpData && (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app:
                </p>
                
                <div className="flex justify-center w-full">
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    {qrCodeDataURL ? (
                      <img
                        src={qrCodeDataURL}
                        alt="TOTP QR Code"
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    ) : (
                      <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
                        <IconQrcode className="h-20 w-20 text-gray-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Can&apos;t scan? Enter this code manually:
                  </p>
                  <div className="flex items-center gap-2 w-full">
                    <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all overflow-x-auto">
                      {totpData.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(totpData.secret, "secret")}
                      className="shrink-0"
                    >
                      {copiedSecret ? (
                        <IconCheck className="h-4 w-4" />
                      ) : (
                        <IconCopy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recovery Codes */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <IconKey className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Save Your Recovery Codes
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Store these codes in a safe place. You can use them to access
                      your account if you lose your phone.
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="bg-white p-3 rounded border border-amber-200 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs text-center">
                      {totpData.recovery_codes.map((code, index) => (
                        <div key={index} className="text-gray-700 break-all">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() =>
                      copyToClipboard(
                        totpData.recovery_codes.join("\n"),
                        "codes"
                      )
                    }
                  >
                    {copiedCodes ? (
                      <>
                        <IconCheck className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <IconCopy className="h-4 w-4 mr-2" />
                        Copy All Codes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Verify Code */}
          {step === "verify" && (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app:
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setVerificationCode(value);
                    setError("");
                  }}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <IconAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <div className="space-y-4 py-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                  <IconCheck className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">All Set!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Two-factor authentication has been enabled successfully.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "init" && (
            <Button onClick={handleSetup} disabled={isLoading}>
              {isLoading ? "Setting up..." : "Get Started"}
            </Button>
          )}

          {step === "scan" && (
            <Button onClick={() => setStep("verify")}>
              I&apos;ve Scanned the QR Code
            </Button>
          )}

          {step === "verify" && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setStep("scan")}>
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          )}

          {step === "complete" && (
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

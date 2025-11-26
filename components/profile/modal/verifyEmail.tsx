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
  IconMail,
  IconMailCheck,
  IconClock,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconSparkles,
  IconArrowForwardUp,
  IconX,
} from "@tabler/icons-react";
import {
  sendVerificationEmail,
  checkEmailVerificationStatus,
} from "@/lib/api/auth";
import { useState, useEffect, useCallback, useRef } from "react";

interface VerifyEmailModalProps {
  email?: string;
  onVerificationSent?: () => void;
  onVerified?: () => void; // ✅ Callback when email is verified
}

export default function VerifyEmailModal({
  email,
  onVerified,
}: VerifyEmailModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "verified"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isWaitingVerification, setIsWaitingVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ✅ Polling effect to check verification status
  useEffect(() => {
    if (!isWaitingVerification || isVerified) return;

    const pollInterval = setInterval(async () => {
      try {
        const isEmailVerified = await checkEmailVerificationStatus();
        if (isEmailVerified) {
          setIsVerified(true);
          setIsWaitingVerification(false);
          setStatus("verified");
          setCountdown(0);
        }
      } catch (error) {
        console.error("Failed to check verification status:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isWaitingVerification, isVerified]);

  // ✅ Separate effect to call onVerified when status changes to verified
  useEffect(() => {
    if (status === "verified" && onVerified) {
      // Add small delay to ensure UI has updated and user sees the success message
      const timer = setTimeout(() => {
        onVerified();
      }, 3500); // 3500ms delay to show success animation

      return () => clearTimeout(timer);
    }
  }, [status, onVerified]);

  const handleSendVerification = useCallback(async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Call the API to send verification email
      await sendVerificationEmail();

      setStatus("success");
      setSuccessMessage(
        "Verification email sent! Please check your inbox and spam folder."
      );
      setCountdown(180); // 180 seconds cooldown
      setIsWaitingVerification(true); // ✅ Start polling
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send verification email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [countdown]);

  const handleOpenChange = (open: boolean) => {
    // ✅ Lock dialog if waiting for verification
    if (!open && isWaitingVerification && !isVerified) {
      return; // Prevent closing
    }

    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setStatus("idle");
      setErrorMessage("");
      setSuccessMessage("");
      setIsWaitingVerification(false);
      setIsVerified(false);
      setCountdown(0);
    }
  };

  // Circular progress for countdown
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (countdown / 60) * circumference;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Verify Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            {email ? (
              <>
                Send a verification link to <strong>{email}</strong>
              </>
            ) : (
              "Send a verification link to your registered email address"
            )}
          </DialogDescription>
        </DialogHeader>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes scaleIn {
            from {
              transform: scale(0);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          @keyframes bounce {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @keyframes confetti {
            0% {
              transform: scale(0) rotate(0deg);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: scale(1.5) rotate(360deg);
              opacity: 0;
            }
          }
          .animate-scale-in {
            animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .animate-pulse-slow {
            animation: pulse 2s ease-in-out infinite;
          }
          .animate-slide-up {
            animation: slideUp 0.4s ease-out;
          }
          .animate-rotate {
            animation: rotate 1s linear infinite;
          }
          .animate-bounce-slow {
            animation: bounce 2s ease-in-out infinite;
          }
          .shimmer {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.4) 50%,
              transparent 100%
            );
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          .confetti-piece {
            position: absolute;
            width: 10px;
            height: 10px;
            animation: confetti 1s ease-out forwards;
          }
        `}</style>

        <div className="py-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Animated Icon/Status Display */}
            <div className="relative">
              {status === "idle" && countdown === 0 && (
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center animate-scale-in relative overflow-hidden">
                  <div className="absolute inset-0 shimmer" />
                  <IconMail className="h-12 w-12 text-[#70c5df] relative z-10" />
                </div>
              )}

              {status === "success" && (
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center animate-scale-in">
                  <IconMailCheck className="h-12 w-12 text-green-600" />
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
                </div>
              )}

              {status === "verified" && (
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center animate-scale-in">
                    <IconCheck className="h-12 w-12 text-emerald-600 animate-bounce-slow" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-75" />
                  </div>
                  {/* Confetti effect */}
                  <div
                    className="confetti-piece bg-emerald-500 top-0 left-0"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="confetti-piece bg-green-500 top-0 right-0"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="confetti-piece bg-teal-500 bottom-0 left-0"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="confetti-piece bg-emerald-400 bottom-0 right-0"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <div
                    className="confetti-piece bg-green-400 top-1/2 left-1/2"
                    style={{ animationDelay: "0.15s" }}
                  />
                </div>
              )}

              {status === "error" && (
                <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center animate-scale-in">
                  <IconAlertCircle className="h-12 w-12 text-red-600 animate-pulse-slow" />
                </div>
              )}

              {countdown > 0 && (
                <div className="relative w-24 h-24 animate-scale-in pt-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200"
                    />
                    {/* Progress circle with transition */}
                    <circle
                      cx="48"
                      cy="48"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="text-[#70c5df] transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pt-8">
                    <div
                      key={countdown}
                      className="text-2xl font-bold text-black-600 animate-scale-in"
                    >
                      {countdown}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {status === "verified" && (
              <div className="w-full animate-slide-up">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                  <IconCheck className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">
                      ✨ Email Verified Successfully!
                    </p>
                    <p className="text-emerald-700 mt-1">
                      Your email has been verified. You can now close this
                      dialog.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && status !== "verified" && (
              <div className="w-full animate-slide-up">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  <IconCheck className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Email Sent!</p>
                    <p className="text-green-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="w-full animate-slide-up">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  <IconAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Failed to Send</p>
                    <p className="text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {isWaitingVerification && !isVerified && (
              <div className="w-full text-center animate-slide-up">
                <p className="text-sm text-amber-600 flex items-center justify-center gap-2 font-medium">
                  <IconClock className="h-4 w-4 animate-pulse-slow" />
                  Waiting for verification... Please check your email.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This dialog will automatically update once verified
                </p>
              </div>
            )}

            {countdown > 0 && !errorMessage && !isWaitingVerification && (
              <div className="w-full text-center animate-slide-up">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <IconClock className="h-4 w-4" />
                  You can resend the email in {countdown} second
                  {countdown !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Info text */}
            {status === "idle" && countdown === 0 && (
              <div className="text-center space-y-2 animate-slide-up">
                <p className="text-sm text-muted-foreground">
                  Click the button below to receive a verification email.
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <IconSparkles className="h-3 w-3 text-[#70c5df]" />
                  The link will be valid for 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mx-auto">
          {status === "verified" ? (
            <Button
              onClick={() => handleOpenChange(false)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <IconCheck className="h-4 w-4" />
              Close
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSendVerification}
                disabled={isLoading || countdown > 0}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <IconRefresh className="h-4 w-4 animate-rotate" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <IconClock className="h-4 w-4" />
                     {`Wait ${countdown}s`}
                  </>
                ) : isWaitingVerification ? (
                  <>
                    <IconArrowForwardUp className="h-4 w-4" />
                    Resend Verification Email
                  </>
                ) : (
                  <>
                    <IconMail className="h-4 w-4" />
                    Send Verification Email
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

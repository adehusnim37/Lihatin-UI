"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useChangeEmailMutation,
  useEmailChangeEligibilityQuery,
} from "@/lib/hooks/queries/useProfileQuery";
import { toast } from "sonner";

interface ChangeEmailModalProps {
  currentEmail?: string;
  onEmailChanged?: () => void;
}

export default function ChangeEmailModal({
  currentEmail,
  onEmailChanged,
}: ChangeEmailModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {
    data: eligibilityResponse,
    isLoading: isCheckingEligibility,
    refetch: refetchEligibility,
  } = useEmailChangeEligibilityQuery(isOpen);
  const changeEmailMutation = useChangeEmailMutation();
  const eligibility = eligibilityResponse?.data ?? null;
  const isSubmitting = changeEmailMutation.isPending;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setErrorMessage("");
      setSuccessMessage("");
      void refetchEligibility();
      return;
    }

    if (!open) {
      setNewEmail("");
      setErrorMessage("");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedCurrent = currentEmail?.trim().toLowerCase();
    const normalizedNew = newEmail.trim().toLowerCase();

    if (!normalizedNew) {
      setErrorMessage("New email is required.");
      return;
    }

    if (normalizedCurrent && normalizedCurrent === normalizedNew) {
      setErrorMessage("New email must be different from current email.");
      return;
    }

    if (!eligibility?.eligible) {
      setErrorMessage(
        eligibility?.message ||
          "You are not eligible to change your email at this time."
      );
      return;
    }

    try {
      const response = await changeEmailMutation.mutateAsync({
        new_email: normalizedNew,
      });
      setSuccessMessage(response.message || "Email change requested.");
      toast.success("Email change requested", {
        description:
          "Check your new inbox and verify the email to complete the change.",
      });
      onEmailChanged?.();
      setTimeout(() => setIsOpen(false), 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to change email."
      );
    }
  };

  const isEligible = eligibility?.eligible ?? false;
  const disableSubmit = isCheckingEligibility || isSubmitting || !isEligible;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              Update your email address and verify it from the new inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input value={currentEmail || "-"} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">New Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                disabled={isSubmitting}
              />
            </div>

            <div
              className={`rounded-md border p-3 text-sm ${
                isEligible
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {isCheckingEligibility && "Checking eligibility..."}
              {!isCheckingEligibility && eligibility?.eligible && (
                <span>{eligibility.message || "You can change your email."}</span>
              )}
              {!isCheckingEligibility && eligibility && !eligibility.eligible && (
                <span>
                  {eligibility.message ||
                    "You cannot change your email right now."}
                  {typeof eligibility.days_remaining === "number" &&
                  eligibility.days_remaining > 0
                    ? ` (${eligibility.days_remaining} day(s) remaining)`
                    : ""}
                </span>
              )}
              {!isCheckingEligibility && !eligibility && (
                <span>Eligibility data is unavailable.</span>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {isSubmitting ? "Submitting..." : "Submit Change"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  useChangeUsernameMutation,
  useUsernameChangeEligibilityQuery,
} from "@/lib/hooks/queries/useProfileQuery";
import { toast } from "sonner";

interface ChangeUsernameModalProps {
  currentUsername?: string;
  onUsernameChanged?: () => void;
}

export default function ChangeUsernameModal({
  currentUsername,
  onUsernameChanged,
}: ChangeUsernameModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {
    data: eligibilityResponse,
    isLoading: isCheckingEligibility,
    isError: isEligibilityError,
    error: eligibilityError,
    refetch: refetchEligibility,
  } = useUsernameChangeEligibilityQuery(isOpen);
  const changeUsernameMutation = useChangeUsernameMutation();
  const isSubmitting = changeUsernameMutation.isPending;
  const isEligible = Boolean(eligibilityResponse?.success) && !isEligibilityError;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setErrorMessage("");
      setSuccessMessage("");
      void refetchEligibility();
      return;
    }

    setNewUsername("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const current = currentUsername?.trim();
    const normalized = newUsername.trim();

    if (!normalized) {
      setErrorMessage("New username is required.");
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(normalized)) {
      setErrorMessage("Username must contain only letters and numbers.");
      return;
    }

    if (normalized.length < 3 || normalized.length > 30) {
      setErrorMessage("Username must be between 3 and 30 characters.");
      return;
    }

    if (current && current === normalized) {
      setErrorMessage("New username must be different from current username.");
      return;
    }

    if (!isEligible) {
      setErrorMessage(
        eligibilityError instanceof Error
          ? eligibilityError.message
          : "You are not eligible to change username at this time."
      );
      return;
    }

    try {
      const response = await changeUsernameMutation.mutateAsync({
        new_username: normalized,
      });

      setSuccessMessage(response.message || "Username changed successfully.");
      toast.success("Username changed", {
        description: "Your username has been updated successfully.",
      });
      onUsernameChanged?.();
      setTimeout(() => setIsOpen(false), 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to change username."
      );
    }
  };

  const disableSubmit = isCheckingEligibility || isSubmitting || !isEligible;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-40 justify-center">
          Change Username
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              You can only change your username once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Username</Label>
              <Input value={currentUsername || "-"} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
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
              {!isCheckingEligibility && isEligible && (
                <span>
                  {eligibilityResponse?.message ||
                    "You can change your username now."}
                </span>
              )}
              {!isCheckingEligibility && !isEligible && (
                <span>
                  {eligibilityError instanceof Error
                    ? eligibilityError.message
                    : "You cannot change your username right now."}
                </span>
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

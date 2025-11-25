"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordIndicator, {
  calculatePasswordStrength,
} from "@/components/forms/input/PasswordIndicator";
import { useState } from "react";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { changePassword } from "@/lib/api/auth";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordVisibility {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

interface ChangePasswordDialogProps {
  onPasswordChanged?: () => void;
}

export default function ChangePasswordDialog({
  onPasswordChanged,
}: ChangePasswordDialogProps = {}) {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const togglePasswordVisibility = (field: keyof PasswordVisibility) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      const strength = calculatePasswordStrength(formData.newPassword, 8);
      if (strength.score < 2) {
        newErrors.newPassword =
          "Password is too weak. Please choose a stronger password.";
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Call the API to change password
      await changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      setSuccessMessage("Your password has been changed successfully.");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => {
        setSuccessMessage("");
        setIsOpen(false);
        if (onPasswordChanged) {
          onPasswordChanged(); // 👈 Sekarang Parent me-load setelah sukses ditampilkan
        }
      }, 3000); // Close dialog after 3 seconds
    } catch (error) {
      // Handle specific error messages from the API
      let errorMsg = "Failed to change password. Please try again.";

      if (error instanceof Error) {
        // Check for specific error messages from backend
        if (
          error.message.includes("Invalid current password") ||
          error.message.includes("incorrect")
        ) {
          errorMsg = "Current password is incorrect. Please try again.";
        } else if (
          error.message.includes("Validation failed") ||
          error.message.includes("too weak")
        ) {
          errorMsg = "New password does not meet security requirements.";
        } else if (error.message.includes("same password")) {
          errorMsg =
            "New password must be different from your current password.";
        } else {
          errorMsg = error.message;
        }
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      setSuccessMessage("");
      setErrorMessage("");
      setShowPassword({ current: false, new: false, confirm: false });
    }
  };

  const isPasswordStrong =
    calculatePasswordStrength(formData.newPassword, 8).score >= 2;
  const passwordsMatch =
    formData.newPassword && formData.newPassword === formData.confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconLock className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new strong password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                <IconCheck className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <IconAlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  placeholder="Enter your current password"
                  className={errors.currentPassword ? "border-red-500" : ""}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword.current ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                  placeholder="Enter your new password"
                  className={errors.newPassword ? "border-red-500" : ""}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword.new ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-500">{errors.newPassword}</p>
              )}
              <PasswordIndicator
                password={formData.newPassword}
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm your new password"
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword.confirm ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  ✓ Passwords match
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            {successMessage ? (
              // 👈 Tampilkan tombol Close jika sukses
              <DialogClose asChild>
                <Button type="button" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </DialogClose>
            ) : (
              // 👈 Tampilkan tombol Submit/Cancel jika sedang mengisi form
              <>
                <DialogClose asChild>
                  <Button variant="outline" type="button" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit" // Biarkan type="submit" untuk memicu handleSubmit
                  disabled={
                    isLoading ||
                    !formData.currentPassword ||
                    !formData.newPassword ||
                    !formData.confirmPassword ||
                    !isPasswordStrong ||
                    !passwordsMatch
                  }
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

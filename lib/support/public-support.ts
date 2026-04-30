import type { SupportCategory } from "@/lib/api/support";
import type { AuthSupportReason } from "@/lib/auth-support";

export type SupportPreset = {
  category: SupportCategory;
  subject: string;
  descriptionHint: string;
};

export const reasonPresetMap: Record<AuthSupportReason, SupportPreset> = {
  ACCOUNT_LOCKED: {
    category: "account_locked",
    subject: "My account is locked",
    descriptionHint:
      "I cannot log in because my account is temporarily locked. Please help me review access.",
  },
  USER_LOCKED: {
    category: "account_locked",
    subject: "My account has been locked by admin",
    descriptionHint:
      "I believe my account was manually locked. Please help verify account status.",
  },
  ACCOUNT_DEACTIVATED: {
    category: "account_deactivated",
    subject: "My account has been deactivated",
    descriptionHint:
      "I cannot log in because my account is deactivated. Please assist reactivation process.",
  },
  EMAIL_NOT_VERIFIED: {
    category: "email_verification",
    subject: "I can't verify my email",
    descriptionHint:
      "I cannot complete login because my email is not verified. Please resend verification guidance.",
  },
};

export const categoryOptions: { value: SupportCategory; label: string }[] = [
  { value: "account_locked", label: "Account Locked" },
  { value: "account_deactivated", label: "Account Deactivated" },
  { value: "email_verification", label: "Email Verification" },
  { value: "lost_2fa", label: "Lost 2FA Device" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
];

export const supportCategoryLabelMap: Record<SupportCategory, string> = {
  account_locked: "Account Locked",
  account_deactivated: "Account Deactivated",
  email_verification: "Email Verification",
  lost_2fa: "Lost 2FA Device",
  billing: "Billing",
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  other: "Other",
};

export function getSupportReasonFromSearch(raw: string | null): AuthSupportReason | null {
  const normalized = (raw || "").trim().toUpperCase();
  if (
    normalized === "ACCOUNT_LOCKED" ||
    normalized === "USER_LOCKED" ||
    normalized === "ACCOUNT_DEACTIVATED" ||
    normalized === "EMAIL_NOT_VERIFIED"
  ) {
    return normalized as AuthSupportReason;
  }
  return null;
}

export function formatSupportDateTime(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleString();
}

export function formatSupportBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

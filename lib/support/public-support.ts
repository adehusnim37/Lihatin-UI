import type { SupportCategory } from "@/lib/api/support";
import type { AuthSupportReason, AuthSupportSource } from "@/lib/auth-support";

export type SupportPreset = {
  category: SupportCategory;
  subject: string;
  descriptionHint: string;
};

type SupportPresetOverride = Pick<SupportPreset, "subject" | "descriptionHint">;

type SupportPresetDefinition = SupportPreset & {
  sourceOverrides?: Partial<Record<AuthSupportSource, SupportPresetOverride>>;
};

export const reasonPresetMap: Record<AuthSupportReason, SupportPresetDefinition> = {
  ACCOUNT_LOCKED: {
    category: "account_locked",
    subject: "My account is temporarily locked",
    descriptionHint:
      "Lihatin says my account is temporarily locked after too many failed sign-in attempts. Please help me confirm when I can try again. Approximate time of the last attempt: ",
    sourceOverrides: {
      login: {
        subject: "Account temporarily locked during sign-in",
        descriptionHint:
          "I cannot sign in because Lihatin reported too many failed login attempts and temporarily blocked my account. Please help me confirm when I can try again. Approximate time of the last attempt: ",
      },
      totp: {
        subject: "Account locked at authenticator verification",
        descriptionHint:
          "My password was accepted, but Lihatin reported that my account is temporarily locked when I reached the authenticator-code step. Please help me confirm when I can try again. Approximate time: ",
      },
      email_otp: {
        subject: "Account locked at email-code verification",
        descriptionHint:
          "I received the email sign-in code, but Lihatin reported that my account is temporarily locked when I tried to verify it. Please help me confirm when I can try again. Approximate time: ",
      },
    },
  },
  USER_LOCKED: {
    category: "account_locked",
    subject: "My account has been locked",
    descriptionHint:
      "Lihatin says my account has been locked and asks me to contact support. Please review why it was locked and whether access can be restored. Approximate time I saw the message: ",
    sourceOverrides: {
      login: {
        subject: "Account locked during sign-in",
        descriptionHint:
          "During sign-in, Lihatin said my account has been locked and asked me to contact support. Please review why it was locked and whether access can be restored. Sign-in method and approximate time: ",
      },
      totp: {
        subject: "Account locked during 2FA sign-in",
        descriptionHint:
          "My password was accepted, but during authenticator verification Lihatin said my account has been locked. Please review why it was locked and whether access can be restored. Approximate time: ",
      },
      email_otp: {
        subject: "Account locked during email-code sign-in",
        descriptionHint:
          "I received an email sign-in code, but during verification Lihatin said my account has been locked. Please review why it was locked and whether access can be restored. Approximate time: ",
      },
    },
  },
  ACCOUNT_DEACTIVATED: {
    category: "account_deactivated",
    subject: "My account has been deactivated",
    descriptionHint:
      "Lihatin says my account is deactivated. Please review its status and let me know whether it can be reactivated. Approximate time I saw the message: ",
    sourceOverrides: {
      login: {
        subject: "Deactivated account prevents sign-in",
        descriptionHint:
          "I cannot sign in because Lihatin says my account is deactivated. Please review its status and let me know whether it can be reactivated. Sign-in method and approximate time: ",
      },
      totp: {
        subject: "Account deactivated during 2FA sign-in",
        descriptionHint:
          "My password was accepted, but Lihatin reported that my account is deactivated during authenticator verification. Please review its status and let me know whether it can be reactivated. Approximate time: ",
      },
      email_otp: {
        subject: "Account deactivated during email-code sign-in",
        descriptionHint:
          "I received an email sign-in code, but Lihatin reported that my account is deactivated during verification. Please review its status and let me know whether it can be reactivated. Approximate time: ",
      },
    },
  },
  EMAIL_NOT_VERIFIED: {
    category: "email_verification",
    subject: "My email is not verified",
    descriptionHint:
      "I cannot continue because Lihatin says my email is not verified. Please help me complete email verification. What I tried and the approximate time: ",
    sourceOverrides: {
      login: {
        subject: "Email verification is blocking sign-in",
        descriptionHint:
          "I cannot sign in because Lihatin says my email is not verified. Please help me complete email verification. What I tried and the approximate time: ",
      },
      totp: {
        subject: "Email not verified after 2FA step",
        descriptionHint:
          "I reached the authenticator-code step, but Lihatin then said my email is not verified. Please help me complete email verification and regain access. Approximate time: ",
      },
      email_otp: {
        subject: "Email still unverified after entering sign-in code",
        descriptionHint:
          "I received and entered the email sign-in code, but Lihatin still says my email is not verified. Please check the verification status and help me regain access. Approximate time: ",
      },
    },
  },
  SUSPICIOUS_LINK: {
    category: "suspicious_link",
    subject: "Reporting a suspicious short link",
    descriptionHint:
      "I encountered a Lihatin short link that looks suspicious or potentially unsafe. Please review the link. What made it look suspicious: ",
  },
  BUG_REPORT: {
    category: "bug_report",
    subject: "Unexpected behavior in Lihatin",
    descriptionHint:
      "I encountered unexpected behavior in Lihatin. Steps to reproduce: \n\nExpected result: \n\nActual result: \n\nBrowser or device: ",
  },
  FEATURE_REQUEST: {
    category: "feature_request",
    subject: "Feature request for Lihatin",
    descriptionHint:
      "I would like Lihatin to support this feature or improvement: \n\nThe problem it would solve: \n\nHow I expect it to work: ",
  },
  BILLING: {
    category: "billing",
    subject: "Billing or payment issue",
    descriptionHint:
      "I need help with a billing or payment issue. Transaction date and amount, if applicable: \n\nWhat happened: \n\nPlease do not include a full card number or password.",
  },
  LOST_2FA: {
    category: "lost_2fa",
    subject: "Lost access to authenticator device",
    descriptionHint:
      "I cannot sign in because I no longer have access to the authenticator device or recovery method for this account. Please help me verify ownership and recover access. Last successful sign-in, if known: ",
  },
  OTHER: {
    category: "other",
    subject: "I need support",
    descriptionHint:
      "I need help with an issue that does not match the available categories. What happened: \n\nWhat I already tried: \n\nApproximate time: ",
  },
};

export function resolveSupportPreset(
  reason: AuthSupportReason,
  source: AuthSupportSource | null,
): SupportPreset {
  const definition = reasonPresetMap[reason];
  const override = source ? definition.sourceOverrides?.[source] : undefined;

  return {
    category: definition.category,
    subject: override?.subject || definition.subject,
    descriptionHint: override?.descriptionHint || definition.descriptionHint,
  };
}

export function getAuthSupportSourceFromSearch(raw: string | null): AuthSupportSource | null {
  const normalized = (raw || "").trim().toLowerCase();
  if (normalized === "login" || normalized === "totp" || normalized === "email_otp") {
    return normalized;
  }
  return null;
}

export const categoryOptions: { value: SupportCategory; label: string }[] = [
  { value: "account_locked", label: "Account Locked" },
  { value: "account_deactivated", label: "Account Deactivated" },
  { value: "email_verification", label: "Email Verification" },
  { value: "lost_2fa", label: "Lost 2FA Device" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "suspicious_link", label: "Suspicious Link" },
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
  suspicious_link: "Suspicious Link",
  other: "Other",
};

export function getSupportReasonFromSearch(raw: string | null): AuthSupportReason | null {
  const normalized = (raw || "").trim().toUpperCase();
  if (
    normalized === "ACCOUNT_LOCKED" ||
    normalized === "USER_LOCKED" ||
    normalized === "ACCOUNT_DEACTIVATED" ||
    normalized === "EMAIL_NOT_VERIFIED" ||
    normalized === "SUSPICIOUS_LINK" ||
    normalized === "BUG_REPORT" ||
    normalized === "OTHER" ||
    normalized === "FEATURE_REQUEST" ||
    normalized === "BILLING" ||
    normalized === "LOST_2FA"
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

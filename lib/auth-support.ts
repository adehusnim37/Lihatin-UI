export type AuthSupportReason =
  | "ACCOUNT_LOCKED"
  | "USER_LOCKED"
  | "ACCOUNT_DEACTIVATED"
  | "EMAIL_NOT_VERIFIED"
  | "SUSPICIOUS_LINK"
  | "BUG_REPORT"
  | "OTHER"
  | "FEATURE_REQUEST"
  | "BILLING"
  | "LOST_2FA";

export type AuthSupportSource = "login" | "totp" | "email_otp";

export function getAuthSupportReasonFromMessage(message: string): AuthSupportReason | null {
  const normalized = message.toLowerCase();

  if (normalized.includes("has been locked") || normalized.includes("locked by admin")) {
    return "USER_LOCKED";
  }

  if (
    normalized.includes("account is locked") ||
    normalized.includes("lockout") ||
    normalized.includes("temporarily blocked") ||
    normalized.includes("too many failed login attempts")
  ) {
    return "ACCOUNT_LOCKED";
  }

  if (normalized.includes("deactivated")) {
    return "ACCOUNT_DEACTIVATED";
  }

  if (normalized.includes("not verified") || normalized.includes("verify your email")) {
    return "EMAIL_NOT_VERIFIED";
  }

  return null;
}

export function buildAuthSupportURL(
  reason: AuthSupportReason,
  email?: string,
  source?: AuthSupportSource,
): string {
  const params = new URLSearchParams({
    reason,
  });

  if (source) {
    params.set("source", source);
  }

  const cleanEmail = (email || "").trim();
  if (cleanEmail) {
    params.set("email", cleanEmail);
  }

  return `/support/new?${params.toString()}`;
}

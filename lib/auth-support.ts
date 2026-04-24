export type AuthSupportReason =
  | "ACCOUNT_LOCKED"
  | "USER_LOCKED"
  | "ACCOUNT_DEACTIVATED"
  | "EMAIL_NOT_VERIFIED";

export function getAuthSupportReasonFromMessage(
  message: string
): AuthSupportReason | null {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("has been locked") ||
    normalized.includes("locked by admin")
  ) {
    return "USER_LOCKED";
  }

  if (normalized.includes("account is locked") || normalized.includes("lockout")) {
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

export function buildAuthSupportURL(reason: AuthSupportReason, email?: string): string {
  const params = new URLSearchParams({
    reason,
  });

  const cleanEmail = (email || "").trim();
  if (cleanEmail) {
    params.set("email", cleanEmail);
  }

  return `/support?${params.toString()}`;
}

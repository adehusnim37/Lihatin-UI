function normalizeTicket(ticket: string): string {
  return ticket.trim().toUpperCase();
}

const LEGACY_PUBLIC_SUPPORT_ACCESS_PREFIX = "support-public-access:";

export function clearLegacyPublicSupportAccessTokens(): void {
  if (typeof window === "undefined") return;
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(LEGACY_PUBLIC_SUPPORT_ACCESS_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage may be unavailable in hardened/private browsing contexts.
  }
}

export function buildPublicSupportConversationURL(ticket: string): string {
  const normalizedTicket = normalizeTicket(ticket);
  return `/support/ticket/${encodeURIComponent(normalizedTicket)}`;
}

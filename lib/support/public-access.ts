const PUBLIC_SUPPORT_ACCESS_PREFIX = "support-public-access";

function normalizeTicket(ticket: string): string {
  return ticket.trim().toUpperCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildPublicSupportConversationURL(ticket: string, email: string, code?: string): string {
  const normalizedTicket = normalizeTicket(ticket);
  const query = new URLSearchParams({
    email: email.trim(),
  });

  if (code?.trim()) {
    query.set("code", code.trim());
  }

  return `/support/ticket/${encodeURIComponent(normalizedTicket)}?${query.toString()}`;
}

function getStorageKey(ticket: string, email: string): string {
  return `${PUBLIC_SUPPORT_ACCESS_PREFIX}:${normalizeTicket(ticket)}:${normalizeEmail(email)}`;
}

export function storePublicSupportAccessToken(ticket: string, email: string, token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(ticket, email), token);
}

export function getStoredPublicSupportAccessToken(ticket: string, email: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(getStorageKey(ticket, email)) || "";
}

export function clearStoredPublicSupportAccessToken(ticket: string, email: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getStorageKey(ticket, email));
}

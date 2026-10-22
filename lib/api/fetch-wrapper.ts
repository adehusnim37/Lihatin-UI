/**
 * Fetch Wrapper with Automatic Token Refresh + CSRF Protection
 * 🔐 Intercepts 401 errors and automatically refreshes tokens using HTTP-Only cookies
 * 🛡️ Automatically attaches CSRF token to mutating requests
 */

import { clearUserData, refreshToken } from "./auth";
import { getDeviceID } from "@/lib/device";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

// CSRF token storage (in-memory for security)
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;
let csrfVersion = 0;
let authVersion = 0;
let authRefreshPromise: Promise<void> | null = null;
let sessionExpired = false;

/**
 * Fetch CSRF token from server
 * Uses singleton pattern to prevent multiple simultaneous requests
 */
async function fetchCSRFToken(): Promise<string> {
  // Return existing promise if already fetching
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/csrf-token`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      csrfToken = data.data?.csrfToken || null;
      if (csrfToken) csrfVersion++;

      if (!csrfToken) {
        console.warn("CSRF token not found in response");
      }

      return csrfToken || "";
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return "";
    } finally {
      // Clear promise after completion
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Get CSRF token (fetches if not available)
 */
export async function getCSRFToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  return fetchCSRFToken();
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCSRFToken(): void {
  sessionExpired = false;
  csrfToken = null;
  csrfTokenPromise = null;
}

/**
 * Refresh CSRF token (call after login)
 */
export async function refreshCSRFToken(): Promise<string> {
  sessionExpired = false;
  csrfToken = null;
  return fetchCSRFToken();
}

/**
 * Check if method requires CSRF token
 */
function requiresCSRF(method: string): boolean {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  return mutatingMethods.includes(method.toUpperCase());
}

function isCSRFErrorPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;

  const response = payload as {
    message?: unknown;
    error?: unknown;
  };
  const errorText =
    typeof response.error === "string"
      ? response.error
      : response.error && typeof response.error === "object"
        ? Object.values(response.error).join(" ")
        : "";

  return `${String(response.message || "")} ${errorText}`.toLowerCase().includes("csrf");
}

// Include the CSRF refresh in the shared recovery so waiters never replay
// requests with the previous session's token. Versioning also covers late 401s.
async function recoverSession(requestVersion: number): Promise<void> {
  if (requestVersion !== authVersion) return;
  if (!authRefreshPromise) {
    authRefreshPromise = (async () => {
      await refreshToken();
      await refreshCSRFToken();
      authVersion++;
    })().finally(() => {
      authRefreshPromise = null;
    });
  }
  await authRefreshPromise;
}

function expireSession(): void {
  if (sessionExpired) return;
  clearCSRFToken();
  sessionExpired = true;
  clearUserData();
  if (typeof window !== "undefined") {
    window.location.replace("/auth/login?error=session_expired");
  }
}

/**
 * Sends a request, with at most one replay for each explicit auth/CSRF rejection.
 * Network errors and other HTTP failures never replay a write automatically.
 * Shared session recovery continues if a caller aborts, but that caller's
 * original request is not replayed after cancellation.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOnRefresh: boolean = true,
): Promise<Response> {
  const source = input instanceof Request ? input.clone() : input;
  const method = (
    init?.method || (source instanceof Request ? source.method : "GET")
  ).toUpperCase();
  const headers = new Headers(
    init?.headers ?? (source instanceof Request ? source.headers : undefined),
  );
  const signal = init?.signal ?? (source instanceof Request ? source.signal : undefined);
  signal?.throwIfAborted();

  if (typeof window !== "undefined") {
    const deviceID = await getDeviceID();
    if (deviceID) headers.set("X-Device-ID", deviceID);
  }
  if (requiresCSRF(method)) {
    const token = await getCSRFToken();
    if (token) headers.set("X-CSRF-Token", token);
  }

  const requestAuthVersion = authVersion;
  let requestCSRFVersion = csrfVersion;
  let retriedAuth = false;
  let retriedCSRF = false;
  for (;;) {
    signal?.throwIfAborted();
    const response = await fetch(source instanceof Request ? source.clone() : source, {
      ...init,
      headers,
      signal,
      credentials: "include",
    });

    if (response.status === 403 && !retriedCSRF && requiresCSRF(method)) {
      let csrfRejected = false;
      try {
        csrfRejected = isCSRFErrorPayload(await response.clone().json());
      } catch {
        // A non-JSON 403 is a normal authorization error.
      }
      if (csrfRejected) {
        signal?.throwIfAborted();
        const token =
          requestCSRFVersion === csrfVersion ? await refreshCSRFToken() : await getCSRFToken();
        if (!token) return response;
        headers.set("X-CSRF-Token", token);
        requestCSRFVersion = csrfVersion;
        retriedCSRF = true;
        continue;
      }
    }

    if (response.status === 401 && retryOnRefresh) {
      if (retriedAuth || sessionExpired) {
        expireSession();
        return response;
      }
      signal?.throwIfAborted();
      try {
        await recoverSession(requestAuthVersion);
      } catch {
        expireSession();
        return response;
      }
      signal?.throwIfAborted();
      if (requiresCSRF(method)) {
        const token = await getCSRFToken();
        if (token) headers.set("X-CSRF-Token", token);
      }
      requestCSRFVersion = csrfVersion;
      retriedAuth = true;
      continue;
    }
    return response;
  }
}

/**
 * Helper for GET requests with automatic auth handling
 */
export async function getWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Helper for POST requests with automatic auth handling + CSRF
 */
export async function postWithAuth(url: string, body?: unknown): Promise<Response> {
  return fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests with automatic auth handling + CSRF
 */
export async function putWithAuth(url: string, body?: unknown): Promise<Response> {
  return fetchWithAuth(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PATCH requests with automatic auth handling + CSRF
 */
export async function patchWithAuth(url: string, body?: unknown): Promise<Response> {
  return fetchWithAuth(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests with automatic auth handling + CSRF
 */
export async function deleteWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

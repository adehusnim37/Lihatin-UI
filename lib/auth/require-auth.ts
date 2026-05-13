import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
const JWT_SECRET = process.env.JWT_SECRET || "";
const NEAR_EXPIRY_WINDOW_SECONDS = 5 * 60;
const PERIODIC_BACKEND_CHECK_WINDOW_SECONDS = 10 * 60;
const MAX_PERIODIC_CACHE_ENTRIES = 5000;

const periodicBackendCheckCache = new Map<string, number>();

type LocalJWTClaims = {
  user_id: string;
  username: string;
  email: string;
  role: string;
  is_premium: boolean;
  is_verified: boolean;
  session_id?: string;
  device_id?: string;
  last_ip?: string;
  iss?: string;
  sub?: string;
  jti?: string;
  iat?: number;
  nbf?: number;
  exp?: number;
};

export type AuthSession = {
  source: "local" | "backend";
  claims?: LocalJWTClaims;
  user?: unknown;
  auth?: unknown;
};

type LocalCheckResult =
  | { status: "valid"; claims: LocalJWTClaims; secondsUntilExpiry: number }
  | { status: "near_expiry"; claims: LocalJWTClaims; secondsUntilExpiry: number }
  | { status: "expired" | "invalid" };

type CurrentUserResponse = {
  success?: boolean;
  data?: {
    user?: unknown;
    auth?: unknown;
  };
};

function createTokenFingerprint(token: string, jti?: string): string {
  if (jti) {
    return `jti:${jti}`;
  }
  return `tok:${createHash("sha256").update(token).digest("hex")}`;
}

function shouldRunPeriodicBackendCheck(tokenKey: string): boolean {
  const now = Date.now();
  const lastCheckedAt = periodicBackendCheckCache.get(tokenKey);

  if (!lastCheckedAt) {
    return true;
  }

  return now - lastCheckedAt >= PERIODIC_BACKEND_CHECK_WINDOW_SECONDS * 1000;
}

function markPeriodicBackendChecked(tokenKey: string): void {
  periodicBackendCheckCache.set(tokenKey, Date.now());

  if (periodicBackendCheckCache.size <= MAX_PERIODIC_CACHE_ENTRIES) {
    return;
  }

  const overflow = periodicBackendCheckCache.size - MAX_PERIODIC_CACHE_ENTRIES;
  const keys = periodicBackendCheckCache.keys();
  for (let index = 0; index < overflow; index += 1) {
    const next = keys.next();
    if (next.done) {
      break;
    }
    periodicBackendCheckCache.delete(next.value);
  }
}

function base64UrlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function safeParseJSON<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function verifyLocalAccessToken(token: string, secret: string): LocalCheckResult {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return { status: "invalid" };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = safeParseJSON<{ alg?: string; typ?: string }>(
    base64UrlToBuffer(encodedHeader).toString("utf8"),
  );
  const payload = safeParseJSON<LocalJWTClaims>(
    base64UrlToBuffer(encodedPayload).toString("utf8"),
  );
  if (!header || !payload || header.alg !== "HS256") {
    return { status: "invalid" };
  }

  const signedInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret).update(signedInput).digest();
  const providedSignature = base64UrlToBuffer(encodedSignature);

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return { status: "invalid" };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : 0;
  if (!exp || exp <= now || (nbf && nbf > now)) {
    return { status: "expired" };
  }

  const secondsUntilExpiry = exp - now;
  if (secondsUntilExpiry <= NEAR_EXPIRY_WINDOW_SECONDS) {
    return { status: "near_expiry", claims: payload, secondsUntilExpiry };
  }

  return { status: "valid", claims: payload, secondsUntilExpiry };
}

function makeLoginURL(pathname: string, search: string): string {
  const redirectTarget = `${pathname}${search}`;
  return `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`;
}

async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function fetchCurrentUser(cookieHeader: string): Promise<AuthSession | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CurrentUserResponse;
  if (!payload.success || !payload.data?.user || !payload.data?.auth) {
    return null;
  }

  return {
    source: "backend",
    user: payload.data.user,
    auth: payload.data.auth,
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value || "";
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") || "/main";
  const search = hdrs.get("x-search") || "";

  if (!accessToken) {
    redirect(makeLoginURL(pathname, search));
  }

  const cookieHeader = await buildCookieHeader();

  if (JWT_SECRET) {
    const localCheck = verifyLocalAccessToken(accessToken, JWT_SECRET);
    if (localCheck.status === "valid") {
      const tokenKey = createTokenFingerprint(accessToken, localCheck.claims.jti);
      if (!shouldRunPeriodicBackendCheck(tokenKey)) {
        return { source: "local", claims: localCheck.claims };
      }

      const periodicBackendSession = await fetchCurrentUser(cookieHeader);
      if (periodicBackendSession) {
        markPeriodicBackendChecked(tokenKey);
        return periodicBackendSession;
      }
      redirect(makeLoginURL(pathname, search));
    }

    if (localCheck.status === "near_expiry") {
      const tokenKey = createTokenFingerprint(accessToken, localCheck.claims.jti);
      const backendSession = await fetchCurrentUser(cookieHeader);
      if (backendSession) {
        markPeriodicBackendChecked(tokenKey);
        return backendSession;
      }
      redirect(makeLoginURL(pathname, search));
    }
  }

  const backendSession = await fetchCurrentUser(cookieHeader);
  if (backendSession) {
    return backendSession;
  }

  redirect(makeLoginURL(pathname, search));
}

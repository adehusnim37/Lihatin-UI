import { NextRequest, NextResponse } from "next/server";

import { NO_STORE_HEADERS, SECURITY_HEADERS } from "@/lib/security/headers";

function applyHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  for (const [key, value] of Object.entries({
    ...SECURITY_HEADERS,
    ...headers,
  })) {
    response.headers.set(key, value);
  }

  return response;
}

export function createRedirectResponse(
  destination: string | URL,
  status = 307
): NextResponse {
  const response = NextResponse.redirect(destination, { status });
  return applyHeaders(response, NO_STORE_HEADERS);
}

export function getRequestProtocol(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "") ||
    "https"
  );
}

export function getRequestOrigin(request: NextRequest): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/+$/, "") || "";
  if (configuredOrigin) return configuredOrigin;

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    .trim();
  const host = forwardedHost || request.headers.get("host");
  const protocol = getRequestProtocol(request);

  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

export function resolveBackendBaseUrl(request: NextRequest): string {
  const configuredUrl =
    process.env.INTERNAL_API_URL?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    "";

  if (configuredUrl) return configuredUrl;

  return `${getRequestOrigin(request)}/v1`;
}

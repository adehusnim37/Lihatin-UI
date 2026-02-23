import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

interface BackendErrorResponse {
  success: boolean;
  message: string;
  error?: Record<string, string> | null;
}

export const dynamic = "force-dynamic";

function isClickLimitError(errorData: BackendErrorResponse): boolean {
  const message = (errorData.message || "").toLowerCase();
  const errorKeys = Object.keys(errorData.error || {}).map((key) =>
    key.toLowerCase()
  );

  return (
    errorKeys.includes("click_limit") ||
    message.includes("click limit") ||
    message.includes("maximum number of clicks")
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ short_code: string }> }
) {
  const { short_code } = await params;
  const targetUrl = `${BACKEND_URL}/short/${short_code}`;

  try {
    // Fetch from backend with redirect: "manual" to capture Location header
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "manual", // Don't follow redirect automatically
      cache: "no-store", // Ensure we always hit the backend for stats
      headers: {
        "User-Agent": request.headers.get("user-agent") || "NextJS-Server",
        "X-Forwarded-For":
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        Referer: request.headers.get("referer") || "",
        "X-Device-ID": request.headers.get("x-device-id") || "",
        "X-Browser": request.headers.get("x-browser") || "",
        "X-OS": request.headers.get("x-os") || "",
      },
    });

    // If backend returns redirect (3xx), forward it to user
    if (
      response.status === 301 ||
      response.status === 302 ||
      response.status === 303 ||
      response.status === 307 ||
      response.status === 308
    ) {
      const location = response.headers.get("location");
      if (location) {
        const res = NextResponse.redirect(location, {
          status: response.status,
        });
        res.headers.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        res.headers.set("Pragma", "no-cache");
        res.headers.set("Expires", "0");
        return res;
      }
    }

    // Handle error responses
    const errorData: BackendErrorResponse = await response.json();

    // Build error page URL with query params
    const errorUrl = new URL("/link-error", request.url);
    errorUrl.searchParams.set("code", short_code);
    errorUrl.searchParams.set("status", response.status.toString());
    errorUrl.searchParams.set(
      "message",
      errorData.message || "Unknown error occurred"
    );

    // Map status codes to specific error types
    switch (response.status) {
      case 401:
        // Passcode required - redirect to passcode input page
        const passcodeUrl = new URL(
          `/${short_code}/enter-passcode`,
          request.url
        );
        return NextResponse.redirect(passcodeUrl.toString());

      case 404:
        errorUrl.searchParams.set("type", "not_found");
        break;

      case 403:
        errorUrl.searchParams.set(
          "type",
          isClickLimitError(errorData) ? "click_limit" : "forbidden"
        );
        break;

      case 410:
        errorUrl.searchParams.set("type", "expired");
        break;

      case 429:
        errorUrl.searchParams.set("type", "rate_limit");
        break;

      default:
        errorUrl.searchParams.set("type", "error");
    }

    return NextResponse.redirect(errorUrl.toString());
  } catch {
    // Network error or backend unreachable
    const errorUrl = new URL("/link-error", request.url);
    errorUrl.searchParams.set("code", short_code);
    errorUrl.searchParams.set("type", "network");
    errorUrl.searchParams.set(
      "message",
      "Unable to reach the server. Please try again."
    );

    return NextResponse.redirect(errorUrl.toString());
  }
}

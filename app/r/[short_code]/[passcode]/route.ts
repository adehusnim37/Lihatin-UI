import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

interface BackendErrorResponse {
  success: boolean;
  message: string;
  error?: { details: string };
}
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ short_code: string; passcode: string }> }
) {
  const { short_code, passcode } = await params;

  try {
    // Fetch from backend with passcode
    const response = await fetch(
      `${BACKEND_URL}/short/${short_code}?passcode=${passcode}`,
      {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
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
      }
    );

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

    const errorUrl = new URL("/link-error", request.url);
    errorUrl.searchParams.set("code", short_code);
    errorUrl.searchParams.set("status", response.status.toString());
    errorUrl.searchParams.set(
      "message",
      errorData.message || "Unknown error occurred"
    );

    switch (response.status) {
      case 401:
        // Invalid passcode
        errorUrl.searchParams.set("type", "invalid_passcode");
        break;

      case 404:
        errorUrl.searchParams.set("type", "not_found");
        break;

      case 403:
        errorUrl.searchParams.set("type", "forbidden");
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
  } catch (error) {
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

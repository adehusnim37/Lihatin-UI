import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

interface BackendErrorResponse {
  success: boolean;
  message: string;
  error?: { details: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ short_code: string }> }
) {
  const { short_code } = await params;

  try {
    // Fetch from backend with redirect: "manual" to capture Location header
    const response = await fetch(`${BACKEND_URL}/short/${short_code}`, {
      method: "GET",
      redirect: "manual", // Don't follow redirect automatically
      headers: {
        "User-Agent": request.headers.get("user-agent") || "NextJS-Server",
        "X-Forwarded-For":
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        Referer: request.headers.get("referer") || "",
      },
    });

    // If backend returns redirect (301/302), forward it to user
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get("location");
      if (location) {
        return NextResponse.redirect(location, { status: response.status });
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

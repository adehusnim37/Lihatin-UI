import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/security/headers";

export function GET() {
  return NextResponse.json(
    { success: true, status: "ok" },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    }
  );
}

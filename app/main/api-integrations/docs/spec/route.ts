import { dump } from "js-yaml";
import { requireAuth } from "@/lib/auth/require-auth";
import { getOpenAPIDocument } from "@/lib/api-docs/document";

export async function GET(request: Request) {
  // Route handlers do not inherit the dashboard layout's auth guard.
  await requireAuth();
  const yaml = new URL(request.url).searchParams.get("format") === "yaml";
  const document = getOpenAPIDocument();
  return new Response(yaml ? dump(document) : JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": yaml ? "application/yaml; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lihatin-openapi.${yaml ? "yaml" : "json"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

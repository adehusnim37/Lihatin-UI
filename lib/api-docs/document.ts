import specification from "./openapi.json";
import { enSpecOverlays } from "./en-spec";

/** Keep the rendered reference and downloaded contract on the same API server. */
export function getOpenAPIDocument(
  locale: "id" | "en" = "id",
  apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1",
) {
  // Deep copy to prevent mutating the shared imported json reference
  const spec = JSON.parse(JSON.stringify(specification));

  if (locale === "en") {
    spec.info = {
      ...spec.info,
      description: enSpecOverlays.description,
    };
    if (spec.tags) {
      spec.tags = spec.tags.map((tag: { name: string; description: string }) => {
        const overlayDesc = enSpecOverlays.tags[tag.name as keyof typeof enSpecOverlays.tags];
        if (overlayDesc) {
          return { ...tag, description: overlayDesc };
        }
        return tag;
      });
    }
  }

  return {
    ...spec,
    servers: [{ url: apiURL.replace(/\/+$/, ""), description: "Lihatin API" }],
  };
}

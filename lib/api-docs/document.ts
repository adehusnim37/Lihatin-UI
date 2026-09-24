import specification from "./openapi.json";

/** Keep the rendered reference and downloaded contract on the same API server. */
export function getOpenAPIDocument(
  apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1",
) {
  return {
    ...specification,
    servers: [{ url: apiURL.replace(/\/+$/, ""), description: "Lihatin API" }],
  };
}

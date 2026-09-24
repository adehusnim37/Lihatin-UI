# Lihatin API reference

`openapi.json` is the canonical OpenAPI 3.1 document for the eight API-key short-link operations. Update it alongside changes to backend routes, DTOs, handlers, and permission requirements. The management endpoints remain explained in the guide because they use dashboard session authentication.

- Run `bun run docs:lint` to validate the contract and `bun run docs:test` to check request/response example consistency. CI runs both checks.
- Keep the create operation’s request and 201 response example keys identical (`Single`, `Bulk`). Scalar uses these keys to synchronize the selected request, generated code, and response. Do not replace selectable response `examples` with a fixed `example`.
- `document.ts` sets the server from `NEXT_PUBLIC_API_URL` (including `/v1`). The same document feeds Scalar and authenticated JSON/YAML downloads.
- Open `/main/api-integrations/docs`, or the Documentation tab in API & Integrations.
- Scalar is bundled locally, loaded client-side, and follows the dashboard theme. Authentication persistence, telemetry, and the Scalar agent are disabled. No third-party request proxy is configured.
- Test Request sends real requests directly to the API. The backend must allow the frontend origin through `ALLOWED_ORIGINS`; its CORS middleware already allows `X-API-Key`.
- The guide and operation descriptions identify current backend limitations. In particular, the views endpoint's default `clicked_at` sorting currently fails validation; the 200 response schema describes its intended handler output.

The spec download route explicitly calls `requireAuth`: Next.js route handlers do not inherit layout authentication. Downloaded files contain the configured API server URL and schemas, never the user's API key.

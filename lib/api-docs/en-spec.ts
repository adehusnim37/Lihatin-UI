export const enSpecOverlays = {
  description:
    "Create and manage short links from your applications.\n\n### Authentication\nSend your full key via the `X-API-Key` header. Key format: `keyID.secretKey`.\n\n### Scope and Usage Limits\nNon-premium accounts can use the API with a maximum of **50 requests per hour**. Active premium access raises this limit to **100 requests per 10 minutes**. The limit is shared across all API keys and short-link endpoints on a single account, even from different IPs. The total key limit (`limit_usage`) is an optional boundary that key owners can configure or clear. Modifying this key-level threshold does not affect the account-level rate limit. Key usage count increments only after both permissions and account rate limits successfully pass. Authentication protection allows up to 120 attempts per minute per IP; after 10 recorded failures for the same IP and key ID within 15 minutes, further attempts receive 429 with a `Retry-After` header. Failed authentication does not spend account or key quota.\n\n### Access Permissions\n- `read`: view link stats and details.\n- `write`: create links.\n- `update`: modify existing link configuration.\n- `delete`: remove links.\n\nFor a detailed quota guide, key lifecycle actions, and interactive examples, click the **Usage guide** tab.",
  tags: {
    "Short links": "Create, retrieve, update, and delete short links.",
    Analytics: "Click analytics and detailed view history.",
  },
  servers: "Lihatin API",
};

const isProduction = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https: blob:${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  `connect-src 'self' https: wss:${isProduction ? "" : " http://localhost:3000 http://localhost:3001 http://localhost:8080 ws:"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
];

export const SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy": cspDirectives.join("; "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy":
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  ...(isProduction
    ? {
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
      }
    : {}),
});

export const NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Content-Type": "text/plain; charset=utf-8",
});

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

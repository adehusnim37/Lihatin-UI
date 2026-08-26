"use client";

import { getFingerprint } from "thumbmarkjs";

// In-memory cache so we only compute the (relatively expensive) fingerprint
// once per page load. It is intentionally NOT persisted to localStorage:
// the fingerprint is only a UI/UX marker, and persisting it would give a
// fingerprint value cross-device persistence that could be used to tie
// accounts together — the Thumbmark authors themselves suggest caching in
// memory only.
let cachedDeviceID: string | null = null;

/**
 * Returns the current browser's device fingerprint (client-side only).
 *
 * - On the server (SSR / Next route handlers) this returns null/empty so it
 *   can never leak into server-rendered HTML.
 * - Falls back to an in-memory memoized result after the first computation.
 *
 * The returned value is sent as `X-Device-ID` so the backend logs it as
 * session metadata. It is NOT a security secret — treat it exactly like a
 * browser User-Agent.
 */
export async function getDeviceID(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (cachedDeviceID !== null) {
    return cachedDeviceID;
  }

  try {
    // ThumbmarkJS `getFingerprint()` resolves to the fingerprint hash string.
    const fingerprint = await getFingerprint();
    if (fingerprint && typeof fingerprint === "string" && fingerprint.length >= 8) {
      cachedDeviceID = fingerprint;
      return cachedDeviceID;
    }
  } catch (err) {
    // Fingerprinting can fail (privacy browsers, CSP, etc.). Not fatal.
    if (typeof console !== "undefined") {
      console.warn("Failed to generate device fingerprint:", err);
    }
  }

  return null;
}
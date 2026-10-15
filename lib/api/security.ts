import { fetchWithAuth, refreshCSRFToken } from "./fetch-wrapper";
import type { LoginResult } from "./auth";
import { getDeviceID } from "@/lib/device";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
export interface Passkey {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
}
export interface TOTPStatus {
  enabled: boolean;
  verified?: boolean;
  friendly_name?: string;
  verified_at?: string;
  last_used?: string;
  recovery_codes_left?: number;
}
export interface PasskeyList {
  passkeys: Passkey[];
  available: boolean;
}
export interface Verification {
  password?: string;
  totp_code?: string;
}

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  protectedRequest = true,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!protectedRequest && method === "POST") {
    const device = await getDeviceID();
    if (device) headers["X-Device-ID"] = device;
  }
  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  };
  const response = await (protectedRequest
    ? fetchWithAuth(`${API_URL}/auth${path}`, init)
    : fetch(`${API_URL}/auth${path}`, init));
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success)
    throw new Error(result?.message || "The request could not be completed. Please try again.");
  return result.data as T;
}
export const getTOTPStatus = () => request<TOTPStatus>("/totp/status");
export const getPasskeys = () => request<PasskeyList>("/passkeys");
export const verifySecurityAction = (verification: Verification) =>
  request<{ verification_token: string }>("/security/verify", "POST", verification);
export const regenerateRecoveryCodes = (verification_token: string) =>
  request<{ recovery_codes: string[] }>("/totp/regenerate-recovery-codes", "POST", {
    verification_token,
  });
export const renamePasskey = (id: string, name: string) =>
  request<null>(`/passkeys/${encodeURIComponent(id)}`, "PATCH", { name });
export const removePasskey = (id: string, verification_token: string) =>
  request<null>(`/passkeys/${encodeURIComponent(id)}`, "DELETE", { verification_token });

function decode(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
}
function encode(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
type CreationJSON = Omit<
  PublicKeyCredentialCreationOptions,
  "challenge" | "user" | "excludeCredentials"
> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, "id"> & { id: string };
  excludeCredentials?: Array<Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }>;
};
type RequestJSON = Omit<PublicKeyCredentialRequestOptions, "challenge" | "allowCredentials"> & {
  challenge: string;
  allowCredentials?: Array<Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }>;
};
function serialize(credential: PublicKeyCredential) {
  const response = credential.response;
  const common = {
    id: credential.id,
    rawId: encode(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults: credential.getClientExtensionResults(),
  };
  if (response instanceof AuthenticatorAttestationResponse)
    return {
      ...common,
      response: {
        clientDataJSON: encode(response.clientDataJSON),
        attestationObject: encode(response.attestationObject),
        transports: response.getTransports?.() ?? [],
      },
    };
  const assertion = response as AuthenticatorAssertionResponse;
  return {
    ...common,
    response: {
      clientDataJSON: encode(assertion.clientDataJSON),
      authenticatorData: encode(assertion.authenticatorData),
      signature: encode(assertion.signature),
      userHandle: assertion.userHandle ? encode(assertion.userHandle) : null,
    },
  };
}
function requireSupport() {
  if (!window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials)
    throw new Error(
      "Passkeys need a supported browser and a secure connection. Use another sign-in method.",
    );
}
export function passkeyError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError")
    return "Passkey request cancelled or timed out. You can try again.";
  if (error instanceof DOMException && error.name === "InvalidStateError")
    return "This passkey is already registered. Choose a different passkey.";
  return error instanceof Error ? error.message : "Passkey verification failed. Please try again.";
}
export async function registerPasskey(name: string, verification_token: string) {
  requireSupport();
  const begin = await request<{ challenge_id: string; options: { publicKey: CreationJSON } }>(
    "/passkeys/register/begin",
    "POST",
    { name, verification_token },
  );
  const options = begin.options.publicKey;
  const credential = await navigator.credentials.create({
    publicKey: {
      ...options,
      challenge: decode(options.challenge),
      user: { ...options.user, id: decode(options.user.id) },
      excludeCredentials: options.excludeCredentials?.map((entry) => ({
        ...entry,
        id: decode(entry.id),
      })),
    },
  });
  if (!(credential instanceof PublicKeyCredential)) throw new Error("No passkey was created.");
  return request<Passkey>("/passkeys/register/finish", "POST", {
    challenge_id: begin.challenge_id,
    credential: serialize(credential),
  });
}
async function authenticatePasskey(reauth: boolean) {
  requireSupport();
  const prefix = reauth ? "/passkeys/reauth" : "/passkeys/login";
  const begin = await request<{ challenge_id: string; options: { publicKey: RequestJSON } }>(
    `${prefix}/begin`,
    "POST",
    {},
    reauth,
  );
  const options = begin.options.publicKey;
  const credential = await navigator.credentials.get({
    publicKey: {
      ...options,
      challenge: decode(options.challenge),
      allowCredentials: options.allowCredentials?.map((entry) => ({
        ...entry,
        id: decode(entry.id),
      })),
    },
  });
  if (!(credential instanceof PublicKeyCredential)) throw new Error("No passkey was selected.");
  return { prefix, challenge_id: begin.challenge_id, credential: serialize(credential) };
}
export async function verifyWithPasskey() {
  const { prefix, ...body } = await authenticatePasskey(true);
  return request<{ verification_token: string }>(`${prefix}/finish`, "POST", body);
}
export async function loginWithPasskey() {
  const { prefix, ...body } = await authenticatePasskey(false);
  const data = await request<LoginResult>(`${prefix}/finish`, "POST", body, false);
  if (!("requires_totp" in data) && !("requires_email_otp" in data)) await refreshCSRFToken();
  return data;
}

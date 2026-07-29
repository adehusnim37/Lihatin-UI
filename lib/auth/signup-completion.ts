import "server-only";

const API_URL =
  process.env.INTERNAL_API_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
  "http://localhost:8080/v1";

const SIGNUP_COMPLETION_TOKEN_PATTERN = /^[a-f0-9]{48}$/;

type SignupCompletionStatusResponse = {
  success?: boolean;
  data?: {
    valid?: boolean;
  } | null;
};

export async function isSignupCompletionTokenValid(
  token: string,
): Promise<boolean> {
  if (!SIGNUP_COMPLETION_TOKEN_PATTERN.test(token)) {
    return false;
  }

  try {
    const query = new URLSearchParams({ signup_token: token });
    const response = await fetch(
      `${API_URL}/auth/signup/complete/status?${query.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as SignupCompletionStatusResponse;
    return payload.success === true && payload.data?.valid === true;
  } catch {
    // Fail closed: an unavailable validator must never expose the form.
    return false;
  }
}

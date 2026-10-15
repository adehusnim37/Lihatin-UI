export function formatLoginFailureReason(reason?: string | null): string | undefined {
  if (!reason) return undefined;

  try {
    const parsed: unknown = JSON.parse(reason);
    if (typeof parsed !== "object" || parsed === null) return reason;

    const response = parsed as {
      message?: unknown;
      error?: unknown;
    };
    if (typeof response.error === "object" && response.error !== null) {
      const details = Object.values(response.error as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string")
        .join(" ");
      if (details) return details;
    }

    return typeof response.message === "string" ? response.message : reason;
  } catch {
    return reason;
  }
}

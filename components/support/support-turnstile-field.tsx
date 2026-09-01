"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const IS_DEV = process.env.NODE_ENV === "development";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          size?: "flexible" | "compact";
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface SupportTurnstileFieldProps {
  token: string;
  onTokenChange: (token: string) => void;
  resetSignal?: number;
}

export function SupportTurnstileField({
  token,
  onTokenChange,
  resetSignal = 0,
}: SupportTurnstileFieldProps) {
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);
  const appliedResetSignalRef = useRef(resetSignal);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !captchaRef.current) {
      return;
    }

    let disposed = false;
    let renderedSize: "flexible" | "compact" | null = null;

    const removeWidget = () => {
      if (!captchaWidgetIdRef.current || !window.turnstile) return;
      window.turnstile.remove(captchaWidgetIdRef.current);
      captchaWidgetIdRef.current = null;
    };

    const renderWidget = () => {
      if (disposed || !window.turnstile || !captchaRef.current) return;

      const nextSize =
        captchaRef.current.clientWidth < 300 ? "compact" : "flexible";
      if (captchaWidgetIdRef.current && renderedSize === nextSize) return;

      if (captchaWidgetIdRef.current) {
        removeWidget();
        onTokenChange("");
      }

      captchaWidgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        size: nextSize,
        callback: (nextToken: string) => onTokenChange(nextToken),
        "error-callback": () => onTokenChange(""),
        "expired-callback": () => onTokenChange(""),
      });
      renderedSize = nextSize;
    };

    const scriptId = "support-turnstile-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existing) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existing.addEventListener("load", renderWidget, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      document.body.appendChild(script);
    }

    const resizeObserver = new ResizeObserver(renderWidget);
    resizeObserver.observe(captchaRef.current);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      existing?.removeEventListener("load", renderWidget);
      document
        .getElementById(scriptId)
        ?.removeEventListener("load", renderWidget);
      removeWidget();
    };
  }, [onTokenChange]);

  useEffect(() => {
    if (appliedResetSignalRef.current === resetSignal) {
      return;
    }

    appliedResetSignalRef.current = resetSignal;

    if (!captchaWidgetIdRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.reset(captchaWidgetIdRef.current);
    if (token) {
      onTokenChange("");
    }
  }, [onTokenChange, resetSignal, token]);

  if (TURNSTILE_SITE_KEY) {
    return <div ref={captchaRef} className="w-full" />;
  }

  if (IS_DEV) {
    return (
      <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
        Dev mode: captcha bypass enabled.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-dashed border-red-300 bg-red-50 p-3 text-sm text-red-700">
      Turnstile site key missing (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CirclePause,
  CirclePlay,
  ExternalLink,
  Flag,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkFlowHeader } from "@/components/links/link-flow-header";

gsap.registerPlugin(MorphSVGPlugin);

const REDIRECT_SECONDS = 5;

export interface ShortLinkPreview {
  shortCode: string;
  destinationHost: string;
  destinationScheme: string;
  title?: string;
  description?: string;
  requiresPasscode: boolean;
}

interface RedirectExperienceProps {
  preview: ShortLinkPreview;
  redirectPath: string;
  protectedLink?: boolean;
}

function PlaneScene({ compact = false }: { compact?: boolean }) {
  const sceneRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.to(".plane-propeller", {
          rotation: 360,
          transformOrigin: "center",
          duration: 0.32,
          ease: "none",
          repeat: -1,
        });

        gsap.fromTo(
          ".flight-shell",
          {
            x: -18,
            y: 4,
            rotation: 0.8,
          },
          {
            x: 18,
            y: -5,
            rotation: -0.8,
            transformOrigin: "50% 50%",
            duration: 3.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
        );

        gsap.to(".sun-rays", {
          rotation: 360,
          transformOrigin: "center",
          duration: 24,
          ease: "none",
          repeat: -1,
        });

        gsap.to(".sun-core", {
          scale: 1.08,
          transformOrigin: "center",
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(".cloud-layer", {
          x: -620,
          duration: 18,
          ease: "none",
          repeat: -1,
        });

        gsap.to(".cloud-layer-far", {
          x: -620,
          duration: 28,
          ease: "none",
          repeat: -1,
        });

        gsap.to(".contrail", {
          strokeDashoffset: -48,
          duration: 1.4,
          ease: "none",
          repeat: -1,
        });

        gsap.to("#flight-path", {
          morphSVG: "#flight-path-alt",
          duration: 3.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, scene);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  return (
    <svg
      ref={sceneRef}
      viewBox="0 0 560 230"
      role="img"
      aria-label="A plane gliding toward the destination"
      className={compact ? "h-28 w-full" : "h-auto w-full"}
    >
      <defs>
        <linearGradient id="plane-sky-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, var(--background) 94%, var(--primary))" />
          <stop
            offset=".58"
            stopColor="color-mix(in oklab, var(--background) 84%, var(--primary))"
          />
          <stop offset="1" stopColor="color-mix(in oklab, var(--background) 70%, var(--primary))" />
        </linearGradient>
        <linearGradient id="plane-body-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dceff4" />
        </linearGradient>
        <linearGradient id="plane-wing-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ef746d" />
          <stop offset="1" stopColor="#cf4f50" />
        </linearGradient>
        <filter id="plane-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#113846" floodOpacity=".16" />
        </filter>
      </defs>

      <rect x="0" y="0" width="560" height="230" rx="26" fill="url(#plane-sky-gradient)" />
      <g aria-hidden="true">
        <g
          className="sun-rays"
          stroke="#f4bf55"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".72"
        >
          <path d="M474 6v9M474 71v9M437 43h9M502 43h9" />
          <path d="M448 17l7 7M493 62l7 7M448 69l7-7M493 24l7-7" />
        </g>
        <circle cx="474" cy="43" r="29" fill="#fff3bd" opacity=".42" />
        <circle
          className="sun-core"
          cx="474"
          cy="43"
          r="18"
          fill="#ffd66b"
          stroke="#fff8dc"
          strokeWidth="5"
        />
      </g>

      <g fill="#fff" opacity=".45">
        <circle cx="73" cy="48" r="3" />
        <circle cx="105" cy="82" r="2" />
        <circle cx="440" cy="104" r="2.5" />
        <circle cx="515" cy="132" r="3" />
      </g>

      <g className="cloud-layer-far" fill="#fff" opacity=".55">
        <g transform="translate(42 40)">
          <ellipse cx="32" cy="17" rx="32" ry="13" />
          <circle cx="21" cy="12" r="15" />
          <circle cx="42" cy="8" r="18" />
        </g>
        <g transform="translate(660 40)">
          <ellipse cx="32" cy="17" rx="32" ry="13" />
          <circle cx="21" cy="12" r="15" />
          <circle cx="42" cy="8" r="18" />
        </g>
      </g>

      <g className="cloud-layer" fill="#fff" opacity=".82">
        <g transform="translate(30 157)">
          <ellipse cx="44" cy="18" rx="44" ry="15" />
          <circle cx="29" cy="12" r="19" />
          <circle cx="54" cy="7" r="23" />
          <circle cx="72" cy="15" r="15" />
        </g>
        <g transform="translate(405 174)">
          <ellipse cx="48" cy="17" rx="48" ry="15" />
          <circle cx="31" cy="11" r="20" />
          <circle cx="58" cy="7" r="24" />
          <circle cx="78" cy="15" r="16" />
        </g>
        <g transform="translate(650 157)">
          <ellipse cx="44" cy="18" rx="44" ry="15" />
          <circle cx="29" cy="12" r="19" />
          <circle cx="54" cy="7" r="23" />
          <circle cx="72" cy="15" r="15" />
        </g>
        <g transform="translate(1025 174)">
          <ellipse cx="48" cy="17" rx="48" ry="15" />
          <circle cx="31" cy="11" r="20" />
          <circle cx="58" cy="7" r="24" />
          <circle cx="78" cy="15" r="16" />
        </g>
      </g>

      <path
        id="flight-path"
        d="M18 154 C110 138 159 151 236 135 C319 118 365 95 448 93 C490 92 521 100 548 107"
        fill="none"
        stroke="#75bed0"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 10"
        opacity=".62"
      />
      <path
        id="flight-path-alt"
        d="M18 147 C96 165 167 119 240 137 C313 155 378 111 448 103 C492 98 522 101 548 107"
        fill="none"
        stroke="#75bed0"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 10"
        visibility="hidden"
      />

      <g className="flight-shell">
        <g className="contrail" fill="none" stroke="#fff" strokeLinecap="round" opacity=".88">
          <path d="M84 121h151" strokeWidth="6" strokeDasharray="30 18" />
          <path d="M116 135h112" strokeWidth="3" strokeDasharray="20 14" opacity=".72" />
        </g>

        <g className="plane-shell" filter="url(#plane-soft-shadow)">
          <g transform="translate(224 52)">
            <path
              d="M12 64c0-13 11-24 24-24h87c20 0 38 6 53 17l22 16-22 16c-15 11-33 17-53 17H36c-13 0-24-11-24-24z"
              fill="url(#plane-body-gradient)"
              stroke="#153b49"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M17 62L0 39h22l29 21"
              fill="#e55d59"
              stroke="#153b49"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M17 88L3 109h24l25-19"
              fill="#e55d59"
              stroke="#153b49"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M91 59L66 2h27l53 60z"
              fill="url(#plane-wing-gradient)"
              stroke="#153b49"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M92 89l-22 61h29l48-58z"
              fill="url(#plane-wing-gradient)"
              stroke="#153b49"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M136 48c15 2 28 7 39 15h-44z"
              fill="#7fc8dc"
              stroke="#153b49"
              strokeWidth="4"
            />
            <g fill="#76bfd3" stroke="#153b49" strokeWidth="3">
              <circle cx="62" cy="70" r="7" />
              <circle cx="88" cy="70" r="7" />
              <circle cx="114" cy="70" r="7" />
            </g>
            <g className="plane-propeller" transform="translate(199 73)">
              <circle cx="0" cy="0" r="7" fill="#e65e58" stroke="#153b49" strokeWidth="4" />
              <path
                d="M0-38c10 0 12 13 7 32L0 0l-7-6c-5-19-3-32 7-32z"
                fill="#fff"
                stroke="#153b49"
                strokeWidth="4"
              />
              <path
                d="M0 38c-10 0-12-13-7-32L0 0l7 6c5 19 3 32-7 32z"
                fill="#fff"
                stroke="#153b49"
                strokeWidth="4"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

export function RedirectCheckingScreen() {
  return (
    <main className="min-h-svh bg-background px-4 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <LinkFlowHeader />
      <section
        className="mx-auto flex min-h-[calc(100svh-6rem)] w-full max-w-md flex-col justify-center py-10"
        aria-busy="true"
      >
        <PlaneScene />
        <div className="mt-6 text-center" role="status">
          <h1 className="text-xl font-semibold tracking-tight">Checking this short link</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Looking up the destination before you leave Lihat.in.
          </p>
        </div>
      </section>
    </main>
  );
}

export function RedirectExperience({
  preview,
  redirectPath,
  protectedLink = false,
}: RedirectExperienceProps) {
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [isPaused, setIsPaused] = useState(!preview.destinationHost);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirected = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSecure = preview.destinationScheme === "https";
  const title = preview.title?.trim();
  const description = preview.description?.trim();
  const connectionSummary = !preview.destinationHost
    ? "Preview unavailable"
    : isSecure
      ? "Encrypted with HTTPS"
      : preview.destinationScheme === "http"
        ? "Not encrypted"
        : "Connection details unavailable";
  const progress = REDIRECT_SECONDS - countdown;
  const reportHref = `/support/new?reason=SUSPICIOUS_LINK&code=${encodeURIComponent(preview.shortCode)}`;

  const continueToDestination = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    setIsRedirecting(true);
    window.location.assign(redirectPath);
  }, [redirectPath]);

  useEffect(() => {
    if (isPaused || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, isPaused]);

  useEffect(() => {
    if (countdown === 0) continueToDestination();
  }, [continueToDestination, countdown]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setIsPaused(true);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.from("[data-reveal]", {
          y: 12,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: "power3.out",
        });
      }, cardRef);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return (
    <main className="min-h-svh bg-background px-4 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <LinkFlowHeader helpHref={reportHref} />

      <div className="mx-auto grid min-h-[calc(100svh-6rem)] w-full max-w-5xl items-center gap-7 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:py-10">
        <section aria-labelledby="redirect-title" className="mx-auto w-full max-w-lg lg:max-w-none">
          <div className="mx-auto max-w-[240px] lg:max-w-none">
            <PlaneScene />
          </div>
          <h1
            id="redirect-title"
            className="mt-5 text-balance text-2xl font-semibold tracking-tight lg:mt-7 lg:text-3xl"
          >
            You&apos;re leaving Lihat.in
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground lg:text-base lg:leading-7">
            Short links can hide where they lead. Take a second to review this destination.
          </p>
        </section>

        <div
          ref={cardRef}
          className="mx-auto w-full max-w-lg rounded-2xl border bg-card p-5 sm:p-6"
        >
          <section data-reveal aria-labelledby="destination-label">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="destination-label"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Globe2 className="size-4" aria-hidden="true" /> Destination
              </h2>
              {protectedLink && (
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5" />
                  Passcode verified
                </Badge>
              )}
            </div>
            <p className="mt-3 text-xl font-semibold leading-snug tracking-tight [overflow-wrap:anywhere] sm:text-2xl">
              {preview.destinationHost || "Destination preview unavailable"}
            </p>
            {preview.destinationHost && (
              <p
                className={`mt-2 inline-flex items-center gap-1.5 text-xs ${isSecure ? "text-muted-foreground" : "text-amber-700 dark:text-amber-300"}`}
              >
                {isSecure ? (
                  <LockKeyhole className="size-3.5" />
                ) : (
                  <TriangleAlert className="size-3.5" />
                )}
                {connectionSummary}
              </p>
            )}
          </section>

          <div data-reveal className="mt-5 flex gap-2.5 border-y py-4">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-muted-foreground">
              <strong className="font-medium text-foreground">
                {preview.destinationHost
                  ? "Check the domain carefully."
                  : "Continue only if you trust the sender."}
              </strong>{" "}
              Lihat.in does not endorse the destination. Never enter a password or payment details
              on a site you do not recognize.
            </p>
          </div>

          <div data-reveal className="mt-4">
            <div className="flex min-h-10 items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="off">
                {isPaused ? (
                  "Automatic redirect paused"
                ) : (
                  <>
                    Continuing in{" "}
                    <span className="font-medium tabular-nums text-foreground">{countdown}s</span>
                  </>
                )}
              </p>
              {preview.destinationHost && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPaused((value) => !value)}
                  aria-label={isPaused ? "Resume automatic redirect" : "Pause automatic redirect"}
                >
                  {isPaused ? (
                    <CirclePlay className="size-4" />
                  ) : (
                    <CirclePause className="size-4" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              )}
            </div>
            <span role="status" className="sr-only">
              {isPaused
                ? "Automatic redirect paused."
                : "Automatic redirect running. Use Pause to review the destination."}
            </span>
            <div
              role="progressbar"
              aria-label="Automatic redirect"
              aria-valuemin={0}
              aria-valuemax={REDIRECT_SECONDS}
              aria-valuenow={progress}
              aria-valuetext={isPaused ? "Paused" : `Continuing in ${countdown} seconds`}
              className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${(progress / REDIRECT_SECONDS) * 100}%` }}
              />
            </div>
          </div>

          <div data-reveal className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              className="min-h-11"
              onClick={continueToDestination}
              disabled={isRedirecting}
            >
              {isRedirecting
                ? "Opening destination…"
                : preview.destinationHost
                  ? "Continue to website"
                  : "Continue anyway"}
              <ExternalLink className="size-4" />
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11">
              <Link href="/">Stay on Lihat.in</Link>
            </Button>
          </div>

          <details
            className="group mt-5 border-t pt-4"
            onToggle={(event) => {
              if (event.currentTarget.open) setIsPaused(true);
            }}
          >
            <summary className="w-fit cursor-pointer rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              Link details
            </summary>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Short link</dt>
                <dd className="mt-1 font-mono text-xs leading-5 [overflow-wrap:anywhere]">
                  lihat.in/{preview.shortCode}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Access</dt>
                <dd className="mt-1">
                  {protectedLink ? "Passcode protected" : "Public short link"}
                </dd>
              </div>
              {title && (
                <div>
                  <dt className="text-muted-foreground">Link title</dt>
                  <dd className="mt-1 [overflow-wrap:anywhere]">{title}</dd>
                </div>
              )}
              {description && (
                <div>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="mt-1 leading-6 [overflow-wrap:anywhere]">{description}</dd>
                </div>
              )}
            </dl>
            {(title || description) && (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Title and description are provided by the link creator.
              </p>
            )}
          </details>

          <Link
            href={reportHref}
            className="mt-5 inline-flex min-h-8 items-center gap-1.5 rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Flag className="size-3.5" />
            Report suspicious link
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
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

function createDestinationCopy(preview: ShortLinkPreview) {
  const providedTitle = preview.title?.trim();
  const providedDescription = preview.description?.trim();
  const friendlyHost = preview.destinationHost.replace(/^www\./i, "");
  const siteName = friendlyHost
    .split(".")[0]
    ?.replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return {
    title:
      (providedTitle
        ? providedTitle.charAt(0).toUpperCase() + providedTitle.slice(1)
        : undefined) ||
      (siteName ? `Open ${siteName}` : "External destination"),
    description:
      providedDescription ||
      (preview.destinationHost
        ? `This short link opens ${preview.destinationHost}. Review the domain and connection details before continuing.`
        : "The destination could not be previewed. Continue only if you recognize and trust the person who shared this link."),
    isGeneratedTitle: !providedTitle,
    isGeneratedDescription: !providedDescription,
  };
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
          <stop offset="0" stopColor="#eefcff" />
          <stop offset=".58" stopColor="#d9f3f9" />
          <stop offset="1" stopColor="#c3e7f0" />
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
        <g className="sun-rays" stroke="#f4bf55" strokeWidth="3" strokeLinecap="round" opacity=".72">
          <path d="M474 6v9M474 71v9M437 43h9M502 43h9" />
          <path d="M448 17l7 7M493 62l7 7M448 69l7-7M493 24l7-7" />
        </g>
        <circle cx="474" cy="43" r="29" fill="#fff3bd" opacity=".42" />
        <circle className="sun-core" cx="474" cy="43" r="18" fill="#ffd66b" stroke="#fff8dc" strokeWidth="5" />
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
            <path d="M17 62L0 39h22l29 21" fill="#e55d59" stroke="#153b49" strokeWidth="5" strokeLinejoin="round" />
            <path d="M17 88L3 109h24l25-19" fill="#e55d59" stroke="#153b49" strokeWidth="5" strokeLinejoin="round" />
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
            <path d="M136 48c15 2 28 7 39 15h-44z" fill="#7fc8dc" stroke="#153b49" strokeWidth="4" />
            <g fill="#76bfd3" stroke="#153b49" strokeWidth="3">
              <circle cx="62" cy="70" r="7" />
              <circle cx="88" cy="70" r="7" />
              <circle cx="114" cy="70" r="7" />
            </g>
            <g className="plane-propeller" transform="translate(199 73)">
              <circle cx="0" cy="0" r="7" fill="#e65e58" stroke="#153b49" strokeWidth="4" />
              <path d="M0-38c10 0 12 13 7 32L0 0l-7-6c-5-19-3-32 7-32z" fill="#fff" stroke="#153b49" strokeWidth="4" />
              <path d="M0 38c-10 0-12-13-7-32L0 0l7 6c5 19 3 32-7 32z" fill="#fff" stroke="#153b49" strokeWidth="4" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

export function RedirectCheckingScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4fafb] px-4 py-10 text-[#153b49]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(102,203,225,0.18),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(21,59,73,0.08),transparent_30%)]" />
      <section className="relative w-full max-w-xl rounded-[2rem] border border-[#cbe6ed] bg-white/90 p-5 shadow-[0_30px_80px_rgba(26,87,104,0.14)] backdrop-blur sm:p-8">
        <PlaneScene compact />
        <div className="mt-6 text-center" aria-live="polite">
          <p className="text-lg font-semibold">Checking this short link</p>
          <p className="mt-1 text-sm text-[#5d7780]">
            Looking up the destination before you leave Lihatin.
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
  const hasRedirected = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSecure = preview.destinationScheme === "https";
  const destinationCopy = createDestinationCopy(preview);
  const connectionSummary = !preview.destinationHost
    ? "Preview unavailable"
    : isSecure
      ? "Encrypted with HTTPS"
      : "Not encrypted";
  const progress = ((REDIRECT_SECONDS - countdown) / REDIRECT_SECONDS) * 100;

  const continueToDestination = useCallback(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    window.location.assign(redirectPath);
  }, [redirectPath]);

  useEffect(() => {
    if (isPaused || countdown <= 0) return;
    const timer = window.setTimeout(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [countdown, isPaused]);

  useEffect(() => {
    if (countdown === 0) continueToDestination();
  }, [continueToDestination, countdown]);

  useEffect(() => {
    if (!cardRef.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.from("[data-reveal]", {
          y: 18,
          opacity: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
        });
      }, cardRef);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4fafb] px-4 py-5 text-[#153b49] sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(102,203,225,0.2),transparent_28%),radial-gradient(circle_at_88%_82%,rgba(21,59,73,0.09),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-20 top-1/3 size-52 rounded-full border border-[#b7dfe9]/60" />
      <div className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full border border-[#b7dfe9]/50" />

      <div className="relative mx-auto max-w-3xl">
        <header className="mb-4 flex items-center justify-between px-1 sm:mb-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e93ad]">
            <Image src="/logo.svg" alt="" width={34} height={34} className="size-8 rounded-md" priority />
            <span className="text-sm font-bold tracking-tight">Lihatin</span>
          </Link>
          <Badge className="border-[#b8dfe8] bg-white/70 px-3 py-1 text-[#315f6c]" variant="outline">
            <ShieldCheck className="size-3.5 text-[#2e93ad]" />
            Destination preview
          </Badge>
        </header>

        <div
          ref={cardRef}
          className="overflow-hidden rounded-[1.75rem] border border-[#c9e2e8] bg-white shadow-[0_32px_90px_rgba(26,87,104,0.15)] sm:rounded-[2rem]"
        >
          <div data-reveal className="border-b border-[#d8ebef] bg-[#ecf8fa] p-3 sm:p-5">
            <PlaneScene />
          </div>

          <div className="p-5 sm:p-8">
            <div data-reveal className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#408399]">Before you continue</p>
                <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[#102f3b] sm:text-3xl">
                  You&apos;re leaving Lihatin
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#5d7780] sm:text-base">
                  Short links can hide where they lead. Take a second to review this destination.
                </p>
              </div>
              <Badge className="shrink-0 border-[#b8dfe8] bg-[#edf9fb] px-3 py-1.5 text-[#286d80]" variant="outline">
                {protectedLink ? <LockKeyhole className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                {protectedLink ? "Passcode verified" : "Link found"}
              </Badge>
            </div>

            <section data-reveal className="mt-6 rounded-2xl border border-[#cfe4e9] bg-[#f8fcfd] p-4 sm:p-5" aria-label="Destination details">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#dff3f7] text-[#247b92]">
                  <Globe2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#69858d]">Destination</p>
                  {preview.destinationHost ? (
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                      <p className="break-all text-lg font-bold text-[#102f3b]">{preview.destinationHost}</p>
                      <Badge
                        variant="outline"
                        className={
                          isSecure
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }
                      >
                        {isSecure ? <LockKeyhole className="size-3" /> : <TriangleAlert className="size-3" />}
                        {isSecure ? "HTTPS" : "Not HTTPS"}
                      </Badge>
                    </div>
                  ) : (
                    <p className="mt-1.5 font-semibold text-amber-800">Destination preview unavailable</p>
                  )}
                  <div className="mt-3 border-l-2 border-[#b8dfe8] pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#69858d]">Link title</p>
                      <span className="text-[10px] font-medium text-[#7b939a]">
                        {destinationCopy.isGeneratedTitle ? "Generated from domain" : "Provided by link creator"}
                      </span>
                    </div>
                    <p className="mt-1 text-base font-semibold text-[#294b55]">{destinationCopy.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#668087]">
                      {destinationCopy.description}
                    </p>
                    {destinationCopy.isGeneratedDescription && (
                      <p className="mt-1.5 text-[11px] text-[#84999f]">
                        No description was provided, so Lihatin generated this safety summary.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <dl className="mt-4 grid gap-2 border-t border-[#dbecef] pt-4 min-[480px]:grid-cols-3">
                <div className="rounded-xl bg-white px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a9299]">Connection</dt>
                  <dd className="mt-1 text-xs font-semibold text-[#315f6c]">{connectionSummary}</dd>
                </div>
                <div className="rounded-xl bg-white px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a9299]">Opens</dt>
                  <dd className="mt-1 text-xs font-semibold text-[#315f6c]">External website</dd>
                </div>
                <div className="rounded-xl bg-white px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a9299]">Access</dt>
                  <dd className="mt-1 text-xs font-semibold text-[#315f6c]">
                    {protectedLink ? "Passcode protected" : "Public short link"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#dbecef] pt-3 text-xs text-[#69858d]">
                <span>Short link</span>
                <code className="max-w-[70%] truncate rounded-md bg-white px-2 py-1 font-semibold text-[#315f6c]">
                  lihat.in/{preview.shortCode}
                </code>
              </div>
            </section>

            <div
              data-reveal
              className={
                preview.destinationHost
                  ? "mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950"
                  : "mt-4 flex gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-orange-950"
              }
            >
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="text-sm leading-5">
                <p className="font-semibold">
                  {preview.destinationHost ? "Check the domain carefully" : "Continue only if you trust the sender"}
                </p>
                <p className="mt-1 text-amber-900/75">
                  Lihatin shortens this link but does not endorse the destination. Never enter a password or payment
                  details on a site you do not recognize.
                </p>
              </div>
            </div>

            <div data-reveal className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-[#607c84]" aria-live="polite">
                <span>
                  {isPaused
                    ? preview.destinationHost
                      ? "Redirect paused"
                      : "Automatic redirect paused for your safety"
                    : `Continuing in ${countdown} second${countdown === 1 ? "" : "s"}`}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dfedf0]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#63c1d8] to-[#277e98] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div data-reveal className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Button
                size="lg"
                onClick={continueToDestination}
                className="h-12 rounded-xl text-black shadow-sm"
                variant="secondary"
              >
                Continue to {preview.destinationHost || "destination"}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsPaused((value) => !value)}
                className="h-12 rounded-xl border-[#bfdce3] bg-white px-5 text-[#315f6c] hover:bg-[#eff8fa]"
              >
                {isPaused ? <CirclePlay className="size-4" /> : <CirclePause className="size-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            </div>

            <div data-reveal className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#69858d]">
              <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[#244f5c] hover:underline">
                Stay on Lihatin
              </Link>
              <Link
                href={`/support?topic=suspicious-link&code=${encodeURIComponent(preview.shortCode)}`}
                className="inline-flex items-center gap-1.5 hover:text-[#244f5c] hover:underline"
              >
                <Flag className="size-3.5" />
                Report suspicious link
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <ExternalLink className="size-3.5" />
                Opens an external website
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#789097]">
          Lihatin never asks for your password on a redirect screen.
        </p>
      </div>
    </main>
  );
}

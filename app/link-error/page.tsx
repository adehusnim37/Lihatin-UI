"use client";

import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import {
  ArrowLeft,
  ArrowRight,
  BatteryWarning,
  Clock3,
  House,
  KeyRound,
  Link2,
  RadioTower,
  RefreshCw,
  SearchX,
  ShieldX,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

gsap.registerPlugin(MorphSVGPlugin);

interface ErrorConfig {
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  signal: string;
  title: string;
}

const errorConfig: Record<string, ErrorConfig> = {
  not_found: {
    description:
      "The destination could not be resolved. It may have moved, been deleted, or never existed.",
    eyebrow: "Route unavailable",
    icon: SearchX,
    signal: "No destination",
    title: "This link leads nowhere.",
  },
  expired: {
    description:
      "The owner placed a time limit on this link and its access window has now closed.",
    eyebrow: "Access window closed",
    icon: Clock3,
    signal: "Link expired",
    title: "This link had its moment.",
  },
  forbidden: {
    description:
      "This destination is unavailable because it did not pass Lihat.in safety or access checks.",
    eyebrow: "Route blocked",
    icon: ShieldX,
    signal: "Access denied",
    title: "We stopped this route.",
  },
  click_limit: {
    description:
      "This link has reached the maximum number of visits allowed by its owner.",
    eyebrow: "Capacity reached",
    icon: BatteryWarning,
    signal: "Limit reached",
    title: "No clicks left to give.",
  },
  invalid_passcode: {
    description:
      "That passcode did not unlock the destination. Check the code and give it another try.",
    eyebrow: "Verification failed",
    icon: KeyRound,
    signal: "Code rejected",
    title: "That code didn’t match.",
  },
  rate_limit: {
    description:
      "This link received too many requests in a short time. Let the signal settle, then retry.",
    eyebrow: "Traffic protection",
    icon: RadioTower,
    signal: "Temporarily paused",
    title: "The route needs a breather.",
  },
  network: {
    description:
      "We could not reach the link service. Your connection may be interrupted, or our server may be unavailable.",
    eyebrow: "Connection interrupted",
    icon: WifiOff,
    signal: "Signal lost",
    title: "We lost the connection.",
  },
  error: {
    description:
      "An unexpected problem interrupted this route before we could reach its destination.",
    eyebrow: "Unexpected interruption",
    icon: TriangleAlert,
    signal: "Route interrupted",
    title: "The link broke mid-flight.",
  },
};

const morphPaths = [
  "M89 304C78 220 137 132 234 112C332 92 377 151 452 147C536 143 612 192 602 290C592 391 514 448 420 437C339 428 300 474 206 446C122 421 98 373 89 304Z",
  "M78 268C101 166 192 105 282 139C367 171 414 101 508 146C597 188 618 276 572 359C527 441 435 433 352 421C268 409 205 472 128 413C64 364 61 341 78 268Z",
  "M101 331C72 235 128 156 220 130C310 104 370 164 451 137C541 107 615 189 603 284C591 378 528 444 430 429C344 416 286 463 193 433C111 406 122 399 101 331Z",
];

function ErrorVisual({
  code,
  config,
  status,
}: {
  code: string;
  config: ErrorConfig;
  status: string;
}) {
  const visualRef = useRef<HTMLDivElement>(null);
  const Icon = config.icon;

  useEffect(() => {
    const visual = visualRef.current;

    if (!visual) {
      return;
    }

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const morph = gsap.timeline({
          repeat: -1,
          yoyo: true,
          defaults: {
            duration: 2.8,
            ease: "sine.inOut",
          },
        });

        morph
          .to("[data-error-blob]", { morphSVG: morphPaths[1] })
          .to("[data-error-blob]", { morphSVG: morphPaths[2] });

        gsap.to("[data-error-orbit]", {
          duration: 18,
          ease: "none",
          repeat: -1,
          rotation: 360,
          transformOrigin: "center",
        });
        gsap.to("[data-error-orbit-reverse]", {
          duration: 24,
          ease: "none",
          repeat: -1,
          rotation: -360,
          transformOrigin: "center",
        });
        gsap.to("[data-error-signal]", {
          duration: 1.8,
          ease: "none",
          repeat: -1,
          strokeDashoffset: -48,
        });
        gsap.to("[data-error-propeller]", {
          duration: 0.22,
          ease: "none",
          repeat: -1,
          rotation: 360,
          transformOrigin: "center",
        });
        gsap.to("[data-error-node='source']", {
          duration: 2.6,
          ease: "sine.inOut",
          repeat: -1,
          rotation: -1.2,
          y: -8,
          yoyo: true,
        });
        gsap.to("[data-error-node='result']", {
          duration: 2.9,
          ease: "sine.inOut",
          repeat: -1,
          rotation: 1.2,
          y: 9,
          yoyo: true,
        });
        gsap.to("[data-error-particle]", {
          autoAlpha: 0.18,
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          scale: 0.55,
          stagger: {
            each: 0.24,
            from: "random",
          },
          transformOrigin: "center",
          yoyo: true,
        });
        gsap.from("[data-error-mark]", {
          autoAlpha: 0,
          duration: 0.7,
          ease: "back.out(1.8)",
          rotation: -7,
          scale: 0.65,
        });

        const crash = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.9,
        });

        crash
          .set("[data-error-plane]", {
            autoAlpha: 0,
            rotation: 3,
            scale: 0.36,
            x: -70,
            y: 155,
          })
          .set("[data-error-impact]", {
            autoAlpha: 0,
            scale: 0.2,
            transformOrigin: "center",
          })
          .set("[data-error-explosion]", {
            autoAlpha: 0,
            rotation: -12,
            scale: 0.2,
            transformOrigin: "center",
          })
          .set("[data-error-smoke]", {
            autoAlpha: 0,
            scale: 0.25,
            transformOrigin: "center",
            x: 0,
            y: 0,
          })
          .set("[data-error-debris]", {
            autoAlpha: 0,
            scale: 0,
            transformOrigin: "center",
            x: 0,
            y: 0,
          })
          .to("[data-error-plane]", {
            autoAlpha: 1,
            duration: 0.16,
          })
          .to("[data-error-plane]", {
            duration: 1.25,
            ease: "sine.inOut",
            rotation: -3,
            x: 245,
            y: 164,
          })
          .to("[data-error-plane]", {
            duration: 0.46,
            ease: "power1.in",
            rotation: 14,
            x: 370,
            y: 220,
          })
          .to("[data-error-plane]", {
            duration: 0.82,
            ease: "power2.in",
            rotation: 58,
            scale: 0.32,
            x: 536,
            y: 407,
          })
          .to(
            "[data-error-impact]",
            {
              autoAlpha: 0.58,
              duration: 0.12,
              ease: "power2.out",
              scale: 0.75,
            },
            "-=0.08",
          )
          .to(
            "[data-error-debris]",
            {
              autoAlpha: 0.7,
              duration: 0.14,
              ease: "power2.out",
              scale: 1,
              stagger: 0.025,
            },
            "<",
          )
          .to(
            "[data-error-explosion]",
            {
              autoAlpha: 1,
              duration: 0.2,
              ease: "back.out(2.4)",
              rotation: 0,
              scale: 1,
            },
            "<",
          )
          .to(
            "[data-error-smoke]",
            {
              autoAlpha: 0.62,
              duration: 0.26,
              ease: "power2.out",
              scale: 1,
              stagger: 0.035,
            },
            "<0.04",
          )
          .to("[data-error-plane]", {
            autoAlpha: 0,
            duration: 0.1,
          })
          .to(
            "[data-error-impact]",
            {
              autoAlpha: 0,
              duration: 0.65,
              ease: "power2.out",
              scale: 1.8,
            },
            "<",
          )
          .to(
            "[data-error-explosion]",
            {
              autoAlpha: 0,
              duration: 0.48,
              ease: "power2.in",
              rotation: 8,
              scale: 1.3,
            },
            "<0.18",
          )
          .to(
            "[data-error-smoke]",
            {
              autoAlpha: 0,
              duration: 0.65,
              ease: "power2.out",
              scale: 1.45,
              stagger: 0.035,
              x: (index) => (index - 1.5) * 13,
              y: (index) => -18 - index * 9,
            },
            "<",
          )
          .to(
            "[data-error-debris]",
            {
              autoAlpha: 0,
              duration: 0.5,
              ease: "power2.in",
              stagger: 0.025,
              x: (index) => (index - 2) * 11,
              y: (index) => -20 - index * 7,
            },
            "<",
          );
      }, visual);

      return () => context.revert();
    });

    media.add("(prefers-reduced-motion: reduce)", () => {
      const context = gsap.context(() => {
        gsap.set("[data-error-plane]", {
          autoAlpha: 0.72,
          rotation: 42,
          scale: 0.32,
          x: 500,
          y: 375,
        });
        gsap.set("[data-error-impact]", {
          autoAlpha: 0.32,
          scale: 1,
          transformOrigin: "center",
        });
        gsap.set("[data-error-explosion]", {
          autoAlpha: 0.72,
          rotation: 0,
          scale: 0.9,
          transformOrigin: "center",
        });
      }, visual);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const visual = visualRef.current;

    if (
      !visual ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    gsap.to(visual.querySelector("[data-error-scene]"), {
      duration: 0.75,
      ease: "power3.out",
      rotationX: y * -3,
      rotationY: x * 4,
      transformPerspective: 900,
    });
    gsap.to(visual.querySelector("[data-error-foreground]"), {
      duration: 0.65,
      ease: "power3.out",
      x: x * 15,
      y: y * 10,
    });
  };

  const handlePointerLeave = () => {
    const visual = visualRef.current;

    if (!visual) {
      return;
    }

    gsap.to(
      visual.querySelectorAll(
        "[data-error-scene], [data-error-foreground]",
      ),
      {
        duration: 0.8,
        ease: "power3.out",
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
      },
    );
  };

  return (
    <div
      ref={visualRef}
      className="relative mx-auto w-full max-w-[720px]"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[3.5rem] bg-primary/15 blur-3xl"
      />
      <div
        data-error-scene
        className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/65 bg-card shadow-[0_40px_120px_-55px_color-mix(in_oklab,var(--primary)_65%,transparent)] dark:border-white/10 sm:min-h-[540px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        <svg
          className="absolute inset-0 size-full"
          viewBox="0 0 680 560"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="error-stage" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="var(--background)" />
              <stop offset="0.55" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--third)" stopOpacity="0.38" />
            </linearGradient>
            <linearGradient id="error-blob-fill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.58" />
              <stop offset="1" stopColor="var(--third)" stopOpacity="0.78" />
            </linearGradient>
            <radialGradient id="error-mark-glow">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="680" height="560" fill="url(#error-stage)" />
          <path
            data-error-blob
            d={morphPaths[0]}
            fill="url(#error-blob-fill)"
            opacity="0.56"
          />
          <circle
            cx="340"
            cy="280"
            r="184"
            fill="none"
            opacity="0.2"
            stroke="var(--foreground)"
            strokeDasharray="2 14"
            strokeLinecap="round"
            strokeWidth="2"
            data-error-orbit
          />
          <circle
            cx="340"
            cy="280"
            r="137"
            fill="none"
            opacity="0.15"
            stroke="var(--foreground)"
            strokeDasharray="22 17"
            strokeWidth="1.5"
            data-error-orbit-reverse
          />
          <circle cx="340" cy="280" r="150" fill="url(#error-mark-glow)" />

          <path
            data-error-signal
            d="M84 280C166 280 198 242 264 269C302 284 314 280 322 280M358 280C400 279 421 293 450 324C484 360 510 400 578 426"
            fill="none"
            opacity="0.56"
            stroke="var(--foreground)"
            strokeDasharray="10 14"
            strokeLinecap="round"
            strokeWidth="3"
          />

          <g fill="var(--foreground)" opacity="0.3">
            <circle data-error-particle cx="127" cy="150" r="5" />
            <circle data-error-particle cx="545" cy="161" r="8" />
            <circle data-error-particle cx="590" cy="380" r="4" />
            <circle data-error-particle cx="146" cy="402" r="7" />
            <circle data-error-particle cx="442" cy="94" r="4" />
            <circle data-error-particle cx="265" cy="468" r="5" />
          </g>

          <g
            fill="none"
            stroke="var(--foreground)"
            strokeLinecap="round"
            strokeWidth="12"
          >
            <path d="M319 249L300 230C283 213 256 213 239 230L216 253C199 270 199 297 216 314L235 333" opacity="0.2" />
            <path d="M361 311L380 330C397 347 424 347 441 330L464 307C481 290 481 263 464 246L445 227" opacity="0.2" />
          </g>
        </svg>

        <div className="absolute inset-x-5 top-5 z-30 flex items-center justify-between gap-3 sm:inset-x-7 sm:top-7">
          <span className="rounded-full border border-white/50 bg-card/60 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur-md dark:border-white/10 sm:text-[10px]">
            Route diagnostic
          </span>
          <span className="rounded-full border border-white/50 bg-card/60 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-foreground/60 backdrop-blur-md dark:border-white/10 sm:text-[10px]">
            {status ? `HTTP ${status}` : "Signal 00"}
          </span>
        </div>

        <div
          data-error-foreground
          className="absolute inset-0 z-10"
          style={{ transform: "translateZ(36px)" }}
        >
          <div
            data-error-node="source"
            className="absolute left-[4%] top-[24%] w-[47%] max-w-[260px] rounded-2xl border border-white/65 bg-card/75 p-3 shadow-xl shadow-foreground/5 backdrop-blur-xl dark:border-white/10 sm:left-[7%] sm:top-[27%] sm:p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary sm:size-11">
                <Link2 className="size-4 sm:size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-[0.17em] text-muted-foreground sm:text-[10px]">
                  Short link
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs font-semibold text-foreground sm:text-sm">
                  lihat.in/{code || "unknown"}
                </span>
              </span>
            </div>
          </div>

          <div
            data-error-mark
            className="absolute left-1/2 top-1/2 grid size-[92px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.7rem] border border-white/60 bg-card/80 text-foreground shadow-2xl shadow-foreground/10 backdrop-blur-xl dark:border-white/10 sm:size-[116px] sm:rounded-[2rem]"
          >
            <Icon className="size-9 text-primary sm:size-11" strokeWidth={1.75} />
            <span className="absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full border-4 border-card bg-foreground font-mono text-[10px] font-bold text-background sm:size-8">
              !
            </span>
          </div>

          <div
            data-error-node="result"
            className="absolute right-[4%] top-[19%] w-[43%] max-w-[240px] rounded-2xl border border-white/65 bg-card/75 p-3 shadow-xl shadow-foreground/5 backdrop-blur-xl dark:border-white/10 sm:right-[7%] sm:top-[20%] sm:p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-third/55 sm:size-11">
                <RadioTower className="size-4 sm:size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-[0.17em] text-muted-foreground sm:text-[10px]">
                  Result
                </span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-foreground sm:text-sm">
                  {config.signal}
                </span>
              </span>
            </div>
          </div>
        </div>

        <svg
          className="pointer-events-none absolute inset-0 z-20 size-full"
          viewBox="0 0 680 560"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <filter id="crash-plane-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="9"
                floodColor="var(--foreground)"
                floodOpacity="0.2"
                stdDeviation="8"
              />
            </filter>
          </defs>

          <g data-error-plane filter="url(#crash-plane-shadow)" opacity="0">
            <g transform="translate(-105 -75)">
              <path
                d="M12 64C12 51 23 40 36 40H123C143 40 161 46 176 57L198 73L176 89C161 100 143 106 123 106H36C23 106 12 95 12 82Z"
                fill="var(--card)"
                stroke="var(--foreground)"
                strokeLinejoin="round"
                strokeWidth="5"
              />
              <path
                d="M17 62L0 39H22L51 60M17 88L3 109H27L52 90"
                fill="var(--third)"
                stroke="var(--foreground)"
                strokeLinejoin="round"
                strokeWidth="5"
              />
              <path
                d="M91 59L66 2H93L146 62ZM92 89L70 150H99L147 92Z"
                fill="var(--primary)"
                stroke="var(--foreground)"
                strokeLinejoin="round"
                strokeWidth="5"
              />
              <path
                d="M136 48C151 50 164 55 175 63H131Z"
                fill="var(--secondary)"
                stroke="var(--foreground)"
                strokeWidth="4"
              />
              <g fill="var(--primary)" stroke="var(--foreground)" strokeWidth="3">
                <circle cx="62" cy="70" r="7" />
                <circle cx="88" cy="70" r="7" />
                <circle cx="114" cy="70" r="7" />
              </g>
              <g data-error-propeller transform="translate(199 73)">
                <circle
                  cx="0"
                  cy="0"
                  r="7"
                  fill="var(--third)"
                  stroke="var(--foreground)"
                  strokeWidth="4"
                />
                <path
                  d="M0-38C10-38 12-25 7-6L0 0L-7-6C-12-25-10-38 0-38ZM0 38C-10 38-12 25-7 6L0 0L7 6C12 25 10 38 0 38Z"
                  fill="var(--card)"
                  stroke="var(--foreground)"
                  strokeWidth="4"
                />
              </g>
            </g>
          </g>

          <g transform="translate(556 428)">
            <ellipse
              data-error-impact
              cx="0"
              cy="0"
              rx="34"
              ry="10"
              fill="none"
              opacity="0"
              stroke="var(--foreground)"
              strokeWidth="3"
            />

            <g data-error-explosion opacity="0">
              <path
                d="M0-48L13-27L36-35L32-12L54 0L32 13L38 37L13 31L0 53L-14 31L-38 38L-32 13L-55 0L-32-13L-37-36L-13-29Z"
                fill="var(--primary)"
                stroke="var(--foreground)"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <circle cx="0" cy="0" r="29" fill="var(--card)" />
              <path
                d="M-17-5C-17-19-9-27 0-27C10-27 18-19 18-5C18 4 13 8 9 11V20H3V14H-3V20H-9V11C-14 8-17 4-17-5Z"
                fill="var(--foreground)"
              />
              <circle cx="-7" cy="-7" r="4" fill="var(--card)" />
              <circle cx="8" cy="-7" r="4" fill="var(--card)" />
              <path
                d="M0 0L-3 6H4Z"
                fill="var(--card)"
                stroke="var(--card)"
                strokeLinejoin="round"
              />
            </g>

            <g fill="var(--foreground)">
              <circle data-error-debris cx="-28" cy="-6" r="4" opacity="0" />
              <circle data-error-debris cx="-11" cy="-18" r="5" opacity="0" />
              <circle data-error-debris cx="10" cy="-17" r="3.5" opacity="0" />
              <circle data-error-debris cx="29" cy="-5" r="4.5" opacity="0" />
            </g>
            <g fill="var(--muted-foreground)">
              <circle data-error-smoke cx="-25" cy="-20" r="13" opacity="0" />
              <circle data-error-smoke cx="0" cy="-34" r="17" opacity="0" />
              <circle data-error-smoke cx="25" cy="-18" r="12" opacity="0" />
            </g>
          </g>
        </svg>

        <div className="absolute inset-x-5 bottom-5 z-30 flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/45 sm:inset-x-7 sm:bottom-7 sm:text-[10px]">
          <span>Lihat.in routing layer</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground/45" />
            Interrupted
          </span>
        </div>
      </div>
    </div>
  );
}

function LinkErrorContent() {
  const pageRef = useRef<HTMLElement>(null);
  const searchParams = useSearchParams();

  const code = (searchParams.get("code") || "").trim().slice(0, 80);
  const type = (searchParams.get("type") || "error").trim();
  const status = (searchParams.get("status") || "").trim().slice(0, 3);
  const message = (searchParams.get("message") || "").trim().slice(0, 240);
  const config = errorConfig[type] || errorConfig.error;
  const retryable = ["network", "rate_limit", "error"].includes(type);
  const passcodeRetry = type === "invalid_passcode" && Boolean(code);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) {
      return;
    }

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-error-header]", {
            autoAlpha: 0,
            duration: 0.5,
            y: -12,
          })
          .from(
            "[data-error-reveal]",
            {
              autoAlpha: 0,
              duration: 0.7,
              stagger: 0.075,
              y: 26,
            },
            "-=0.24",
          )
          .from(
            "[data-error-visual]",
            {
              autoAlpha: 0,
              duration: 0.85,
              scale: 0.96,
              x: 35,
            },
            "-=0.72",
          );
      }, page);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  const retryHref = code ? `/${encodeURIComponent(code)}` : "/";
  const passcodeHref = `/${encodeURIComponent(code)}/enter-passcode`;
  const supportHref = `/support?topic=link-error${
    code ? `&code=${encodeURIComponent(code)}` : ""
  }`;

  return (
    <main
      ref={pageRef}
      className="relative isolate min-h-[100svh] overflow-hidden bg-background px-5 py-6 text-foreground sm:px-8 sm:py-8 lg:px-12"
    >
      <div
        aria-hidden="true"
        className="absolute -left-52 top-1/4 -z-10 size-[36rem] rounded-full bg-primary/15 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-56 right-0 -z-10 size-[40rem] rounded-full bg-third/15 blur-[150px]"
      />

      <header
        data-error-header
        className="mx-auto flex w-full max-w-7xl items-center justify-between"
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Lihat.in home"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            className="size-8 rounded-lg sm:size-9"
            priority
          />
          <span className="text-sm font-bold tracking-tight sm:text-base">
            Lihat.in
          </span>
        </Link>
        <Link
          href={supportHref}
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/65 px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
        >
          Get help
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 pb-8 pt-14 sm:pt-16 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:py-12">
        <section className="relative z-10 max-w-xl">
          <div
            data-error-reveal
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 shadow-sm backdrop-blur-sm"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-50 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
              {config.eyebrow}
            </span>
          </div>

          <h1
            data-error-reveal
            className="mt-6 max-w-xl text-balance text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[4.5rem]"
          >
            {config.title}
          </h1>
          <p
            data-error-reveal
            className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            {config.description}
          </p>

          {message && (
            <div
              data-error-reveal
              className="mt-6 max-w-lg rounded-2xl border border-border bg-card/65 p-4 backdrop-blur-sm"
            >
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <TriangleAlert className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Diagnostic detail
                  </p>
                  <p className="mt-1 break-words text-sm leading-6 text-foreground/75">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            data-error-reveal
            className="mt-8 flex flex-col gap-3 min-[430px]:flex-row"
          >
            {passcodeRetry && (
              <Button asChild size="lg" className="group rounded-full px-6">
                <Link href={passcodeHref}>
                  <KeyRound className="size-4" />
                  Try another code
                </Link>
              </Button>
            )}
            {retryable && (
              <Button asChild size="lg" className="group rounded-full px-6">
                <Link href={retryHref}>
                  <RefreshCw className="size-4 transition-transform duration-500 group-hover:rotate-180" />
                  Retry this link
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant={passcodeRetry || retryable ? "outline" : "default"}
              className="group rounded-full bg-card/60 px-6 backdrop-blur-sm"
            >
              <Link href="/">
                {passcodeRetry || retryable ? (
                  <>
                    <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    Back home
                  </>
                ) : (
                  <>
                    <House className="size-4" />
                    Go to homepage
                  </>
                )}
              </Link>
            </Button>
          </div>

          <p
            data-error-reveal
            className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70"
          >
            Reference · {code ? `/${code}` : "unavailable route"}
            {status ? ` · HTTP ${status}` : ""}
          </p>
        </section>

        <div data-error-visual>
          <ErrorVisual code={code} config={config} status={status} />
        </div>
      </div>
    </main>
  );
}

function LinkErrorFallback() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid size-14 place-items-center rounded-2xl bg-primary/15">
          <Image
            src="/logo.svg"
            alt=""
            width={38}
            height={38}
            className="size-9 rounded-xl"
            priority
          />
          <span className="absolute -inset-2 -z-10 animate-ping rounded-[1.4rem] border border-primary/40 motion-reduce:animate-none" />
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Inspecting route
        </span>
      </div>
    </main>
  );
}

export default function LinkErrorPage() {
  return (
    <Suspense fallback={<LinkErrorFallback />}>
      <LinkErrorContent />
    </Suspense>
  );
}

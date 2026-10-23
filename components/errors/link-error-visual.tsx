"use client";

import { gsap } from "gsap";
import { animateExpiredScene, ExpiredTimeScene } from "@/components/errors/expired-time-scene";
import {
  animateRateLimitScene,
  RateLimitTrafficScene,
} from "@/components/errors/rate-limit-traffic-scene";
import { animateRouteErrorScene, RouteErrorScene } from "@/components/errors/route-error-scene";
import { Pause, Play } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const scenes = {
  forbidden: {
    label: "Access denied",
    description:
      "A moving car brakes as a barrier suddenly closes ahead. The padlock clicks shut and an X marks the denied route.",
    caption: "This route is protected",
  },
  click_limit: {
    label: "Visit limit reached",
    description:
      "From the driver's seat, trees pass the windshield while the wipers sweep. The fuel gauge drops to empty, its warning light turns on, and the speedometer falls to zero as the car stops, representing the link's exhausted visit allowance.",
    caption: "No visits left. Ask the owner for a new link.",
  },
  expired: {
    label: "Link expired",
    description:
      "A person raises their wrist to check the time. The camera moves in on their watch, and its clock face changes to Expired, indicating that the link's access window has closed.",
    caption: "The access window has closed",
  },
  rate_limit: {
    label: "Too many requests",
    description:
      "Seen from behind, a car slows into a queue at a red traffic light beneath a Rate Limit sign. Its brake lights turn on while it waits for the request traffic to settle.",
    caption: "Let the traffic settle, then retry",
  },
  invalid_passcode: {
    label: "Passcode rejected",
    description: "A key tries the lock, is rejected, and withdraws. The lock remains closed.",
    caption: "A different passcode is needed",
  },
  network: {
    label: "Connection lost",
    description: "A signal leaves the source but fades in the gap before the destination.",
    caption: "The destination is out of reach",
  },
  error: {
    label: "Route interrupted",
    description:
      "A small robot carries a link parcel, then its motor stutters. Its display signals a fault, its arm drops the parcel, and the delivery stops unexpectedly.",
    caption: "Something interrupted the route",
  },
};

type SceneType = keyof typeof scenes;

const driveTrees = [
  { x: 80, y: 340, scale: 1.25, at: 0, duration: 1.2 },
  { x: 600, y: 340, scale: 1.25, at: 0, duration: 1.2 },
  { x: 95, y: 330, scale: 1.1, at: 0.55, duration: 1.65 },
  { x: 585, y: 330, scale: 1.1, at: 0.55, duration: 1.65 },
  { x: 205, y: 273, scale: 0.65, at: 0.7, duration: 2.3 },
  { x: 475, y: 273, scale: 0.65, at: 0.7, duration: 2.3 },
];

export function LinkErrorVisual({
  type,
  code,
  signal,
}: {
  type: string;
  code: string;
  signal: string;
}) {
  const sceneType: SceneType = Object.hasOwn(scenes, type) ? (type as SceneType) : "error";
  const scene = scenes[sceneType];
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const windshieldId = `${titleId}-windshield`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let inView = true;
    const syncPlayback = () => {
      timelineRef.current?.paused(pausedRef.current || document.hidden || !inView);
    };
    const media = gsap.matchMedia();
    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const reduced = Boolean(context.conditions?.reduced);
        setReducedMotion(reduced);
        if (reduced) return;

        // One bounded sequence per state. The SVG's default is the final, truthful state.
        const timeline = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        timelineRef.current = timeline;
        const request = "[data-state-request]";

        if (sceneType === "forbidden") {
          timeline
            .set("[data-road-barrier]", { rotation: 90, svgOrigin: "340 350" })
            .set("[data-car-lock]", { opacity: 0 })
            .set("[data-car-shackle]", { rotation: -32, svgOrigin: "329 269" })
            .set("[data-car-denied]", { opacity: 0 })
            .set("[data-car-denied-cross]", { strokeDashoffset: 1 })
            .set("[data-car-brake-light]", { opacity: 0.25 })
            .set("[data-car-stop-trail]", { opacity: 0 })
            .fromTo(
              "[data-car]",
              { x: -170, opacity: 1 },
              { x: -35, opacity: 1, duration: 1.05, ease: "none" },
              0,
            )
            .to("[data-road-barrier]", { rotation: 0, duration: 0.38, ease: "power3.out" }, 0.85)
            .to("[data-car]", { x: 0, duration: 0.48, ease: "power3.out" }, 1.05)
            .to("[data-car-brake-light]", { opacity: 1, duration: 0.12 }, 1.05)
            .fromTo(
              "[data-car-stop-trail]",
              { opacity: 0, strokeDashoffset: 24 },
              { opacity: 0.35, strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
              1.12,
            )
            .to("[data-car-lock]", { opacity: 1, duration: 0.24 }, 1.3)
            .to("[data-car-shackle]", { rotation: 0, duration: 0.28, ease: "power2.in" }, 1.65)
            .fromTo(
              "[data-car-denied]",
              { opacity: 0, scale: 0.8 },
              { opacity: 1, scale: 1, duration: 0.3, svgOrigin: "510 280", ease: "power3.out" },
              1.95,
            )
            .to(
              "[data-car-denied-cross]",
              { strokeDashoffset: 0, duration: 0.22, stagger: 0.12, ease: "power2.out" },
              2.1,
            )
            .fromTo(
              "[data-car-denied-ring]",
              { opacity: 0.55, scale: 0.9 },
              {
                opacity: 0,
                scale: 1.35,
                duration: 0.8,
                svgOrigin: "510 280",
                ease: "power2.out",
                immediateRender: false,
              },
              2,
            )
            .to("[data-car-stop-trail]", { opacity: 0, duration: 0.5 }, 2.8);
        } else if (sceneType === "click_limit") {
          timeline
            .set("[data-limit-notice]", { opacity: 0 })
            .fromTo(
              "[data-drive-lane]",
              { strokeDashoffset: 0 },
              { strokeDashoffset: -520, duration: 3, ease: "sine.out" },
              0,
            )
            .fromTo(
              "[data-drive-wheel]",
              { attr: { transform: "rotate(-2 185 389)" } },
              {
                attr: { transform: "rotate(2 185 389)" },
                duration: 0.4,
                repeat: 3,
                yoyo: true,
                ease: "sine.inOut",
              },
              0,
            )
            .to(
              "[data-drive-wheel]",
              { attr: { transform: "rotate(0 185 389)" }, duration: 0.35, ease: "power2.out" },
              2.65,
            )
            .fromTo(
              "[data-drive-wiper='left']",
              { attr: { transform: "rotate(0 215 322)" } },
              {
                attr: { transform: "rotate(-68 215 322)" },
                duration: 0.55,
                repeat: 3,
                yoyo: true,
                ease: "sine.inOut",
              },
              0,
            )
            .fromTo(
              "[data-drive-wiper='right']",
              { attr: { transform: "rotate(0 405 322)" } },
              {
                attr: { transform: "rotate(-68 405 322)" },
                duration: 0.55,
                repeat: 3,
                yoyo: true,
                ease: "sine.inOut",
              },
              0,
            )
            .fromTo(
              "[data-fuel-needle]",
              { attr: { transform: "rotate(70)" } },
              { attr: { transform: "rotate(0)" }, duration: 2.4, ease: "sine.inOut" },
              0,
            )
            .fromTo("[data-fuel-lamp]", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.4)
            .fromTo(
              "[data-speed-needle]",
              { attr: { transform: "rotate(135)" } },
              { attr: { transform: "rotate(0)" }, duration: 2.4, ease: "sine.inOut" },
              0.6,
            )
            .fromTo(
              "[data-drive-cockpit]",
              { y: 0 },
              { y: 3, duration: 0.15, ease: "power2.out" },
              2.65,
            )
            .to("[data-drive-cockpit]", { y: 0, duration: 0.3, ease: "power2.out" }, 2.8)
            .fromTo("[data-limit-notice]", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.8);

          driveTrees.forEach((tree, index) => {
            const selector = `[data-drive-tree='${index}']`;
            timeline.fromTo(
              selector,
              {
                attr: { transform: `translate(${tree.x < 340 ? 300 : 380} 195) scale(0.14)` },
                opacity: 0,
              },
              {
                attr: { transform: `translate(${tree.x} ${tree.y}) scale(${tree.scale})` },
                opacity: 1,
                duration: tree.duration,
                ease: index < 4 ? "none" : "power2.out",
              },
              tree.at,
            );
            if (index < 4) {
              timeline.to(selector, { opacity: 0, duration: 0.15 }, tree.at + tree.duration - 0.15);
            }
          });
        } else if (sceneType === "expired") {
          animateExpiredScene(timeline);
        } else if (sceneType === "rate_limit") {
          animateRateLimitScene(timeline);
        } else if (sceneType === "invalid_passcode") {
          timeline
            .fromTo("[data-passcode-key]", { x: -55 }, { x: 0, duration: 0.9, ease: "power2.out" })
            .to("[data-passcode-key]", {
              rotation: -12,
              duration: 0.16,
              transformOrigin: "right center",
              repeat: 3,
              yoyo: true,
            })
            .fromTo("[data-rejected-mark]", { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1)
            .to("[data-passcode-key]", { x: -55, duration: 0.6, ease: "power2.inOut" }, "+=0.4");
        } else if (sceneType === "network") {
          timeline
            .fromTo(
              "[data-network-wave]",
              { scale: 0.5, opacity: 0.8 },
              {
                scale: 1.2,
                opacity: 0,
                duration: 1.8,
                stagger: 0.3,
                transformOrigin: "center",
                ease: "power2.out",
              },
            )
            .fromTo(
              request,
              { x: -95, opacity: 0 },
              { x: 30, opacity: 1, duration: 1.2, ease: "none" },
              0,
            )
            .to(request, { opacity: 0, duration: 0.35 }, 1.2);
        } else {
          animateRouteErrorScene(timeline);
        }

        syncPlayback();
        return () => {
          timelineRef.current = null;
        };
      },
      root,
    );

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      media.revert();
    };
  }, [sceneType]);

  const togglePlayback = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    timelineRef.current?.paused(pausedRef.current);
  };

  return (
    <div
      ref={rootRef}
      data-link-error-type={sceneType}
      className={`relative mx-auto w-full max-w-[600px] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground ${sceneType === "click_limit" || sceneType === "expired" || sceneType === "rate_limit" || sceneType === "error" ? "pb-8 sm:pb-0" : ""}`}
    >
      <div className="absolute inset-x-5 top-5 flex min-w-0 items-start justify-between gap-4 sm:inset-x-7 sm:top-7">
        <div className="min-w-0">
          <span className="block text-xs text-muted-foreground">Short link</span>
          <span
            className="mt-1 block truncate text-sm font-medium"
            title={`lihat.in/${code || "unknown"}`}
          >
            lihat.in/{code || "unknown"}
          </span>
        </div>
        <span className="max-w-[48%] text-right text-xs font-medium text-primary-ink">
          {signal}
        </span>
      </div>

      <svg
        className={`block h-auto w-full ${sceneType === "click_limit" || sceneType === "expired" || sceneType === "rate_limit" || sceneType === "error" ? "mt-4 sm:mt-0" : ""}`}
        viewBox="0 0 680 560"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>{scene.label}</title>
        <desc id={descriptionId}>{scene.description}</desc>
        <g aria-hidden="true">
          {sceneType !== "forbidden" &&
            sceneType !== "click_limit" &&
            sceneType !== "expired" &&
            sceneType !== "rate_limit" &&
            sceneType !== "error" && (
              <>
                <path
                  d="M48 310H632"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="2"
                  strokeDasharray="5 10"
                />
                <circle cx="64" cy="310" r="7" fill="var(--primary)" />
                <circle cx="616" cy="310" r="7" fill="var(--muted-foreground)" opacity="0.4" />
              </>
            )}

          {sceneType === "forbidden" && (
            <>
              {/* The barrier is on the exact centerline; the car and rejection mark flank it. */}
              <path d="M80 222H600M80 338H600" fill="none" stroke="var(--border)" strokeWidth="2" />
              <path
                d="M80 280H165M410 280H600"
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
                strokeDasharray="12 12"
              />
              <path
                data-car-stop-trail
                d="M145 260H169M145 300H169"
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="3"
                strokeDasharray="24"
                strokeLinecap="round"
                opacity="0"
              />

              <RouteCar />

              <g data-road-barrier>
                <path
                  d="M340 350V218"
                  stroke="var(--foreground)"
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                <path
                  d="M340 350V218"
                  stroke="var(--primary)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M335 231L345 241M335 254L345 264M335 300L345 310M335 323L345 333"
                  stroke="var(--primary-foreground)"
                  strokeWidth="5"
                />
              </g>
              <rect
                x="325"
                y="344"
                width="30"
                height="24"
                rx="6"
                fill="var(--card)"
                stroke="var(--foreground)"
                strokeWidth="2.5"
              />
              <circle cx="340" cy="355" r="4" fill="var(--primary-ink)" />

              <g data-car-lock>
                <path
                  data-car-shackle
                  d="M329 269V257A11 11 0 0 1 351 257V269"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <rect
                  x="321"
                  y="269"
                  width="38"
                  height="32"
                  rx="8"
                  fill="var(--primary)"
                  stroke="var(--foreground)"
                  strokeWidth="2.5"
                />
                <path
                  d="M340 280V290"
                  stroke="var(--primary-foreground)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              <circle
                data-car-denied-ring
                cx="510"
                cy="280"
                r="36"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                opacity="0"
              />
              <g data-car-denied>
                <circle
                  cx="510"
                  cy="280"
                  r="26"
                  fill="var(--card)"
                  stroke="var(--foreground)"
                  strokeWidth="2.5"
                />
                <g fill="none" stroke="var(--primary-ink)" strokeWidth="4" strokeLinecap="round">
                  <path
                    data-car-denied-cross
                    d="M501 271L519 289"
                    pathLength="1"
                    strokeDasharray="1"
                  />
                  <path
                    data-car-denied-cross
                    d="M519 271L501 289"
                    pathLength="1"
                    strokeDasharray="1"
                  />
                </g>
              </g>
            </>
          )}

          {sceneType === "click_limit" && (
            <g data-drive-cockpit>
              <defs>
                <clipPath id={windshieldId}>
                  <path d="M114 145Q340 115 566 145L598 330H82Z" />
                </clipPath>
              </defs>
              <g clipPath={`url(#${windshieldId})`}>
                <path d="M80 125H600V335H80Z" fill="var(--accent)" />
                <path d="M80 190H600V335H80Z" fill="var(--third)" opacity="0.12" />
                <path d="M326 185H354L500 335H180Z" fill="var(--background)" />
                <path
                  d="M320 185L173 335M360 185L507 335"
                  fill="none"
                  stroke="var(--muted-foreground)"
                  strokeWidth="2"
                  opacity="0.35"
                />
                <path
                  data-drive-lane
                  d="M340 185V335"
                  fill="none"
                  stroke="var(--primary-ink)"
                  strokeWidth="3"
                  strokeDasharray="10 16"
                  opacity="0.6"
                />
                <path
                  d="M80 190H326M354 190H600"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="2"
                />
                {driveTrees.map((tree, index) => (
                  <g
                    key={index}
                    data-drive-tree={index}
                    transform={`translate(${tree.x} ${tree.y}) scale(${tree.scale})`}
                    opacity={index < 4 ? 0 : 1}
                  >
                    <path
                      d="M0-64L-24-27H-13L-32 0H32L13-27H24Z"
                      fill="var(--primary-ink)"
                      opacity="0.65"
                    />
                    <path
                      d="M0-2V17"
                      stroke="var(--foreground)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </g>
                ))}
                <g data-drive-wiper="left">
                  <path
                    d="M215 322L304 307"
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M278 310L330 302"
                    stroke="var(--foreground)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </g>
                <g data-drive-wiper="right">
                  <path
                    d="M405 322L494 307"
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M468 310L520 302"
                    stroke="var(--foreground)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </g>
              </g>
              <path
                d="M82 330L114 145Q340 115 566 145L598 330"
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path d="M340 130V151" stroke="var(--foreground)" strokeWidth="4" />
              <rect
                x="307"
                y="151"
                width="66"
                height="20"
                rx="6"
                fill="var(--card)"
                stroke="var(--foreground)"
                strokeWidth="2"
              />

              <path
                d="M80 328Q340 302 600 328V445H80Z"
                fill="var(--muted)"
                stroke="var(--foreground)"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M96 342Q340 320 584 342"
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
              />
              <g data-drive-wheel>
                <circle
                  cx="185"
                  cy="389"
                  r="45"
                  fill="var(--card)"
                  stroke="var(--foreground)"
                  strokeWidth="9"
                />
                <path
                  d="M145 368L185 389L225 368M185 389V433"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                <circle
                  cx="185"
                  cy="389"
                  r="13"
                  fill="var(--primary)"
                  stroke="var(--foreground)"
                  strokeWidth="3"
                />
              </g>

              <g data-drive-speedometer>
                <path
                  d="M308 394A42 42 0 0 1 392 394"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M308 394H314M320 364L325 369M350 352V359M380 364L375 369M392 394H386"
                  stroke="var(--muted-foreground)"
                  strokeWidth="2"
                />
                <g transform="translate(350 394)">
                  <path
                    data-speed-needle
                    transform="rotate(0)"
                    d="M0 0L-36 0"
                    stroke="var(--primary-ink)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
                <circle cx="350" cy="394" r="4" fill="var(--foreground)" />
                <g fill="var(--muted-foreground)" fontSize="14" textAnchor="middle">
                  <text x="297" y="400">
                    0
                  </text>
                  <text x="403" y="400">
                    80
                  </text>
                  <text x="350" y="429">
                    km/h
                  </text>
                  <text x="312" y="355" fontSize="12">
                    20
                  </text>
                  <text x="350" y="345" fontSize="12">
                    40
                  </text>
                  <text x="388" y="355" fontSize="12">
                    60
                  </text>
                </g>
              </g>

              <g data-drive-fuel-gauge>
                <path
                  d="M449 394A36 36 0 0 1 521 394"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M449 394H455M459 368L464 373M485 358V365M511 368L506 373M521 394H515"
                  stroke="var(--muted-foreground)"
                  strokeWidth="2"
                />
                <g transform="translate(485 394)">
                  <path
                    data-fuel-needle
                    transform="rotate(0)"
                    d="M0 0L-31 0"
                    stroke="var(--destructive)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
                <circle cx="485" cy="394" r="4" fill="var(--foreground)" />
                <text
                  x="438"
                  y="400"
                  textAnchor="middle"
                  fill="var(--destructive)"
                  fontSize="15"
                  fontWeight="600"
                >
                  E
                </text>
                <text
                  x="532"
                  y="400"
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="15"
                >
                  F
                </text>
                <g
                  data-fuel-lamp
                  fill="none"
                  stroke="var(--destructive)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M476 352V337H488V352M473 352H491M479 341H485M488 341H492L496 345V350Q496 353 493 353Q491 353 491 350V346M491 335L496 340V345" />
                </g>
                <text
                  data-limit-notice
                  x="485"
                  y="431"
                  textAnchor="middle"
                  fill="var(--destructive)"
                  fontSize="17"
                  fontWeight="500"
                >
                  Limit reached
                </text>
              </g>
            </g>
          )}

          {sceneType === "expired" && <ExpiredTimeScene idPrefix={titleId} />}

          {sceneType === "rate_limit" && <RateLimitTrafficScene />}

          {sceneType === "invalid_passcode" && (
            <>
              <rect
                x="383"
                y="261"
                width="111"
                height="95"
                rx="18"
                fill="var(--primary)"
                stroke="var(--foreground)"
                strokeWidth="3"
              />
              <path
                d="M403 261V234A35 35 0 0 1 473 234V261"
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="8"
              />
              <circle cx="438" cy="301" r="10" fill="var(--primary-foreground)" />
              <path d="M438 309V327" stroke="var(--primary-foreground)" strokeWidth="7" />
              <g
                data-passcode-key
                stroke="var(--foreground)"
                strokeWidth="5"
                strokeLinejoin="round"
              >
                <circle cx="252" cy="310" r="23" fill="var(--card)" />
                <path d="M275 310H359V324H345V312M322 310V325" fill="none" />
              </g>
              <g
                data-rejected-mark
                stroke="var(--muted-foreground)"
                strokeWidth="4"
                strokeLinecap="round"
              >
                <path d="M516 241L533 258M533 241L516 258" />
              </g>
            </>
          )}

          {sceneType === "network" && (
            <>
              <path
                d="M225 328V231M198 355L225 302L252 355M210 280H240"
                stroke="var(--foreground)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {[20, 40, 60].map((r) => (
                <circle
                  key={r}
                  data-network-wave
                  cx="225"
                  cy="231"
                  r={r}
                  stroke="var(--primary)"
                  strokeWidth="3"
                  fill="none"
                  opacity="0"
                />
              ))}
              <circle cx="225" cy="231" r="8" fill="var(--primary)" />
              <rect
                x="444"
                y="232"
                width="76"
                height="123"
                rx="12"
                fill="var(--card)"
                stroke="var(--muted-foreground)"
                strokeWidth="3"
              />
              <path
                d="M461 252H503M461 266H503M461 280H503"
                stroke="var(--border)"
                strokeWidth="4"
              />
              <circle cx="482" cy="330" r="5" fill="var(--muted-foreground)" />
              <path
                d="M356 271L338 293H357L340 317"
                stroke="var(--muted-foreground)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Request x={298} />
            </>
          )}

          {sceneType === "error" && <RouteErrorScene />}
        </g>
      </svg>

      <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 sm:inset-x-7 sm:bottom-6">
        <p className="max-w-[75%] text-xs leading-5 text-muted-foreground">{scene.caption}</p>
        {!reducedMotion && (
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={paused ? "Play animation" : "Pause animation"}
            aria-pressed={paused}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function RouteCar({ x = 235, y = 280 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-car>
        <g fill="var(--foreground)">
          <rect x="-38" y="-34" width="23" height="10" rx="4" />
          <rect x="24" y="-34" width="23" height="10" rx="4" />
          <rect x="-38" y="24" width="23" height="10" rx="4" />
          <rect x="24" y="24" width="23" height="10" rx="4" />
        </g>
        <path
          d="M-48-27H37Q58-27 58-9V9Q58 27 37 27H-48Q-57 27-57 17V-17Q-57-27-48-27Z"
          fill="var(--primary)"
          stroke="var(--foreground)"
          strokeWidth="2.5"
        />
        <rect
          x="-21"
          y="-19"
          width="41"
          height="38"
          rx="6"
          fill="var(--card)"
          stroke="var(--foreground)"
          strokeWidth="2"
        />
        <path
          d="M22-19L35-15V15L22 19ZM-24-19L-36-15V15L-24 19Z"
          fill="var(--primary-foreground)"
          opacity="0.75"
        />
        <path
          d="M43-18V18"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeOpacity="0.3"
          strokeWidth="2"
        />
        <path d="M53-17V-9M53 9V17" stroke="var(--card)" strokeWidth="4" strokeLinecap="round" />
        <path
          data-car-brake-light
          d="M-51-18V-10M-51 10V18"
          stroke="var(--destructive)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

function Request({ x, queued = false }: { x: number; queued?: boolean }) {
  return (
    <g transform={`translate(${x} 310)`}>
      <g {...(queued ? { "data-queue-request": "" } : { "data-state-request": "" })}>
        <circle r="22" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="2" />
        <path
          d="M-8 0H8M2-6L8 0L2 6"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ArrowRight, Home, Waves } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

gsap.registerPlugin(MotionPathPlugin);

export function NotFoundExperience() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.to("[data-cloud='one']", {
          x: 24,
          duration: 8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to("[data-cloud='two']", {
          x: -18,
          duration: 10,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to("[data-underwater-fish]", {
          x: 42,
          duration: 5,
          ease: "sine.inOut",
          repeat: -1,
          stagger: 0.7,
          yoyo: true,
        });
        gsap.to("[data-reed]", {
          duration: 2.2,
          ease: "sine.inOut",
          repeat: -1,
          rotation: 2.5,
          stagger: {
            amount: 0.7,
            from: "random",
          },
          transformOrigin: "bottom center",
          yoyo: true,
        });
        gsap.to("[data-glint]", {
          duration: 2.4,
          ease: "sine.inOut",
          opacity: 0.2,
          repeat: -1,
          scaleX: 0.65,
          stagger: 0.35,
          transformOrigin: "center",
          yoyo: true,
        });

        const fish = "[data-jumping-fish]";
        const splashOut = "[data-splash-out]";
        const splashIn = "[data-splash-in]";
        const outDrops = `${splashOut} [data-drop]`;
        const inDrops = `${splashIn} [data-drop]`;
        const outRipple = `${splashOut} [data-ripple]`;
        const inRipple = `${splashIn} [data-ripple]`;

        const jump = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.15,
        });

        jump
          .set(fish, {
            autoAlpha: 0,
            rotation: -48,
            scale: 0.88,
            x: 0,
            y: 24,
          })
          .set([outDrops, inDrops], {
            autoAlpha: 0,
            scale: 0,
            transformOrigin: "center",
            y: 0,
          })
          .set([outRipple, inRipple], {
            autoAlpha: 0,
            scaleX: 0.25,
            transformOrigin: "center",
          })
          .to(
            outRipple,
            {
              autoAlpha: 0.58,
              duration: 0.16,
              ease: "power2.out",
              scaleX: 0.8,
            },
            0.08,
          )
          .to(
            outRipple,
            {
              autoAlpha: 0,
              duration: 0.65,
              ease: "power2.out",
              scaleX: 1.75,
            },
            0.24,
          )
          .to(
            outDrops,
            {
              autoAlpha: 0.72,
              duration: 0.14,
              ease: "power2.out",
              scale: 1,
              stagger: 0.025,
            },
            0.08,
          )
          .to(
            outDrops,
            {
              autoAlpha: 0,
              duration: 0.52,
              ease: "power2.in",
              stagger: 0.025,
              y: (index) => -26 - index * 8,
            },
            0.18,
          )
          .to(
            fish,
            {
              autoAlpha: 1,
              duration: 0.08,
            },
            0.12,
          )
          .to(
            fish,
            {
              duration: 1.95,
              ease: "none",
              motionPath: {
                autoRotate: true,
                curviness: 1.6,
                path: [
                  { x: 0, y: 24 },
                  { x: 92, y: -122 },
                  { x: 218, y: -196 },
                  { x: 356, y: -150 },
                  { x: 470, y: 26 },
                ],
              },
              scale: 1,
            },
            0.12,
          )
          .to(
            inRipple,
            {
              autoAlpha: 0.62,
              duration: 0.16,
              ease: "power2.out",
              scaleX: 0.75,
            },
            1.84,
          )
          .to(
            inRipple,
            {
              autoAlpha: 0,
              duration: 0.72,
              ease: "power2.out",
              scaleX: 1.85,
            },
            2,
          )
          .to(
            inDrops,
            {
              autoAlpha: 0.78,
              duration: 0.12,
              ease: "power2.out",
              scale: 1,
              stagger: 0.025,
            },
            1.83,
          )
          .to(
            inDrops,
            {
              autoAlpha: 0,
              duration: 0.5,
              ease: "power2.in",
              stagger: 0.025,
              y: (index) => -22 - index * 7,
            },
            1.94,
          )
          .to(
            fish,
            {
              autoAlpha: 0,
              duration: 0.12,
              ease: "power2.in",
            },
            2,
          );
      }, scene);

      return () => context.revert();
    });

    media.add("(prefers-reduced-motion: reduce)", () => {
      const context = gsap.context(() => {
        gsap.set("[data-jumping-fish]", {
          autoAlpha: 1,
          rotation: -12,
          scale: 1,
          x: 220,
          y: -158,
        });
        gsap.set("[data-splash-out], [data-splash-in]", {
          autoAlpha: 0,
        });
      }, scene);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;

    if (!scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    gsap.to(scene.querySelector("[data-scene-card]"), {
      duration: 0.7,
      ease: "power3.out",
      rotationX: y * -2.6,
      rotationY: x * 3.4,
      transformPerspective: 900,
    });
    gsap.to(scene.querySelector("[data-parallax-far]"), {
      duration: 0.8,
      ease: "power3.out",
      x: x * -10,
      y: y * -5,
    });
    gsap.to(scene.querySelector("[data-parallax-near]"), {
      duration: 0.65,
      ease: "power3.out",
      x: x * 14,
      y: y * 7,
    });
  };

  const handlePointerLeave = () => {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

    gsap.to(
      scene.querySelectorAll(
        "[data-scene-card], [data-parallax-far], [data-parallax-near]",
      ),
      {
        duration: 0.85,
        ease: "power3.out",
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
      },
    );
  };

  return (
    <main
      className="relative isolate flex min-h-screen items-center overflow-hidden bg-background px-5 py-10 sm:px-8 lg:px-12"
      aria-labelledby="error-title"
    >
      <div
        aria-hidden="true"
        className="absolute -left-40 top-0 -z-10 size-[32rem] rounded-full bg-primary/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-52 right-0 -z-10 size-[38rem] rounded-full bg-third/15 blur-[140px]"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <section className="relative z-10 max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-xl">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-third opacity-50 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-third" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              404 · Off the map
            </span>
          </div>

          <p className="mb-3 font-mono text-sm font-semibold text-primary">
            Lost in the current
          </p>
          <h1
            id="error-title"
            className="max-w-lg text-balance text-5xl font-semibold tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl"
          >
            This link swam away.
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            The page you&apos;re looking for drifted beyond our waters. Head
            home, or sign in and we&apos;ll get you back on course.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group rounded-full px-6">
              <Link href="/">
                <Home className="size-4" />
                Back to home
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group rounded-full bg-card/55 px-6 backdrop-blur-sm"
            >
              <Link href="/auth/login">
                Go to login
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>

        <div
          ref={sceneRef}
          className="relative mx-auto w-full max-w-[760px]"
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-5 -z-10 rounded-[3rem] bg-primary/10 blur-3xl"
          />
          <div
            data-scene-card
            className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-card shadow-[0_35px_100px_-45px_color-mix(in_oklab,var(--primary)_55%,transparent)] dark:border-white/10"
            style={{ transformStyle: "preserve-3d" }}
          >
            <svg
              className="block h-auto w-full"
              viewBox="0 0 720 560"
              role="img"
              aria-labelledby="lake-title lake-description"
            >
              <defs>
                <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--background)" />
                  <stop offset="0.55" stopColor="var(--accent)" />
                  <stop offset="1" stopColor="var(--secondary)" stopOpacity="0.28" />
                </linearGradient>
                <linearGradient id="lake" x1="0" x2="0.9" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--primary)" stopOpacity="0.78" />
                  <stop offset="0.48" stopColor="var(--secondary)" stopOpacity="0.58" />
                  <stop offset="1" stopColor="var(--third)" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="fish-body" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--third)" />
                  <stop offset="1" stopColor="var(--primary)" />
                </linearGradient>
                <linearGradient id="hill" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--third)" stopOpacity="0.42" />
                  <stop offset="1" stopColor="var(--primary)" stopOpacity="0.18" />
                </linearGradient>
                <filter id="fish-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow
                    dx="0"
                    dy="8"
                    floodColor="var(--foreground)"
                    floodOpacity="0.16"
                    stdDeviation="8"
                  />
                </filter>
                <clipPath id="lake-clip">
                  <path d="M0 345C117 329 191 363 294 348C414 330 520 333 720 351V560H0Z" />
                </clipPath>
              </defs>

              <rect width="720" height="560" fill="url(#sky)" />

              <g data-parallax-far>
                <text
                  x="360"
                  y="286"
                  fill="var(--foreground)"
                  fontSize="224"
                  fontWeight="800"
                  letterSpacing="-18"
                  opacity="0.045"
                  textAnchor="middle"
                >
                  404
                </text>

                <g data-cloud="one" fill="var(--card)" opacity="0.7">
                  <ellipse cx="116" cy="110" rx="38" ry="15" />
                  <ellipse cx="145" cy="105" rx="29" ry="21" />
                  <ellipse cx="167" cy="113" rx="42" ry="13" />
                </g>
                <g data-cloud="two" fill="var(--card)" opacity="0.48">
                  <ellipse cx="540" cy="87" rx="33" ry="12" />
                  <ellipse cx="565" cy="81" rx="24" ry="18" />
                  <ellipse cx="587" cy="90" rx="36" ry="11" />
                </g>

                <circle
                  cx="586"
                  cy="128"
                  r="38"
                  fill="var(--primary)"
                  opacity="0.16"
                />
                <circle
                  cx="586"
                  cy="128"
                  r="24"
                  fill="var(--primary)"
                  opacity="0.2"
                />

                <path
                  d="M0 299C82 246 143 257 214 295C301 220 384 234 451 288C530 231 614 240 720 297V373H0Z"
                  fill="url(#hill)"
                />
                <path
                  d="M0 322C87 288 170 282 259 327C362 278 477 280 572 326C624 298 674 298 720 312V377H0Z"
                  fill="var(--card)"
                  opacity="0.58"
                />
              </g>

              <path
                d="M0 345C117 329 191 363 294 348C414 330 520 333 720 351V560H0Z"
                fill="url(#lake)"
              />

              <g clipPath="url(#lake-clip)">
                <path
                  d="M-20 405C117 380 221 419 346 397C468 376 594 402 749 381"
                  fill="none"
                  opacity="0.14"
                  stroke="white"
                  strokeWidth="2"
                />
                <path
                  d="M-30 476C133 446 242 487 379 461C503 438 609 456 761 438"
                  fill="none"
                  opacity="0.12"
                  stroke="white"
                  strokeWidth="2"
                />

                <g
                  data-underwater-fish
                  fill="var(--foreground)"
                  opacity="0.08"
                  transform="translate(164 444)"
                >
                  <ellipse cx="0" cy="0" rx="26" ry="9" />
                  <path d="M-22 0L-43-13L-39 11Z" />
                </g>
                <g
                  data-underwater-fish
                  fill="var(--foreground)"
                  opacity="0.06"
                  transform="translate(466 494) scale(.72)"
                >
                  <ellipse cx="0" cy="0" rx="26" ry="9" />
                  <path d="M-22 0L-43-13L-39 11Z" />
                </g>

                <g fill="none" stroke="white" strokeLinecap="round">
                  <path
                    data-glint
                    d="M72 389H142"
                    opacity="0.38"
                    strokeWidth="3"
                  />
                  <path
                    data-glint
                    d="M296 430H363"
                    opacity="0.26"
                    strokeWidth="2"
                  />
                  <path
                    data-glint
                    d="M514 391H612"
                    opacity="0.3"
                    strokeWidth="3"
                  />
                </g>
              </g>

              <path
                d="M0 345C117 329 191 363 294 348C414 330 520 333 720 351"
                fill="none"
                opacity="0.68"
                stroke="var(--primary)"
                strokeWidth="3"
              />

              <g data-splash-out transform="translate(109 349)">
                <ellipse
                  data-ripple
                  cx="0"
                  cy="5"
                  rx="45"
                  ry="8"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                />
                <g fill="var(--primary)">
                  <circle data-drop cx="-21" cy="-1" r="5" />
                  <circle data-drop cx="-7" cy="-8" r="4" />
                  <circle data-drop cx="10" cy="-5" r="6" />
                  <circle data-drop cx="25" cy="1" r="3.5" />
                </g>
              </g>

              <g data-splash-in transform="translate(579 349)">
                <ellipse
                  data-ripple
                  cx="0"
                  cy="5"
                  rx="48"
                  ry="8"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                />
                <g fill="var(--primary)">
                  <circle data-drop cx="-23" cy="0" r="4" />
                  <circle data-drop cx="-9" cy="-7" r="6" />
                  <circle data-drop cx="9" cy="-8" r="4" />
                  <circle data-drop cx="25" cy="0" r="5" />
                </g>
              </g>

              <g transform="translate(109 389)">
                <g
                  data-jumping-fish
                  filter="url(#fish-shadow)"
                  transform="translate(0 24) rotate(-48)"
                >
                  <path
                    d="M-30 0L-61-23L-57 1L-63 24Z"
                    fill="var(--third)"
                  />
                  <path
                    d="M-16-15C-5-40 17-43 30-18"
                    fill="var(--primary)"
                    opacity="0.72"
                  />
                  <path
                    d="M-33 0C-19-28 23-34 59-2C27 30-18 27-33 0Z"
                    fill="url(#fish-body)"
                  />
                  <path
                    d="M-21 7C2 20 30 16 49 2C30 26-5 31-25 11Z"
                    fill="white"
                    opacity="0.2"
                  />
                  <circle cx="39" cy="-9" r="4.5" fill="var(--card)" />
                  <circle cx="40" cy="-9" r="2" fill="var(--foreground)" />
                  <path
                    d="M20 7C12 22 1 27-10 25C-1 14 8 8 20 7Z"
                    fill="var(--third)"
                    opacity="0.9"
                  />
                </g>
              </g>

              <g data-parallax-near fill="none" stroke="var(--third)" strokeLinecap="round">
                <g transform="translate(50 364)" strokeWidth="5">
                  <path data-reed d="M0 75C2 45-5 17-2-9" />
                  <path data-reed d="M14 77C9 47 17 24 13 3" />
                  <path data-reed d="M29 76C24 47 31 31 34 12" />
                </g>
                <g transform="translate(655 365)" strokeWidth="5">
                  <path data-reed d="M0 75C4 42-2 18 1-10" />
                  <path data-reed d="M16 77C10 47 19 22 16 0" />
                  <path data-reed d="M31 75C27 46 35 30 37 8" />
                </g>
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-x-5 top-5 flex items-center justify-between">
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

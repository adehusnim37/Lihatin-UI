"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  IconActivity,
  IconArrowLeft,
  IconArrowUpRight,
  IconBolt,
  IconChartBar,
  IconLink,
  IconLock,
  IconWorld,
} from "@tabler/icons-react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  visualDescription: string;
  visualTitle: string;
}

const proofPoints = [
  {
    detail: "links created",
    icon: IconBolt,
    label: "Create",
    metric: "87K+",
    trend: "+18% this month",
  },
  {
    detail: "clicks analyzed",
    icon: IconChartBar,
    label: "Measure",
    metric: "3.2M",
    trend: "Live from 28 countries",
  },
  {
    detail: "redirect uptime",
    icon: IconLock,
    label: "Protect",
    metric: "99.9%",
    trend: "All systems healthy",
  },
];

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
  visualDescription,
  visualTitle,
}: AuthShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeProof, setActiveProof] = useState(1);
  const selectedProof = proofPoints[activeProof];

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const arrivedFromLanding =
      sessionStorage.getItem("lihatin-auth-transition") === "1";
    sessionStorage.removeItem("lihatin-auth-transition");

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-auth-frame]", {
            autoAlpha: 0,
            scale: arrivedFromLanding ? 0.985 : 0.995,
            duration: 0.35,
          })
          .from(
            "[data-auth-brand]",
            { y: -14, autoAlpha: 0, duration: 0.45 },
            "-=0.15",
          )
          .from(
            "[data-auth-copy] > *",
            { y: 24, autoAlpha: 0, duration: 0.55, stagger: 0.07 },
            "-=0.28",
          )
          .from(
            "[data-auth-form-content]",
            { y: 30, autoAlpha: 0, duration: 0.65 },
            "-=0.35",
          )
          .from(
            "[data-auth-visual]",
            { xPercent: 8, autoAlpha: 0, duration: 0.75 },
            "-=0.65",
          )
          .from(
            "[data-auth-stage-card], [data-auth-float-node]",
            {
              y: 24,
              scale: 0.94,
              autoAlpha: 0,
              duration: 0.6,
              stagger: 0.08,
            },
            "-=0.45",
          );

        gsap.to("[data-auth-route]", {
          strokeDashoffset: -42,
          duration: 2.5,
          ease: "none",
          repeat: -1,
        });

        gsap.to("[data-auth-pulse]", {
          scale: 1.7,
          autoAlpha: 0,
          transformOrigin: "50% 50%",
          duration: 1.8,
          ease: "power2.out",
          repeat: -1,
          stagger: 0.45,
        });

        gsap.to("[data-auth-float-node]", {
          y: -7,
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          stagger: 0.25,
          yoyo: true,
        });
      }, shell);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const metric = shell.querySelector("[data-auth-metric]");
    const detail = shell.querySelector("[data-auth-metric-detail]");
    gsap.fromTo(
      [metric, detail],
      { autoAlpha: 0, y: 10 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        stagger: 0.06,
      },
    );
  }, [activeProof]);

  const handleStageMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (
      !stage ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    const card = stage.querySelector("[data-auth-stage-card]");
    const nodes = stage.querySelectorAll("[data-auth-float-node]");

    gsap.to(card, {
      rotationX: y * -6,
      rotationY: x * 7,
      x: x * 5,
      y: y * 4,
      transformPerspective: 900,
      duration: 0.55,
      ease: "power2.out",
    });
    gsap.to(nodes, {
      x: x * 10,
      duration: 0.7,
      ease: "power2.out",
    });
  };

  const handleStageLeave = () => {
    const stage = stageRef.current;
    if (!stage) return;

    gsap.to(
      [
        stage.querySelector("[data-auth-stage-card]"),
        ...stage.querySelectorAll("[data-auth-float-node]"),
      ],
      {
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.55)",
      },
    );
  };

  return (
    <div
      ref={shellRef}
      className="relative min-h-screen overflow-hidden bg-background p-3 sm:p-5 lg:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 10% 10%, color-mix(in oklch, var(--primary) 30%, transparent), transparent 28%), radial-gradient(circle at 90% 85%, color-mix(in oklch, var(--third) 28%, transparent), transparent 30%)",
        }}
      />

      <div
        data-auth-frame
        className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[1.75rem] border bg-card shadow-sm sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.9fr_1.1fr]"
      >
        <section className="flex min-w-0 flex-col px-5 py-5 sm:px-9 sm:py-7 lg:px-12 lg:py-9 xl:px-16">
          <Link
            data-auth-brand
            href="/"
            className="inline-flex w-fit items-center gap-3 rounded-full pr-3 text-sm font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={38}
              height={38}
              className="size-9 rounded-xl"
              priority
            />
            <span>Lihat.in</span>
          </Link>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 sm:py-12">
            <div data-auth-copy>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>

            <div data-auth-form-content className="mt-8">
              {children}
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </section>

        <aside
          data-auth-visual
          className="relative m-3 hidden min-h-0 overflow-hidden rounded-[1.4rem] border border-primary/25 bg-gradient-to-br from-primary/25 via-secondary/25 to-third/35 p-7 lg:flex lg:flex-col xl:p-9"
        >
          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Live link intelligence
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-foreground xl:text-[2.65rem]">
              {visualTitle}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {visualDescription}
            </p>
          </div>

          <div
            ref={stageRef}
            onPointerMove={handleStageMove}
            onPointerLeave={handleStageLeave}
            className="relative my-3 flex min-h-[260px] flex-1 items-center justify-center [perspective:900px]"
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_65%)]" />

            <svg
              viewBox="0 0 600 340"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 size-full text-primary/55"
              aria-hidden="true"
            >
              <path
                data-auth-route
                d="M95 75 C190 75 180 165 295 165"
                fill="none"
                stroke="currentColor"
                strokeDasharray="5 9"
                strokeWidth="1.5"
              />
              <path
                data-auth-route
                d="M505 65 C415 65 420 165 305 165"
                fill="none"
                stroke="currentColor"
                strokeDasharray="5 9"
                strokeWidth="1.5"
              />
              <path
                data-auth-route
                d="M505 275 C420 275 415 178 305 170"
                fill="none"
                stroke="currentColor"
                strokeDasharray="5 9"
                strokeWidth="1.5"
              />
              <path
                data-auth-route
                d="M90 275 C190 275 190 185 295 170"
                fill="none"
                stroke="currentColor"
                strokeDasharray="5 9"
                strokeWidth="1.5"
              />
              <path
                data-auth-route
                d="M70 170 C150 170 205 168 295 168"
                fill="none"
                stroke="currentColor"
                strokeDasharray="5 9"
                strokeWidth="1.5"
              />
            </svg>

            <div
              data-auth-float-node
              className="absolute left-[1%] top-[5%] z-30 flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg shadow-primary/5 backdrop-blur"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-primary/12 text-primary">
                <IconLink className="size-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Short link
                </p>
                <p className="text-xs font-semibold text-foreground">
                  lihat.in/launch
                </p>
              </div>
            </div>

            <div
              data-auth-float-node
              className="absolute right-[1%] top-[3%] z-30 flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg shadow-primary/5 backdrop-blur"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-third/25 text-foreground">
                <IconWorld className="size-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Top region
                </p>
                <p className="text-xs font-semibold text-foreground">
                  Indonesia · 72%
                </p>
              </div>
            </div>

            <div
              data-auth-float-node
              className="absolute bottom-[3%] right-[1%] z-30 flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg shadow-primary/5 backdrop-blur"
            >
              <span className="relative grid size-7 place-items-center rounded-lg bg-primary/12 text-primary">
                <span
                  data-auth-pulse
                  className="absolute size-3 rounded-full border border-primary"
                />
                <IconActivity className="relative size-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live traffic
                </p>
                <p className="text-xs font-semibold text-foreground">
                  24 people now
                </p>
              </div>
            </div>

            <div
              data-auth-float-node
              className="absolute bottom-[3%] left-[1%] z-30 flex items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg shadow-primary/5 backdrop-blur"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-third/25 text-foreground">
                <IconActivity className="size-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Top device
                </p>
                <p className="text-xs font-semibold text-foreground">
                  Mobile · 68%
                </p>
              </div>
            </div>

            <div
              data-auth-float-node
              className="absolute left-0 top-[48%] z-30 hidden items-center gap-2 rounded-xl border bg-background/90 px-3 py-2 shadow-lg shadow-primary/5 backdrop-blur xl:flex"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-primary/12 text-primary">
                <IconArrowUpRight className="size-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Conversion
                </p>
                <p className="text-xs font-semibold text-foreground">
                  +12.4% today
                </p>
              </div>
            </div>

            <div
              data-auth-stage-card
              className="relative z-20 w-[min(68%,330px)] translate-y-2 rounded-[1.4rem] border border-white/50 bg-background/90 p-4 shadow-2xl shadow-primary/15 backdrop-blur-xl will-change-transform xl:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <IconChartBar className="size-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Campaign pulse
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      Product launch
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  Active
                  <IconArrowUpRight className="size-3" />
                </span>
              </div>

              <div className="mt-6">
                <p
                  data-auth-metric
                  className="text-4xl font-bold tracking-[-0.055em] text-foreground"
                >
                  {selectedProof.metric}
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p
                    data-auth-metric-detail
                    className="text-xs text-muted-foreground"
                  >
                    {selectedProof.detail}
                  </p>
                  <span className="text-[10px] font-semibold text-primary">
                    {selectedProof.trend}
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 300 80"
                className="mt-4 h-20 w-full overflow-visible"
                aria-label="Rising link activity"
              >
                <defs>
                  <linearGradient id="auth-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity=".32" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 68 C28 65 32 48 58 52 S91 62 112 39 S145 49 167 31 S204 38 226 19 S267 25 300 7 V80 H0 Z"
                  fill="url(#auth-chart-fill)"
                />
                <path
                  d="M0 68 C28 65 32 48 58 52 S91 62 112 39 S145 49 167 31 S204 38 226 19 S267 25 300 7"
                  fill="none"
                  stroke="var(--primary)"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <circle cx="300" cy="7" r="4" fill="var(--background)" stroke="var(--primary)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="relative z-30 grid grid-cols-3 gap-2">
            {proofPoints.map((item, index) => {
              const ProofIcon = item.icon;
              const isActive = activeProof === index;

              return (
                <button
                  data-auth-proof
                  type="button"
                  key={item.label}
                  aria-pressed={isActive}
                  onClick={() => setActiveProof(index)}
                  className={cn(
                    "group rounded-xl border p-3 text-left outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "border-primary/40 bg-background/85 shadow-lg shadow-primary/10"
                      : "border-transparent bg-background/40 hover:-translate-y-1 hover:border-primary/20 hover:bg-background/65",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <ProofIcon
                      className={cn(
                        "size-4 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "size-1.5 rounded-full transition-colors",
                        isActive ? "bg-primary" : "bg-border",
                      )}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 hidden text-[10px] text-muted-foreground xl:block">
                    {item.detail}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-16 size-64 rounded-full bg-third/30 blur-3xl" />
        </aside>
      </div>
    </div>
  );
}

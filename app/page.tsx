"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconBolt,
  IconChartBar,
  IconCheck,
  IconCopy,
  IconLink,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthTransitionLink } from "@/components/auth/auth-transition-link";
import { createShortLink } from "@/lib/api/shortlinks";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

const stats = [
  {
    label: "Active creators",
    value: 2.4,
    decimals: 1,
    suffix: "K+",
    note: "building better journeys",
  },
  {
    label: "Links created",
    value: 87,
    decimals: 0,
    suffix: "K+",
    note: "and still moving",
  },
  {
    label: "Clicks analyzed",
    value: 3.2,
    decimals: 1,
    suffix: "M+",
    note: "turned into insight",
  },
];

const features = [
  {
    icon: IconLink,
    eyebrow: "Create",
    title: "A short link people remember",
    description:
      "Turn long destinations into clean, branded links with custom aliases, QR codes, and bulk creation.",
    items: ["Custom aliases", "QR codes", "Bulk workflows"],
  },
  {
    icon: IconChartBar,
    eyebrow: "Understand",
    title: "Every click tells a story",
    description:
      "See where attention comes from with real-time geographic, device, and campaign-level analytics.",
    items: ["Live tracking", "Device insights", "Geographic data"],
  },
  {
    icon: IconLock,
    eyebrow: "Protect",
    title: "Control who gets through",
    description:
      "Keep important destinations protected with expiration rules, passcodes, and access restrictions.",
    items: ["Passcodes", "Link expiration", "IP restrictions"],
  },
];

function buildWavePath(points: Array<{ value: number }>) {
  const segment = 100 / (points.length - 1);
  let path = `M 0 ${points[0].value} C`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const x = (index + 1) * segment;
    const controlX = x - segment / 2;
    path += ` ${controlX} ${points[index].value} ${controlX} ${points[index + 1].value} ${x} ${points[index + 1].value}`;
  }

  return `${path} V 100 H 0 Z`;
}

function MorphingLinkVisual() {
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    const paths = Array.from(
      visual.querySelectorAll<SVGPathElement>("[data-morph-path]"),
    );
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const layers = paths.map((path, layerIndex) => {
          const points = Array.from({ length: 10 }, (_, pointIndex) => ({
            value:
              56 +
              layerIndex * 14 +
              Math.sin(pointIndex * 1.45 + layerIndex) * 8,
          }));

          path.setAttribute("d", buildWavePath(points));
          return points;
        });

        const timeline = gsap.timeline({
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          defaults: { duration: 2.8, ease: "sine.inOut" },
          onUpdate: () => {
            paths.forEach((path, index) => {
              path.setAttribute("d", buildWavePath(layers[index]));
            });
          },
        });

        layers.forEach((points, layerIndex) => {
          timeline.to(
            points,
            {
              value: (pointIndex: number) =>
                38 +
                layerIndex * 18 +
                Math.sin(pointIndex * 1.2 + layerIndex * 2.4) * 14,
              stagger: {
                each: 0.045,
                from: layerIndex === 0 ? "start" : "end",
              },
            },
            layerIndex * 0.18,
          );
        });

        gsap.to("[data-floating-link]", {
          y: -9,
          rotation: 1.5,
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to("[data-orbit-dot]", {
          rotation: 360,
          transformOrigin: "50% 50%",
          duration: 12,
          ease: "none",
          repeat: -1,
        });
      }, visual);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  return (
    <div
      ref={visualRef}
      className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-primary/40 bg-gradient-to-br from-primary via-secondary to-third p-5 shadow-2xl shadow-primary/20 sm:min-h-[500px] sm:p-7"
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/60 sm:p-7">
        <span>Live link flow</span>
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary-foreground shadow-sm" />
          Online
        </span>
      </div>

      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="landing-wave-one" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--secondary)" />
            <stop offset="1" stopColor="var(--third)" />
          </linearGradient>
          <linearGradient id="landing-wave-two" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--background)" stopOpacity=".9" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity=".85" />
          </linearGradient>
        </defs>
        <path data-morph-path fill="url(#landing-wave-two)" opacity=".48" />
        <path data-morph-path fill="url(#landing-wave-one)" />
      </svg>

      <svg
        data-orbit-dot
        className="absolute left-1/2 top-[44%] z-10 size-[310px] -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-50 sm:size-[390px]"
        viewBox="0 0 400 400"
        aria-hidden="true"
      >
        <circle
          cx="200"
          cy="200"
          r="156"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".2"
          strokeDasharray="3 12"
        />
        <circle cx="200" cy="44" r="6" fill="currentColor" fillOpacity=".9" />
      </svg>

      <div
        data-floating-link
        className="absolute left-1/2 top-[44%] z-20 w-[calc(100%-2.5rem)] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card/95 p-4 text-card-foreground shadow-xl backdrop-blur sm:p-5"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/20">
            <IconLink className="size-4 text-foreground" />
          </span>
          <Badge className="border-0 bg-primary/20 text-foreground shadow-none">
            Redirect ready
          </Badge>
        </div>
        <p className="text-xs font-medium text-muted-foreground">Your new short link</p>
        <p className="mt-1 truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          lihat.in/launch-day
        </p>
        <div className="mt-5 flex items-end justify-between border-t pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Today
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">1,284</p>
          </div>
          <div className="flex h-10 items-end gap-1">
            {[35, 54, 42, 72, 58, 90, 78].map((height, index) => (
              <span
                key={height + index}
                className="w-1.5 rounded-full bg-primary"
                style={{ height: `${height}%`, opacity: 0.42 + index * 0.08 }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between text-primary-foreground sm:bottom-7 sm:left-7 sm:right-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
            Response time
          </p>
          <p className="mt-1 text-2xl font-bold">118ms</p>
        </div>
        <div className="rounded-full border border-primary-foreground/15 bg-background/40 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          Singapore edge
        </div>
      </div>
    </div>
  );
}

function AnimatedStats() {
  return (
    <div
      data-stats
      className="grid overflow-hidden rounded-[1.75rem] border bg-card shadow-sm sm:grid-cols-3"
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`relative px-6 py-7 sm:px-7 sm:py-8 ${
            index > 0 ? "border-t sm:border-l sm:border-t-0" : ""
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {stat.label}
          </p>
          <p
            data-count
            data-value={stat.value}
            data-decimals={stat.decimals}
            data-suffix={stat.suffix}
            className="mt-3 text-4xl font-bold tracking-[-0.05em] text-foreground sm:text-5xl"
          >
            0{stat.suffix}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{stat.note}</p>
        </div>
      ))}
    </div>
  );
}

function BouncyFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const path = pathRef.current;
    if (!footer || !path) return;

    const downPath =
      "M0 0C0 0 300 64 720 64S1440 0 1440 0V220H0V0Z";
    const centerPath =
      "M0 0C0 0 300 0 720 0S1440 0 1440 0V220H0V0Z";
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        ScrollTrigger.create({
          trigger: footer,
          start: "top bottom",
          onEnter: (self) => {
            const variation = Math.min(
              Math.abs(self.getVelocity()) / 9000,
              0.65,
            );

            gsap.fromTo(
              path,
              { morphSVG: downPath },
              {
                morphSVG: centerPath,
                duration: 2.1,
                ease: `elastic.out(${1 + variation}, ${Math.max(
                  0.28,
                  0.72 - variation,
                )})`,
                overwrite: true,
              },
            );
          },
        });
      }, footer);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative mt-16 pt-16 sm:mt-24 sm:pt-24">
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full overflow-visible sm:h-32"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d="M0 0C0 0 300 0 720 0S1440 0 1440 0V220H0V0Z"
          fill="var(--foreground)"
        />
      </svg>

      <div className="relative bg-foreground px-4 pb-8 text-background sm:px-6 sm:pb-10">
        <div className="container mx-auto grid max-w-6xl gap-10 border-b border-background/10 pb-10 md:grid-cols-[1.25fr_.75fr_.75fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-background">
                <Image src="/logo.svg" alt="" width={28} height={28} />
              </span>
              <span className="text-lg font-bold tracking-tight">Lihat.in</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-background/60">
              Shorter links. Clearer signals. A calmer way to understand how
              people move through the web.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/40">
              Product
            </p>
            <div className="mt-4 flex flex-col items-start gap-3 text-sm text-background/70">
              <Link href="/auth/register" className="transition-colors hover:text-background">
                Create account
              </Link>
              <Link href="/auth/login" className="transition-colors hover:text-background">
                Sign in
              </Link>
              <Link href="/main" className="transition-colors hover:text-background">
                Dashboard
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/40">
              Legal
            </p>
            <div className="mt-4 flex flex-col items-start gap-3 text-sm text-background/70">
              <Link href="/terms" className="transition-colors hover:text-background">
                Terms
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-background">
                Privacy
              </Link>
              <Link href="/support" className="transition-colors hover:text-background">
                Support
              </Link>
            </div>
          </div>
        </div>
        <div className="container mx-auto flex max-w-6xl flex-col gap-3 pt-6 text-xs text-background/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Lihat.in. All rights reserved.</p>
          <p>Built with Go, Next.js & a little motion.</p>
        </div>
      </div>
    </footer>
  );
}

export default function Index() {
  const pageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [demoUrl, setDemoUrl] = useState("");
  const [demoAlias, setDemoAlias] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdShortCode, setCreatedShortCode] = useState<string | null>(null);

  const sanitizedAlias = demoAlias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const previewCode = sanitizedAlias || "your-custom-code";
  const previewShortURL = `lihat.in/${previewCode}`;
  const createdShortURL = createdShortCode ? `lihat.in/${createdShortCode}` : null;

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: reduce)", () => {
      page.querySelectorAll<HTMLElement>("[data-count]").forEach((element) => {
        const target = Number(element.dataset.value ?? "0");
        const decimals = Number(element.dataset.decimals ?? "0");
        const suffix = element.dataset.suffix ?? "";
        element.textContent = `${target.toFixed(decimals)}${suffix}`;
      });
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const removeCardListeners: Array<() => void> = [];

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-header]", {
            y: -20,
            autoAlpha: 0,
            duration: 0.55,
          })
          .from(
            "[data-hero-reveal]",
            {
              y: 34,
              autoAlpha: 0,
              duration: 0.75,
              stagger: 0.1,
            },
            "-=0.2",
          )
          .from(
            "[data-hero-visual]",
            {
              y: 40,
              scale: 0.96,
              autoAlpha: 0,
              duration: 0.95,
            },
            "-=0.65",
          );

        const statElements = gsap.utils.toArray<HTMLElement>("[data-count]");
        statElements.forEach((element) => {
          const target = Number(element.dataset.value ?? "0");
          const decimals = Number(element.dataset.decimals ?? "0");
          const suffix = element.dataset.suffix ?? "";
          const counter = { value: 0 };

          gsap.to(counter, {
            value: target,
            duration: 1.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true,
            },
            onUpdate: () => {
              element.textContent = `${counter.value.toFixed(decimals)}${suffix}`;
            },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-section-reveal]").forEach((section) => {
          gsap.from(section, {
            y: 48,
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
              once: true,
            },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-feature-card]").forEach((card) => {
          const icon = card.querySelector("[data-feature-icon]");

          const enter = () => {
            gsap.to(card, {
              y: -8,
              duration: 0.35,
              ease: "power2.out",
              overwrite: true,
            });
            gsap.to(icon, {
              rotation: -8,
              scale: 1.08,
              duration: 0.35,
              ease: "back.out(2)",
              overwrite: true,
            });
          };

          const leave = () => {
            gsap.to(card, {
              y: 0,
              duration: 0.4,
              ease: "power2.out",
              overwrite: true,
            });
            gsap.to(icon, {
              rotation: 0,
              scale: 1,
              duration: 0.4,
              ease: "power2.out",
              overwrite: true,
            });
          };

          card.addEventListener("mouseenter", enter);
          card.addEventListener("mouseleave", leave);
          removeCardListeners.push(() => {
            card.removeEventListener("mouseenter", enter);
            card.removeEventListener("mouseleave", leave);
          });
        });

        return () => removeCardListeners.forEach((remove) => remove());
      }, page);

      return () => context.revert();
    });

    return () => media.revert();
  }, []);

  const handleTryCreateLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedURL = demoUrl.trim();
    if (!trimmedURL || isCreating) return;

    setIsCreating(true);
    setCreatedShortCode(null);

    try {
      const response = await createShortLink({
        is_bulky: false,
        links: [
          {
            original_url: trimmedURL,
            custom_code: sanitizedAlias || undefined,
            title: "Landing page quick link",
          },
        ],
      });

      if (!response.success || !response.data?.short_code) {
        throw new Error(response.message || "Failed to create short link.");
      }

      setCreatedShortCode(response.data.short_code);
      toast.success("Short link created", {
        description: `Your link is ready: lihat.in/${response.data.short_code}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create short link.";
      const lowered = message.toLowerCase();

      if (
        lowered.includes("unauthorized") ||
        lowered.includes("session") ||
        lowered.includes("login") ||
        lowered.includes("forbidden")
      ) {
        toast.error("Please sign in first", {
          description: "You need an account to create short links.",
        });
        router.push("/auth/login?redirect=/main/links");
      } else {
        toast.error("Failed to create link", { description: message });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCreatedLink = async () => {
    if (!createdShortURL) return;

    try {
      await navigator.clipboard.writeText(createdShortURL);
      toast.success("Copied", {
        description: "Short link copied to clipboard.",
      });
    } catch {
      toast.error("Copy failed", {
        description: "Unable to copy short link.",
      });
    }
  };

  return (
    <div
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
    >
      <header
        data-header
        className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Lihatin home">
            <Image
              src="/logo.svg"
              alt=""
              width={35}
              height={35}
              className="size-8 rounded-lg sm:size-9"
              priority
            />
            <span className="text-base font-bold tracking-tight">Lihat.in</span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Account navigation">
            <AuthTransitionLink
              href="/auth/login"
              variant="ghost"
              size="sm"
              className="hover:bg-muted"
            >
              Sign in
            </AuthTransitionLink>
            <AuthTransitionLink
              href="/auth/register"
              size="sm"
              className="rounded-full px-4"
            >
              Start free
            </AuthTransitionLink>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[680px] opacity-70"
            style={{
              background:
                "radial-gradient(circle at 15% 15%, color-mix(in oklch, var(--primary) 38%, transparent), transparent 30%), radial-gradient(circle at 82% 22%, color-mix(in oklch, var(--secondary) 30%, transparent), transparent 34%)",
            }}
          />
          <div className="container relative mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1fr_.9fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-24">
            <div className="max-w-2xl">
              <Badge
                data-hero-reveal
                variant="outline"
                className="rounded-full bg-background/70 px-3.5 py-1.5 text-foreground backdrop-blur"
              >
                <IconSparkles className="mr-1.5 size-3.5 text-primary" />
                Free, open source, and fast
              </Badge>
              <h1
                data-hero-reveal
                className="mt-6 text-[2.85rem] font-bold leading-[0.98] tracking-[-0.065em] text-foreground min-[390px]:text-[3.35rem] sm:text-7xl lg:text-[5.2rem]"
              >
                Make every click
                <span className="block text-primary">mean more.</span>
              </h1>
              <p
                data-hero-reveal
                className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
              >
                Build short, memorable links and turn every visit into a clear
                signal—without adding noise to your workflow.
              </p>
              <div
                data-hero-reveal
                className="mt-8 flex flex-col items-stretch gap-3 min-[430px]:flex-row min-[430px]:items-center"
              >
                <AuthTransitionLink
                  href="/auth/register"
                  size="lg"
                  className="group rounded-full px-6"
                >
                  Create your first link
                  <IconArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                </AuthTransitionLink>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-background/60 px-6 hover:bg-background"
                  asChild
                >
                  <Link href="#try-it">Try the builder</Link>
                </Button>
              </div>
              <div
                data-hero-reveal
                className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"
              >
                {["No credit card", "Free forever plan", "Setup in seconds"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <IconCheck className="size-3.5 text-primary" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div data-hero-visual>
              <MorphingLinkVisual />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 sm:px-6">
          <AnimatedStats />
        </section>

        <section id="try-it" className="scroll-mt-24 py-20 sm:py-28">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div
              data-section-reveal
              className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-gradient-to-br from-primary/35 via-secondary/30 to-third/35 px-5 py-7 text-foreground shadow-lg shadow-primary/10 sm:px-8 sm:py-10 lg:grid lg:grid-cols-[.7fr_1.3fr] lg:gap-12 lg:px-12 lg:py-12"
            >
              <div className="relative z-10">
                <Badge className="border border-border bg-background/60 text-foreground shadow-none">
                  Try it live
                </Badge>
                <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-4xl">
                  Your long URL,
                  <span className="block text-primary">made effortless.</span>
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                  Enter a destination and choose an alias. We&apos;ll create a real
                  short link using your account session.
                </p>
              </div>

              <div className="relative z-10 mt-8 rounded-2xl border bg-background/75 p-4 shadow-sm backdrop-blur lg:mt-0 sm:p-5">
                <form className="space-y-4" onSubmit={handleTryCreateLink}>
                  <div className="space-y-2">
                    <label
                      htmlFor="demo-url"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      Destination URL
                    </label>
                    <Input
                      id="demo-url"
                      type="url"
                      value={demoUrl}
                      onChange={(event) => setDemoUrl(event.target.value)}
                      placeholder="https://your-landing-page.com/product"
                      className="h-11 bg-background text-foreground"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="space-y-2">
                      <label
                        htmlFor="demo-alias"
                        className="text-xs font-semibold text-muted-foreground"
                      >
                        Custom alias
                      </label>
                      <Input
                        id="demo-alias"
                        type="text"
                        value={demoAlias}
                        onChange={(event) => setDemoAlias(event.target.value)}
                        placeholder="launch-day"
                        className="h-11 bg-background text-foreground"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-11 rounded-xl px-5"
                      disabled={!demoUrl.trim() || isCreating}
                    >
                      {isCreating ? "Creating..." : "Create link"}
                      <IconArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </form>

                <div className="mt-5 flex flex-col gap-3 rounded-xl border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Preview
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">
                      {previewShortURL}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Available
                  </span>
                </div>

                {createdShortURL && (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/15 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        Created
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-foreground">
                        {createdShortURL}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-background/60"
                      onClick={() => void handleCopyCreatedLink()}
                    >
                      <IconCopy className="mr-1.5 size-3.5" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-primary/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-secondary/20 blur-3xl" />
            </div>
          </div>
        </section>

        <section className="pb-8 sm:pb-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div data-section-reveal className="mb-10 max-w-2xl sm:mb-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                One link, more clarity
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-foreground sm:text-5xl">
                Everything you need.
                <span className="block text-muted-foreground">Nothing you don&apos;t.</span>
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {features.map((feature) => {
                const FeatureIcon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    data-feature-card
                    data-section-reveal
                    className="rounded-[1.75rem] border bg-card p-6 shadow-sm sm:p-7"
                  >
                    <div
                      data-feature-icon
                      className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"
                    >
                      <FeatureIcon className="size-5" />
                    </div>
                    <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.035em] text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                    <ul className="mt-7 space-y-3 border-t pt-6">
                      {feature.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm font-medium text-foreground"
                        >
                          <span className="flex size-5 items-center justify-center rounded-full bg-primary/15">
                            <IconCheck className="size-3 text-primary" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div
            data-section-reveal
            className="container mx-auto max-w-4xl px-4 text-center sm:px-6"
          >
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <IconBolt className="size-5" />
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-[-0.05em] text-foreground sm:text-5xl">
              Ready to move faster?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Create a free account and turn your next long URL into something
              useful, measurable, and easy to share.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 min-[430px]:flex-row">
              <AuthTransitionLink
                href="/auth/register"
                size="lg"
                className="group rounded-full px-6"
              >
                Start creating
                <IconArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </AuthTransitionLink>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full bg-background px-6"
                asChild
              >
                <Link href="/main">View dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <BouncyFooter />
    </div>
  );
}

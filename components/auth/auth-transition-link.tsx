"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { IconChartBar, IconLink, IconLock } from "@tabler/icons-react";
import { gsap } from "gsap";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthTransitionLinkProps {
  children: ReactNode;
  className?: string;
  href: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export function AuthTransitionLink({
  children,
  className,
  href,
  size = "default",
  variant = "default",
}: AuthTransitionLinkProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isTransitioning || !overlayRef.current) return;

    const overlay = overlayRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const context = gsap.context(() => {
      const tiles = gsap.utils.toArray<HTMLElement>("[data-route-tile]");
      const sideTiles = tiles.filter(
        (tile) => tile.dataset.routeTile !== "focus",
      );
      const focusTile = overlay.querySelector<HTMLElement>(
        '[data-route-tile="focus"]',
      );

      gsap
        .timeline({
          defaults: { ease: "expo.inOut" },
          onComplete: () => {
            sessionStorage.setItem("lihatin-auth-transition", "1");
            router.push(href);
          },
        })
        .set(overlay, { autoAlpha: 1 })
        .fromTo(
          tiles,
          { xPercent: 650, rotation: 0.01 },
          {
            xPercent: 0,
            duration: 0.62,
            stagger: 0.035,
          },
        )
        .to(
          sideTiles,
          {
            autoAlpha: 0.22,
            scale: 0.58,
            duration: 0.35,
            stagger: { each: 0.025, from: "edges" },
          },
          "-=0.12",
        )
        .to(
          "[data-route-copy]",
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.3,
            ease: "power2.out",
          },
          "<",
        )
        .to(
          focusTile,
          {
            scale: 32,
            borderRadius: 0,
            duration: 0.65,
          },
          "-=0.08",
        )
        .to(
          "[data-route-logo]",
          {
            scale: 1 / 32,
            duration: 0.65,
          },
          "<",
        )
        .to(
          "[data-route-copy]",
          {
            autoAlpha: 0,
            duration: 0.12,
            ease: "none",
          },
          "<",
        );
    }, overlay);

    return () => {
      document.body.style.overflow = previousOverflow;
      context.revert();
    };
  }, [href, isTransitioning, router]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    event.preventDefault();
    if (!isTransitioning) setIsTransitioning(true);
  };

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        aria-busy={isTransitioning}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {children}
      </Link>

      {isTransitioning &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background opacity-0"
            aria-hidden="true"
          >
            <div className="relative flex items-center justify-center gap-3 sm:gap-5">
              <span
                data-route-tile="side"
                className="flex size-14 items-center justify-center rounded-2xl border bg-muted text-muted-foreground sm:size-20"
              >
                <IconLink className="size-5 sm:size-6" />
              </span>
              <span
                data-route-tile="side"
                className="flex size-14 items-center justify-center rounded-2xl border bg-secondary text-secondary-foreground sm:size-20"
              >
                <IconChartBar className="size-5 sm:size-6" />
              </span>
              <span
                data-route-tile="focus"
                className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/30 sm:size-20"
              >
                <Image
                  data-route-logo
                  src="/logo.svg"
                  alt=""
                  width={48}
                  height={48}
                  priority
                  className="size-9 rounded-xl border border-primary-foreground/20 shadow-lg sm:size-12"
                />
              </span>
              <span
                data-route-tile="side"
                className="flex size-14 items-center justify-center rounded-2xl border bg-third text-third-foreground sm:size-20"
              >
                <IconLock className="size-5 sm:size-6" />
              </span>
              <span
                data-route-tile="side"
                className="flex size-14 items-center justify-center rounded-2xl border bg-muted text-muted-foreground sm:size-20"
              >
                <IconLink className="size-5 sm:size-6" />
              </span>
            </div>

            <p
              data-route-copy
              className="absolute bottom-[18%] translate-y-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground opacity-0"
            >
              Opening Lihat.in
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

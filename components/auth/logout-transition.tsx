"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { IconLink, IconLogout } from "@tabler/icons-react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

interface LogoutTransitionProps {
  active: boolean;
  onComplete: () => void | Promise<void>;
}

const waveStart = "M 0 100 V 100 Q 50 100 100 100 V 100 Z";
const waveMiddle = "M 0 100 V 48 Q 50 -4 100 48 V 100 Z";
const waveEnd = "M 0 100 V 0 Q 50 0 100 0 V 100 Z";

export function LogoutTransition({
  active,
  onComplete,
}: LogoutTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const overlay = overlayRef.current;

    if (!active || !overlay) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = gsap.matchMedia();
    const finish = () => {
      sessionStorage.setItem("lihatin-auth-transition", "1");
      void onCompleteRef.current();
    };

    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(overlay, {
        autoAlpha: 1,
        backgroundColor: "var(--primary)",
      });
      gsap.set("[data-logout-content]", { autoAlpha: 1 });
      const delayedCall = gsap.delayedCall(0.35, finish);

      return () => delayedCall.kill();
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap
          .timeline({
            defaults: { ease: "power3.inOut" },
            onComplete: finish,
          })
          .set(overlay, { autoAlpha: 1 })
          .to("[data-logout-wave-back]", {
            duration: 0.5,
            ease: "power2.in",
            morphSVG: waveMiddle,
          })
          .to(
            "[data-logout-wave-front]",
            {
              duration: 0.5,
              ease: "power2.in",
              morphSVG: waveMiddle,
            },
            "<0.07",
          )
          .to("[data-logout-wave-back]", {
            duration: 0.4,
            ease: "power2.out",
            morphSVG: waveEnd,
          })
          .to(
            "[data-logout-wave-front]",
            {
              duration: 0.4,
              ease: "power2.out",
              morphSVG: waveEnd,
            },
            "<0.07",
          )
          .to(
            "[data-logout-atmosphere]",
            {
              autoAlpha: 1,
              duration: 0.24,
              ease: "none",
            },
            "-=0.28",
          )
          .from(
            "[data-logout-topline]",
            {
              autoAlpha: 0,
              duration: 0.4,
              y: -12,
            },
            "-=0.18",
          )
          .from(
            "[data-logout-logo]",
            {
              autoAlpha: 0,
              duration: 0.52,
              ease: "back.out(2)",
              rotation: 7,
              scale: 0.72,
            },
            "-=0.26",
          )
          .from(
            "[data-logout-copy] > *",
            {
              autoAlpha: 0,
              duration: 0.44,
              ease: "power3.out",
              stagger: 0.06,
              yPercent: 100,
            },
            "-=0.24",
          )
          .to(
            "[data-logout-progress]",
            {
              duration: 0.5,
              ease: "power2.inOut",
              scaleX: 1,
            },
            "-=0.2",
          )
          .to({}, { duration: 0.18 });
      }, overlay);

      return () => context.revert();
    });

    return () => {
      media.revert();
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  if (!active || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="pointer-events-auto fixed inset-0 z-[140] overflow-hidden opacity-0"
      role="status"
      aria-live="polite"
      aria-label="Signing out of Lihat.in"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          data-logout-wave-back
          d={waveStart}
          fill="var(--third)"
          vectorEffect="non-scaling-stroke"
        />
        <path
          data-logout-wave-front
          d={waveStart}
          fill="var(--primary)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        data-logout-atmosphere
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, color-mix(in oklch, var(--primary-foreground) 10%, transparent), transparent 27%), radial-gradient(circle at 82% 80%, color-mix(in oklch, var(--third) 35%, transparent), transparent 30%)",
        }}
      />

      <div
        data-logout-content
        className="absolute inset-0 flex flex-col p-5 text-primary-foreground sm:p-8 lg:p-10"
      >
        <div
          data-logout-topline
          className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
        >
          <span className="inline-flex items-center gap-2">
            <IconLink className="size-4" />
            Lihat.in secure handoff
          </span>
          <span className="text-primary-foreground/60">02 / 01</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            data-logout-logo
            className="relative grid size-16 place-items-center rounded-[1.35rem] border border-primary-foreground/25 bg-primary-foreground/10 shadow-2xl shadow-black/10 sm:size-20"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={52}
              height={52}
              priority
              className="size-11 rounded-xl shadow-lg sm:size-14 sm:rounded-2xl"
            />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-primary bg-third text-third-foreground sm:size-6">
              <IconLogout className="size-3.5" />
            </span>
          </span>

          <div data-logout-copy className="mt-6 overflow-hidden px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/65 sm:text-xs">
              Securing session
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
              See you next time.
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/70 sm:text-base">
              Closing your dashboard and returning to sign in
            </p>
          </div>

          <span className="mt-7 h-px w-36 overflow-hidden rounded-full bg-primary-foreground/20">
            <span
              data-logout-progress
              className="block h-full origin-left scale-x-0 bg-primary-foreground"
            />
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-primary-foreground/55 sm:text-xs">
          <span>Dashboard locked</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-third motion-reduce:animate-none" />
            Signing out
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

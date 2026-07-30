"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { IconCheck, IconLink } from "@tabler/icons-react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

interface AuthenticatedTransitionProps {
  active: boolean;
  exitAfterComplete?: boolean;
  finalDescription?: string;
  finalTitle?: string;
  onComplete: () => void;
  prepareMainEntry?: boolean;
  statusLabel?: string;
}

const waveStart = "M 0 100 V 100 Q 50 100 100 100 V 100 Z";
const waveMiddle = "M 0 100 V 48 Q 50 -4 100 48 V 100 Z";
const waveEnd = "M 0 100 V 0 Q 50 0 100 0 V 100 Z";

export function AuthenticatedTransition({
  active,
  exitAfterComplete = false,
  finalDescription = "Opening your dashboard",
  finalTitle = "You're authenticated",
  onComplete,
  prepareMainEntry = true,
  statusLabel = "Identity confirmed",
}: AuthenticatedTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!active || !overlay) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const media = gsap.matchMedia();
    const finish = () => {
      if (prepareMainEntry) {
        sessionStorage.setItem("lihatin-main-entry", "1");
      }
      onCompleteRef.current();
    };

    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(overlay, { autoAlpha: 1, backgroundColor: "var(--primary)" });
      gsap.set("[data-authenticated-content]", { autoAlpha: 1 });
      const delayedCall = gsap.delayedCall(0.45, finish);
      return () => delayedCall.kill();
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { ease: "power3.inOut" },
          onComplete: finish,
        });

        timeline
          .set(overlay, { autoAlpha: 1 })
          .to("[data-auth-wave-back]", {
            morphSVG: waveMiddle,
            duration: 0.52,
            ease: "power2.in",
          })
          .to(
            "[data-auth-wave-front]",
            {
              morphSVG: waveMiddle,
              duration: 0.52,
              ease: "power2.in",
            },
            "<0.07",
          )
          .to("[data-auth-wave-back]", {
            morphSVG: waveEnd,
            duration: 0.42,
            ease: "power2.out",
          })
          .to(
            "[data-auth-wave-front]",
            {
              morphSVG: waveEnd,
              duration: 0.42,
              ease: "power2.out",
            },
            "<0.07",
          )
          .to(
            "[data-authenticated-atmosphere]",
            {
              autoAlpha: 1,
              duration: 0.28,
              ease: "none",
            },
            "-=0.3",
          )
          .from(
            "[data-authenticated-topline]",
            {
              y: -12,
              autoAlpha: 0,
              duration: 0.42,
              ease: "power3.out",
            },
            "-=0.2",
          )
          .from(
            "[data-authenticated-mark]",
            {
              scale: 0.72,
              rotation: -8,
              autoAlpha: 0,
              duration: 0.5,
              ease: "back.out(2.2)",
            },
            "-=0.28",
          )
          .from(
            "[data-authenticated-check]",
            {
              strokeDashoffset: 32,
              duration: 0.42,
              ease: "power2.out",
            },
            "-=0.28",
          )
          .from(
            "[data-authenticated-copy] > *",
            {
              yPercent: 110,
              autoAlpha: 0,
              duration: 0.48,
              stagger: 0.055,
              ease: "power3.out",
            },
            "-=0.25",
          )
          .to(
            "[data-authenticated-progress]",
            {
              scaleX: 1,
              duration: 0.48,
              ease: "power2.inOut",
            },
            "-=0.24",
          )
          .to({}, { duration: 0.22 });

        if (exitAfterComplete) {
          timeline
            .to("[data-authenticated-content]", {
              y: -12,
              autoAlpha: 0,
              duration: 0.28,
              ease: "power2.in",
            })
            .to(
              "[data-authenticated-atmosphere]",
              {
                autoAlpha: 0,
                duration: 0.18,
                ease: "none",
              },
              "<",
            )
            .to("[data-auth-wave-front]", {
              morphSVG: waveMiddle,
              duration: 0.44,
              ease: "power2.in",
            })
            .to(
              "[data-auth-wave-back]",
              {
                morphSVG: waveMiddle,
                duration: 0.44,
                ease: "power2.in",
              },
              "<0.07",
            )
            .to("[data-auth-wave-front]", {
              morphSVG: waveStart,
              duration: 0.4,
              ease: "power2.out",
            })
            .to(
              "[data-auth-wave-back]",
              {
                morphSVG: waveStart,
                duration: 0.4,
                ease: "power2.out",
              },
              "<0.07",
            );
        }
      }, overlay);

      return () => context.revert();
    });

    return () => {
      media.revert();
      document.body.style.overflow = previousOverflow;
    };
  }, [active, exitAfterComplete, prepareMainEntry]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="pointer-events-auto fixed inset-0 z-[120] overflow-hidden opacity-0"
      role="status"
      aria-live="polite"
      aria-label={`${finalTitle}. ${finalDescription}.`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          data-auth-wave-back
          d={waveStart}
          fill="var(--third)"
          vectorEffect="non-scaling-stroke"
        />
        <path
          data-auth-wave-front
          d={waveStart}
          fill="var(--primary)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div
        data-authenticated-atmosphere
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, color-mix(in oklch, var(--primary-foreground) 10%, transparent), transparent 27%), radial-gradient(circle at 82% 80%, color-mix(in oklch, var(--third) 35%, transparent), transparent 30%)",
        }}
      />

      <div
        data-authenticated-content
        className="absolute inset-0 flex flex-col p-5 text-primary-foreground sm:p-8 lg:p-10"
      >
        <div
          data-authenticated-topline
          className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
        >
          <span className="inline-flex items-center gap-2">
            <IconLink className="size-4" />
            Lihat.in secure handoff
          </span>
          <span className="text-primary-foreground/60">02 / 02</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            data-authenticated-mark
            className="relative grid size-16 place-items-center rounded-[1.35rem] border border-primary-foreground/25 bg-primary-foreground/10 shadow-2xl shadow-black/10 sm:size-20"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-8 sm:size-10"
              fill="none"
              aria-hidden="true"
            >
              <path
                data-authenticated-check
                d="m5 12.5 4.25 4.25L19.5 6.5"
                pathLength="32"
                stroke="currentColor"
                strokeDasharray="32"
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
              />
            </svg>
            <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-primary bg-third" />
          </span>

          <div
            data-authenticated-copy
            className="mt-6 overflow-hidden px-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/65 sm:text-xs">
              {statusLabel}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
              {finalTitle}
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/70 sm:text-base">
              {finalDescription}
            </p>
          </div>

          <span className="mt-7 h-px w-36 overflow-hidden rounded-full bg-primary-foreground/20">
            <span
              data-authenticated-progress
              className="block h-full origin-left scale-x-0 bg-primary-foreground"
            />
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-primary-foreground/55 sm:text-xs">
          <span>Session encrypted</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-third" />
            Ready
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

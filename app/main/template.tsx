"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { IconCheck, IconLink } from "@tabler/icons-react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

const waveStart = "M 0 100 V 100 Q 50 100 100 100 V 100 Z";
const waveMiddle = "M 0 100 V 48 Q 50 -4 100 48 V 100 Z";
const waveEnd = "M 0 100 V 0 Q 50 0 100 0 V 100 Z";

export default function MainTemplate({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showEntry, setShowEntry] = useState(true);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const shouldReveal =
      sessionStorage.getItem("lihatin-main-entry") === "1";
    sessionStorage.removeItem("lihatin-main-entry");

    const content = root.querySelector("[data-main-entry-content]");
    if (!shouldReveal) {
      gsap.set(content, { autoAlpha: 1 });
      queueMicrotask(() => setShowEntry(false));
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: reduce)", () => {
      const timeline = gsap
        .timeline({ onComplete: () => setShowEntry(false) })
        .set(content, { autoAlpha: 1 })
        .to("[data-main-entry-overlay]", {
          autoAlpha: 0,
          duration: 0.28,
        });
      return () => timeline.kill();
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap
          .timeline({ onComplete: () => setShowEntry(false) })
          .set(content, { autoAlpha: 1, scale: 0.992 })
          .to("[data-main-entry-copy]", {
            autoAlpha: 0,
            y: -12,
            duration: 0.25,
            ease: "power2.in",
          })
          .to(
            "[data-main-entry-atmosphere]",
            {
              autoAlpha: 0,
              duration: 0.18,
              ease: "none",
            },
            "<",
          )
          .to("[data-main-entry-front]", {
            morphSVG: waveMiddle,
            duration: 0.48,
            ease: "power2.in",
          })
          .to(
            "[data-main-entry-back]",
            {
              morphSVG: waveMiddle,
              duration: 0.48,
              ease: "power2.in",
            },
            "<0.07",
          )
          .to("[data-main-entry-front]", {
            morphSVG: waveStart,
            duration: 0.42,
            ease: "power2.out",
          })
          .to(
            "[data-main-entry-back]",
            {
              morphSVG: waveStart,
              duration: 0.42,
              ease: "power2.out",
            },
            "<0.07",
          )
          .to(
            content,
            {
              scale: 1,
              duration: 0.5,
              ease: "power3.out",
            },
            "-=0.55",
          );
      }, root);

      return () => context.revert();
    });

    return () => {
      media.revert();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen">
      <div data-main-entry-content className="min-h-screen opacity-0">
        {children}
      </div>

      {showEntry && (
        <div
          data-main-entry-overlay
          className="fixed inset-0 z-[120] overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
          >
            <path
              data-main-entry-back
              d={waveEnd}
              fill="var(--third)"
              vectorEffect="non-scaling-stroke"
            />
            <path
              data-main-entry-front
              d={waveEnd}
              fill="var(--primary)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div
            data-main-entry-atmosphere
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 18% 20%, color-mix(in oklch, var(--primary-foreground) 10%, transparent), transparent 27%), radial-gradient(circle at 82% 80%, color-mix(in oklch, var(--third) 35%, transparent), transparent 30%)",
            }}
          />

          <div
            data-main-entry-copy
            className="absolute inset-0 flex flex-col items-center justify-center text-center text-primary-foreground"
          >
            <span className="grid size-16 place-items-center rounded-[1.35rem] border border-primary-foreground/25 bg-primary-foreground/10 sm:size-20">
              <IconCheck className="size-8 sm:size-10" strokeWidth={2.3} />
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/60 sm:text-xs">
              Identity confirmed
            </p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.05em] sm:text-5xl">
              You&apos;re authenticated
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs text-primary-foreground/65 sm:text-sm">
              <IconLink className="size-4" />
              Welcome to your dashboard
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

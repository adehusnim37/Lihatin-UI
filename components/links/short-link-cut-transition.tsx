"use client";

import { gsap } from "gsap";
import { Check, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CutTransitionPhase = "cutting" | "success";
const MINIMUM_CUTTING_DURATION = 1700;
const MAXIMUM_TRANSITION_DURATION = 3000;

interface ShortLinkCutTransitionProps {
  count?: number;
  onFinish: () => void;
  open: boolean;
  phase: CutTransitionPhase;
  resultUrl?: string;
  sourceUrl: string;
}

export function ShortLinkCutTransition({
  count = 1,
  onFinish,
  open,
  phase,
  resultUrl,
  sourceUrl,
}: ShortLinkCutTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onFinishRef = useRef(onFinish);
  const cuttingStartedAtRef = useRef(0);
  const [displayedPhase, setDisplayedPhase] =
    useState<CutTransitionPhase>(phase);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      onFinishRef.current();
    }, MAXIMUM_TRANSITION_DURATION);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (phase === "cutting") {
      cuttingStartedAtRef.current = Date.now();
      return;
    }

    const elapsed = Date.now() - cuttingStartedAtRef.current;
    const remaining = Math.max(0, MINIMUM_CUTTING_DURATION - elapsed);
    const timer = window.setTimeout(() => {
      setDisplayedPhase("success");
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [open, phase]);

  useEffect(() => {
    const root = rootRef.current;

    if (!open || !root) {
      return;
    }

    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const track = root.querySelector<HTMLElement>("[data-cut-track]");
        const scissor = root.querySelector<SVGSVGElement>("[data-cut-scissor]");

        if (!track || !scissor) {
          return;
        }

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .fromTo(
            root,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.2 },
          )
          .fromTo(
            "[data-cut-panel]",
            { scale: 0.94, y: 18 },
            { duration: 0.42, scale: 1, y: 0 },
            "<",
          );

        gsap.set("[data-cut-result]", {
          autoAlpha: 0,
          scale: 0.78,
          y: 16,
        });
        gsap.set("[data-cut-line]", {
          scaleX: displayedPhase === "success" ? 1 : 0.08,
          transformOrigin: "left center",
        });
        gsap.set("[data-cut-piece]", {
          autoAlpha: 1,
          rotation: 0,
          x: 0,
          y: 0,
        });
        gsap.set("[data-paper-scrap]", {
          autoAlpha: 0,
          rotation: 0,
          scale: 0,
          x: 0,
          y: 0,
        });

        if (displayedPhase === "cutting") {
          const travel = () => Math.max(track.clientWidth - 58, 180);

          gsap
            .timeline({ repeat: -1, repeatDelay: 0.18 })
            .fromTo(
              scissor,
              { autoAlpha: 0, rotation: -7, x: 10, y: -4 },
              {
                autoAlpha: 1,
                duration: 0.12,
                ease: "power1.out",
              },
            )
            .to(scissor, {
                duration: 1.32,
              ease: "sine.inOut",
              rotation: 5,
              x: travel,
              y: 5,
            })
            .to(scissor, {
              autoAlpha: 0,
              duration: 0.12,
              ease: "power1.in",
            });

          gsap.to("[data-cut-blade='top']", {
            duration: 0.16,
            ease: "power2.inOut",
            repeat: -1,
            rotation: 13,
            transformOrigin: "0px 0px",
            yoyo: true,
          });
          gsap.to("[data-cut-blade='bottom']", {
            duration: 0.16,
            ease: "power2.inOut",
            repeat: -1,
            rotation: -13,
            transformOrigin: "0px 0px",
            yoyo: true,
          });
          gsap.to("[data-cut-line]", {
            duration: 1.32,
            ease: "sine.inOut",
            repeat: -1,
            repeatDelay: 0.24,
            scaleX: 1,
          });
          return;
        }

        const center = () => Math.max(track.clientWidth / 2 - 22, 110);

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => onFinishRef.current(),
          })
          .set(scissor, {
            autoAlpha: 1,
            rotation: 0,
            x: center,
            y: 0,
          })
          .to(
            "[data-cut-blade='top']",
            {
              duration: 0.16,
              rotation: 17,
              transformOrigin: "0px 0px",
            },
            0,
          )
          .to(
            "[data-cut-blade='bottom']",
            {
              duration: 0.16,
              rotation: -17,
              transformOrigin: "0px 0px",
            },
            0,
          )
          .to(
            "[data-cut-line]",
            {
              duration: 0.28,
              ease: "power2.inOut",
              scaleX: 1,
            },
            0,
          )
          .to(
            "[data-cut-piece='top']",
            {
              autoAlpha: 0,
              duration: 0.52,
              rotation: -4,
              x: -24,
              y: -30,
            },
            0.16,
          )
          .to(
            "[data-cut-piece='bottom']",
            {
              autoAlpha: 0,
              duration: 0.52,
              rotation: 4,
              x: 24,
              y: 30,
            },
            0.16,
          )
          .to(
            "[data-paper-scrap]",
            {
              autoAlpha: 0.7,
              duration: 0.28,
              ease: "back.out(2)",
              scale: 1,
              stagger: 0.035,
              x: (index) => (index - 2) * 18,
              y: (index) => (index % 2 === 0 ? -25 : 23),
              rotation: (index) => (index - 2) * 19,
            },
            0.17,
          )
          .to(
            scissor,
            {
              autoAlpha: 0,
              duration: 0.2,
              scale: 0.75,
            },
            0.34,
          )
          .to(
            "[data-cut-result]",
            {
              autoAlpha: 1,
              duration: 0.5,
              ease: "back.out(1.8)",
              scale: 1,
              y: 0,
            },
            0.42,
          )
          .to(
            "[data-result-check]",
            {
              duration: 0.32,
              ease: "back.out(2.4)",
              rotation: 360,
              scale: 1.12,
            },
            0.62,
          )
          .to({}, { duration: 0.42 });
      }, root);

      return () => context.revert();
    });

    media.add("(prefers-reduced-motion: reduce)", () => {
      const context = gsap.context(() => {
        gsap.set(root, { autoAlpha: 1 });
        gsap.set("[data-cut-result]", {
          autoAlpha: displayedPhase === "success" ? 1 : 0,
        });
        gsap.set("[data-cut-piece]", {
          autoAlpha: displayedPhase === "success" ? 0 : 1,
        });

        if (displayedPhase === "success") {
          gsap.delayedCall(1.6, () => onFinishRef.current());
        }
      }, root);

      return () => context.revert();
    });

    return () => media.revert();
  }, [displayedPhase, open]);

  if (!open) {
    return null;
  }

  const multiple = count > 1;
  const displayResult =
    resultUrl || (multiple ? `${count} short links ready` : "Short link ready");

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120] grid place-items-center bg-background/78 p-4 opacity-0 backdrop-blur-xl"
      role="status"
      aria-live="polite"
      aria-label={
        displayedPhase === "cutting"
          ? "Creating your short link"
          : "Short link successfully created"
      }
    >
      <div
        data-cut-panel
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-border/80 bg-card p-5 shadow-[0_36px_100px_-35px_color-mix(in_oklab,var(--primary)_70%,transparent)] sm:p-7"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {displayedPhase === "cutting"
                ? "Shortening route"
                : "Cut complete"}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {displayedPhase === "cutting"
                ? multiple
                  ? `Cutting ${count} long URLs`
                  : "Trimming the long URL"
                : multiple
                  ? `${count} links are ready`
                  : "Your short link is ready"}
            </h2>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            {displayedPhase === "success" ? (
              <Check data-result-check className="size-5" strokeWidth={2.5} />
            ) : (
              <Link2 className="size-5" />
            )}
          </span>
        </div>

        <div
          data-cut-track
          className="relative mt-6 h-32 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-muted/65 to-primary/10"
        >
          <div
            data-cut-piece="top"
            className="absolute bottom-16 left-5 right-5 h-7 overflow-hidden rounded-t-xl border-x border-t border-border bg-background shadow-sm"
          >
            <span className="absolute inset-x-0 top-0 flex h-14 items-center px-4">
              <span className="block min-w-0 truncate font-mono text-xs font-semibold text-foreground/80">
                {sourceUrl ||
                  "https://your-very-long-destination.example/path"}
              </span>
            </span>
          </div>
          <div
            data-cut-piece="bottom"
            className="absolute bottom-9 left-5 right-5 h-7 overflow-hidden rounded-b-xl border-x border-b border-border bg-background shadow-sm"
          >
            <span className="absolute -top-7 inset-x-0 flex h-14 items-center px-4">
              <span className="block min-w-0 truncate font-mono text-xs font-semibold text-foreground/80">
                {sourceUrl ||
                  "https://your-very-long-destination.example/path"}
              </span>
            </span>
          </div>

          <div
            data-cut-line
            className="absolute bottom-[63px] left-5 right-5 border-t-2 border-dashed border-primary/45"
          />

          <svg
            data-cut-scissor
            className="absolute bottom-[42px] left-0 size-12 overflow-visible text-foreground drop-shadow-md"
            viewBox="-18 -22 64 44"
            aria-hidden="true"
          >
            <g fill="none" stroke="currentColor" strokeWidth="4">
              <circle cx="-9" cy="-8" r="7" />
              <circle cx="-9" cy="8" r="7" />
              <path d="M-4-4L4 0" strokeLinecap="round" />
              <path d="M-4 4L4 0" strokeLinecap="round" />
              <path
                data-cut-blade="top"
                d="M4 0L39-12"
                stroke="var(--primary)"
                strokeLinecap="round"
              />
              <path
                data-cut-blade="bottom"
                d="M4 0L39 12"
                stroke="var(--primary)"
                strokeLinecap="round"
              />
            </g>
            <circle cx="4" cy="0" r="3" fill="var(--foreground)" />
          </svg>

          <div
            data-cut-result
            className="absolute inset-x-8 bottom-8 flex h-16 items-center gap-3 rounded-2xl border border-primary/35 bg-background px-4 shadow-lg shadow-primary/10"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Link2 className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {multiple ? "Created links" : "New short link"}
              </span>
              <span className="mt-0.5 block truncate font-mono text-sm font-semibold">
                {displayResult}
              </span>
            </span>
          </div>

          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              data-paper-scrap
              className="absolute bottom-[58px] left-1/2 size-2 rounded-[2px] bg-primary/55"
            />
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {displayedPhase === "cutting"
            ? "Keeping the destination intact while removing everything the link does not need."
            : multiple
              ? "All links were created and added to your dashboard."
              : "The destination stays the same—only the route is shorter."}
        </p>
      </div>
    </div>
  );
}

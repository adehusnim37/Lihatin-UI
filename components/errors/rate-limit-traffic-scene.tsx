import type { gsap } from "gsap";

export function animateRateLimitScene(timeline: gsap.core.Timeline) {
  timeline.repeatDelay(2.1);
  timeline
    .set("[data-rate-wait]", { opacity: 0 })
    .set("[data-rate-main-brakes]", { opacity: 0.2 })
    .fromTo(
      "[data-rate-road-dashes]",
      { strokeDashoffset: 0 },
      { strokeDashoffset: -132, duration: 2.4, ease: "sine.out" },
      0,
    )
    .fromTo(
      "[data-rate-leading-car]",
      { attr: { transform: "translate(340 238) scale(0.36)" }, opacity: 1 },
      {
        attr: { transform: "translate(340 214) scale(0.24)" },
        opacity: 0,
        duration: 1.25,
        ease: "power1.in",
      },
      0,
    )
    .fromTo(
      "[data-rate-queued-car]",
      { attr: { transform: "translate(340 299) scale(0.63)" } },
      { attr: { transform: "translate(340 281) scale(0.55)" }, duration: 1.8, ease: "sine.out" },
      0.1,
    )
    .fromTo(
      "[data-rate-main-car]",
      { attr: { transform: "translate(340 410) scale(1.05)" } },
      { attr: { transform: "translate(340 371) scale(0.9)" }, duration: 2.4, ease: "sine.out" },
      0,
    )
    .to("[data-rate-main-brakes]", { opacity: 1, duration: 0.3 }, 1.25)
    .fromTo("[data-rate-red-light]", { opacity: 0.35 }, { opacity: 1, duration: 0.3 }, 0.9)
    .to("[data-rate-wait]", { opacity: 1, duration: 0.3 }, 2.4)
    .fromTo(
      "[data-rate-wait-dot]",
      { opacity: 0.25 },
      { opacity: 1, duration: 0.4, stagger: 0.15, repeat: 1, yoyo: true, ease: "sine.inOut" },
      2.65,
    );
}

function RearCar({ primary = false }: { primary?: boolean }) {
  return (
    <>
      <g fill="var(--foreground)">
        <rect x="-54" y="13" width="13" height="39" rx="5" />
        <rect x="41" y="13" width="13" height="39" rx="5" />
      </g>
      <path
        d="M-49 15L-41-17Q-39-27-27-27H27Q39-27 41-17L49 15V46Q49 55 39 55H-39Q-49 55-49 46Z"
        fill={primary ? "var(--primary)" : "var(--third)"}
        stroke="var(--foreground)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M-29-16H29L35 9H-35Z" fill="var(--primary-foreground)" opacity="0.8" />
      <path d="M-23-12L-29 5M-15-12L-21 5" stroke="var(--card)" strokeWidth="2" opacity="0.3" />
      <path d="M-41 42H41" stroke="var(--primary-ink)" strokeWidth="3" opacity="0.6" />
      <g {...(primary ? { "data-rate-main-brakes": "" } : {})} fill="var(--destructive)">
        <rect x="-42" y="21" width="17" height="9" rx="3" />
        <rect x="25" y="21" width="17" height="9" rx="3" />
      </g>
      <rect x="-15" y="33" width="30" height="11" rx="3" fill="var(--card)" />
      <path d="M-8 38H8" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

export function RateLimitTrafficScene() {
  return (
    <g data-rate-traffic-scene>
      <path d="M310 210H370L535 464H145Z" fill="var(--accent)" />
      <path
        d="M322 210H358L498 464H182Z"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <path
        data-rate-road-dashes
        d="M330 215L220 464M350 215L460 464"
        fill="none"
        stroke="var(--primary-ink)"
        strokeWidth="2"
        strokeDasharray="8 14"
        opacity="0.25"
      />
      <path d="M298 265H382" stroke="var(--muted-foreground)" strokeWidth="4" opacity="0.35" />

      <path
        d="M239 211V251M441 211V251"
        stroke="var(--foreground)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="230"
        y="137"
        width="220"
        height="75"
        rx="12"
        fill="var(--primary)"
        stroke="var(--primary-ink)"
        strokeWidth="2.5"
      />
      <text
        x="340"
        y="169"
        textAnchor="middle"
        fill="var(--primary-foreground)"
        fontSize="26"
        fontWeight="600"
      >
        RATE LIMIT
      </text>
      <text x="340" y="193" textAnchor="middle" fill="var(--primary-foreground)" fontSize="17">
        Pause, then retry
      </text>

      <path
        d="M493 291V389M481 389H505"
        stroke="var(--foreground)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="475"
        y="215"
        width="36"
        height="82"
        rx="10"
        fill="var(--card)"
        stroke="var(--foreground)"
        strokeWidth="2.5"
      />
      <circle data-rate-red-light cx="493" cy="233" r="8" fill="var(--destructive)" />
      <circle cx="493" cy="256" r="8" fill="var(--muted-foreground)" opacity="0.2" />
      <circle cx="493" cy="279" r="8" fill="var(--third)" opacity="0.4" />

      <g data-rate-leading-car transform="translate(340 214) scale(0.24)" opacity="0">
        <RearCar />
      </g>
      <g data-rate-queued-car transform="translate(340 281) scale(0.55)">
        <RearCar />
      </g>
      <g data-rate-wait>
        {[328, 340, 352].map((x) => (
          <circle
            key={x}
            data-rate-wait-dot
            cx={x}
            cy="328"
            r="3.5"
            fill="var(--primary-ink)"
            opacity="0.5"
          />
        ))}
      </g>
      <g data-rate-main-car transform="translate(340 371) scale(0.9)">
        <RearCar primary />
      </g>
    </g>
  );
}

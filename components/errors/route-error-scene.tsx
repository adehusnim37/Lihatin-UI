import type { gsap } from "gsap";

export function animateRouteErrorScene(timeline: gsap.core.Timeline) {
  timeline.repeatDelay(2.2);
  timeline
    .set("[data-courier]", { attr: { transform: "translate(-90 0)" } })
    .set("[data-courier-head]", { attr: { transform: "rotate(0 300 280)" } })
    .set("[data-courier-arm]", { attr: { transform: "rotate(0 355 316)" } })
    .set("[data-courier-antenna]", { attr: { transform: "rotate(0 300 205)" } })
    .set("[data-courier-healthy]", { opacity: 1 })
    .set("[data-courier-fault-light]", { opacity: 0 })
    .set("[data-courier-fault], [data-courier-alert], [data-courier-sparks]", { opacity: 0 })
    .set("[data-courier-parcel]", { attr: { transform: "translate(330 285) rotate(-8)" } })
    .to("[data-courier]", { attr: { transform: "translate(0 0)" }, duration: 1.5, ease: "none" }, 0)
    .to(
      "[data-courier-parcel]",
      { attr: { transform: "translate(420 285) rotate(-8)" }, duration: 1.5, ease: "none" },
      0,
    )
    .fromTo(
      "[data-courier-road]",
      { strokeDashoffset: 0 },
      { strokeDashoffset: -90, duration: 1.5, ease: "none" },
      0,
    )
    .fromTo(
      "[data-courier-wheel-left]",
      { attr: { transform: "rotate(0 260 387)" } },
      { attr: { transform: "rotate(180 260 387)" }, duration: 1.5, ease: "none" },
      0,
    )
    .fromTo(
      "[data-courier-wheel-right]",
      { attr: { transform: "rotate(0 340 387)" } },
      { attr: { transform: "rotate(180 340 387)" }, duration: 1.5, ease: "none" },
      0,
    )
    // The motor stutters before the arm releases the delivery.
    .to(
      "[data-courier]",
      {
        attr: { transform: "translate(-5 0)" },
        duration: 0.09,
        repeat: 5,
        yoyo: true,
        ease: "sine.inOut",
      },
      1.5,
    )
    .to("[data-courier-healthy]", { opacity: 0, duration: 0.08 }, 1.5)
    .to("[data-courier-fault]", { opacity: 1, duration: 0.12 }, 1.6)
    .to("[data-courier-fault-light]", { opacity: 1, duration: 0.12 }, 1.6)
    .to("[data-courier-sparks]", { opacity: 1, duration: 0.08, repeat: 3, yoyo: true }, 1.52)
    .to(
      "[data-courier-head]",
      { attr: { transform: "rotate(10 300 280)" }, duration: 0.65, ease: "power2.inOut" },
      1.7,
    )
    .to(
      "[data-courier-antenna]",
      { attr: { transform: "rotate(28 300 205)" }, duration: 0.7, ease: "power2.out" },
      1.75,
    )
    .to(
      "[data-courier-arm]",
      { attr: { transform: "rotate(24 355 316)" }, duration: 0.55, ease: "power2.in" },
      2,
    )
    .to(
      "[data-courier-parcel]",
      { attr: { transform: "translate(454 384) rotate(18)" }, duration: 0.55, ease: "power2.in" },
      2,
    )
    .to(
      "[data-courier-parcel]",
      { attr: { transform: "translate(459 372) rotate(7)" }, duration: 0.2, ease: "power2.out" },
      2.55,
    )
    .to(
      "[data-courier-parcel]",
      { attr: { transform: "translate(462 386) rotate(12)" }, duration: 0.25, ease: "power2.in" },
      2.75,
    )
    .fromTo(
      "[data-courier-alert]",
      { opacity: 0, attr: { transform: "translate(0 8)" } },
      { opacity: 1, attr: { transform: "translate(0 0)" }, duration: 0.35, ease: "power3.out" },
      2.1,
    )
    .to(
      "[data-courier-fault-light]",
      { opacity: 0.35, duration: 0.45, repeat: 3, yoyo: true, ease: "sine.inOut" },
      3.1,
    );
}

export function RouteErrorScene() {
  return (
    <g data-route-error-scene strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 418H560" stroke="var(--border)" strokeWidth="2" />
      <path
        data-courier-road
        d="M120 439H560"
        stroke="var(--primary-ink)"
        strokeWidth="2"
        strokeDasharray="8 18"
        opacity="0.2"
      />

      <g data-courier transform="translate(0 0)">
        <path d="M264 356V382M336 356V382" stroke="var(--foreground)" strokeWidth="12" />
        {[260, 340].map((x, index) => (
          <g key={x}>
            <circle cx={x} cy="387" r="31" fill="var(--foreground)" />
            <circle cx={x} cy="387" r="20" fill="var(--card)" />
            <g
              {...(index === 0
                ? { "data-courier-wheel-left": "" }
                : { "data-courier-wheel-right": "" })}
            >
              <path
                d={`M${x} 371V403M${x - 16} 387H${x + 16}`}
                stroke="var(--muted-foreground)"
                strokeWidth="3"
              />
            </g>
            <circle cx={x} cy="387" r="6" fill="var(--primary)" />
          </g>
        ))}
        <path d="M286 270V294M314 270V294" stroke="var(--foreground)" strokeWidth="6" />
        <rect
          x="235"
          y="289"
          width="130"
          height="78"
          rx="19"
          fill="var(--primary)"
          stroke="var(--foreground)"
          strokeWidth="3"
        />
        <path d="M249 353H351" stroke="var(--primary-ink)" strokeWidth="3" opacity="0.45" />
        <rect
          x="254"
          y="306"
          width="64"
          height="31"
          rx="7"
          fill="var(--card)"
          stroke="var(--foreground)"
          strokeWidth="2"
        />
        <path
          data-courier-healthy
          d="M267 321H277L283 313L290 329L297 321H306"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth="3"
          opacity="0"
        />
        <g data-courier-fault fill="none" stroke="var(--destructive)" strokeWidth="3">
          <path d="M268 315L280 327M280 315L268 327M291 321H305" />
        </g>
        <circle data-courier-fault-light cx="340" cy="322" r="6" fill="var(--destructive)" />

        <g data-courier-arm transform="rotate(24 355 316)">
          <path
            d="M355 316L385 331L407 309"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="12"
          />
          <path d="M355 316L385 331L407 309" fill="none" stroke="var(--third)" strokeWidth="7" />
          <circle
            cx="355"
            cy="316"
            r="10"
            fill="var(--card)"
            stroke="var(--foreground)"
            strokeWidth="3"
          />
          <path
            d="M403 305L409 296L423 301M407 309L414 317L426 310"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="4"
          />
        </g>

        <g data-courier-head transform="rotate(10 300 280)">
          <g data-courier-antenna transform="rotate(28 300 205)">
            <path d="M300 206V183" stroke="var(--foreground)" strokeWidth="4" />
            <circle
              cx="300"
              cy="177"
              r="7"
              fill="var(--third)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
            />
          </g>
          <rect
            x="237"
            y="228"
            width="13"
            height="27"
            rx="5"
            fill="var(--third)"
            stroke="var(--foreground)"
            strokeWidth="2.5"
          />
          <rect
            x="350"
            y="228"
            width="13"
            height="27"
            rx="5"
            fill="var(--third)"
            stroke="var(--foreground)"
            strokeWidth="2.5"
          />
          <rect
            x="247"
            y="205"
            width="106"
            height="73"
            rx="18"
            fill="var(--card)"
            stroke="var(--foreground)"
            strokeWidth="3"
          />
          <rect x="259" y="220" width="82" height="39" rx="11" fill="var(--accent)" />
          <g data-courier-healthy opacity="0" stroke="var(--primary-ink)" strokeWidth="5">
            <path d="M278 235V244M321 235V244" />
            <path d="M294 246Q300 251 306 246" fill="none" strokeWidth="2.5" />
          </g>
          <g data-courier-fault stroke="var(--primary-ink)" strokeWidth="4">
            <path d="M274 240L285 237M315 237L326 240M295 250H305" />
          </g>
        </g>
        <path
          data-courier-sparks
          d="M224 222L215 214M228 201L224 190M367 210L377 202"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth="3"
          opacity="0"
        />
      </g>

      <g data-courier-parcel transform="translate(462 386) rotate(12)">
        <rect
          x="-28"
          y="-27"
          width="56"
          height="54"
          rx="9"
          fill="var(--third)"
          stroke="var(--foreground)"
          strokeWidth="2.5"
        />
        <path
          d="M-28-12H28M-5-27V-12H6V-27"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth="2"
        />
        <g
          transform="translate(0 8) rotate(-35)"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth="2.5"
        >
          <rect x="-16" y="-6" width="21" height="12" rx="6" />
          <rect x="-5" y="-6" width="21" height="12" rx="6" />
        </g>
      </g>

      <g data-courier-alert>
        <path
          d="M426 164H484Q497 164 497 177V221Q497 234 484 234H449L433 247V234H426Q413 234 413 221V177Q413 164 426 164Z"
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <path
          d="M455 179L477 218H433Z"
          fill="var(--accent)"
          stroke="var(--primary-ink)"
          strokeWidth="2.5"
        />
        <path d="M455 192V202M455 209V210" stroke="var(--primary-ink)" strokeWidth="3.5" />
      </g>
    </g>
  );
}

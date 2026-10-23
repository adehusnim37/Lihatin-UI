import type { gsap } from "gsap";

const elbow = { x: 266, y: 314 };
const forearmLength = 45;
const watchScale = 0.42;
const wristAngle = -24;
const wrist = {
  x: elbow.x + forearmLength * Math.cos((wristAngle * Math.PI) / 180),
  y: elbow.y + forearmLength * Math.sin((wristAngle * Math.PI) / 180),
};

// Interpolate a camera matrix so the wrist stays in view throughout the zoom.
const zoom = 5.1 / watchScale;
const radians = (-wristAngle * Math.PI) / 180;
const a = zoom * Math.cos(radians);
const b = zoom * Math.sin(radians);
const c = -b;
const d = a;
const closeup = `matrix(${a} ${b} ${c} ${d} ${340 - a * wrist.x - c * wrist.y} ${280 - b * wrist.x - d * wrist.y})`;
const wide = "matrix(1 0 0 1 0 0)";

export function animateExpiredScene(timeline: gsap.core.Timeline) {
  timeline.repeatDelay(0.7);
  timeline
    .set("[data-watch-clock]", { opacity: 1 })
    .set("[data-watch-expired]", { opacity: 0 })
    .set("[data-watch-minute]", { attr: { transform: "rotate(-70)" } })
    .fromTo(
      "[data-person-context]",
      { opacity: 1 },
      { opacity: 0.18, duration: 1.35, ease: "sine.inOut" },
      1.55,
    )
    .fromTo(
      "[data-person-forearm]",
      { attr: { transform: "rotate(68)" } },
      { attr: { transform: `rotate(${wristAngle})` }, duration: 1.05, ease: "power2.inOut" },
      0.25,
    )
    .fromTo(
      "[data-person-head]",
      { attr: { transform: "rotate(0 330 228)" } },
      { attr: { transform: "rotate(-12 330 228)" }, duration: 0.65, ease: "power2.inOut" },
      0.55,
    )
    .fromTo(
      "[data-watch-camera]",
      { attr: { transform: wide } },
      { attr: { transform: closeup }, duration: 1.65, ease: "power2.inOut" },
      1.55,
    )
    .to("[data-watch-minute]", { attr: { transform: "rotate(0)" }, duration: 3, ease: "none" }, 0.5)
    .to("[data-watch-clock]", { opacity: 0, duration: 0.3 }, 3.5)
    .to("[data-watch-expired]", { opacity: 1, duration: 0.35 }, 3.7)
    // Hold the close-up long enough to read, then pull back for a continuous loop.
    .to("[data-watch-camera]", { attr: { transform: wide }, duration: 1, ease: "power2.inOut" }, 6)
    .to("[data-person-context]", { opacity: 1, duration: 0.9, ease: "sine.inOut" }, 6)
    .to(
      "[data-person-head]",
      { attr: { transform: "rotate(0 330 228)" }, duration: 0.55, ease: "power2.inOut" },
      6.45,
    )
    .to(
      "[data-person-forearm]",
      { attr: { transform: "rotate(68)" }, duration: 0.75, ease: "power2.inOut" },
      6.45,
    );
}

function Wristwatch() {
  return (
    <g data-wristwatch transform={`translate(${forearmLength} 0) scale(${watchScale})`}>
      <rect x="-13" y="-44" width="26" height="88" rx="7" fill="var(--primary-ink)" />
      <path d="M-8-35H8M-8 35H8" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6" />
      <rect x="23" y="-7" width="4" height="14" rx="2" fill="var(--foreground)" />
      <rect
        x="-24"
        y="-28"
        width="48"
        height="56"
        rx="12"
        fill="var(--primary)"
        stroke="var(--foreground)"
        strokeWidth="2"
      />
      <rect x="-19" y="-23" width="38" height="46" rx="8" fill="var(--card)" />
      <g data-watch-clock opacity="0">
        <circle r="14" fill="none" stroke="var(--border)" strokeWidth="0.8" />
        <path
          d="M0-14V-11M14 0H11M0 14V11M-14 0H-11"
          stroke="var(--muted-foreground)"
          strokeWidth="1"
        />
        <path d="M0 1L7-4" stroke="var(--foreground)" strokeWidth="1.5" strokeLinecap="round" />
        <path
          data-watch-minute
          transform="rotate(0)"
          d="M0 2V-10"
          stroke="var(--primary-ink)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle r="1.5" fill="var(--foreground)" />
      </g>
      <g data-watch-expired>
        <path
          d="M-1-12L-4-9A3 3 0 0 0 0-5L3-8M1-10L4-13A3 3 0 0 0 0-17L-3-14M-2-9L2-13"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="7.1"
          fontWeight="600"
        >
          EXPIRED
        </text>
        <path d="M-9 12H9" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function ExpiredTimeScene({ idPrefix }: { idPrefix: string }) {
  return (
    <g>
      <defs>
        <clipPath id={`${idPrefix}-watch-stage`}>
          <rect x="28" y="112" width="624" height="340" rx="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${idPrefix}-watch-stage)`}>
        <g data-watch-camera transform={closeup}>
          <g data-person-context opacity="0.18">
            <path
              d="M242 440H427"
              stroke="var(--foreground)"
              strokeWidth="2"
              opacity="0.12"
              strokeLinecap="round"
            />
            <path
              d="M290 362H372L369 431H340L331 387L323 431H292Z"
              fill="var(--muted)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M291 428H323L327 438H282Q280 430 291 428ZM341 428H370L383 435Q384 438 380 438H339Z"
              fill="var(--card)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M379 257Q390 256 396 273L412 322L399 336L379 310L366 279Z"
              fill="var(--primary)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M399 323L411 329L403 372Q400 384 392 382Q386 381 388 372Z"
              fill="var(--background)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
            />
            <path
              d="M280 247Q329 229 380 247L389 280L377 303L375 373H284L279 303L266 282Z"
              fill="var(--primary)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M310 240Q329 262 351 240M298 354H362"
              fill="none"
              stroke="var(--primary-foreground)"
              strokeWidth="2"
              opacity="0.5"
            />
            <path
              d="M279 253Q266 253 258 270L249 300Q243 316 260 325L278 314L286 284Z"
              fill="var(--primary)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M248 303L274 317" stroke="var(--primary-ink)" strokeWidth="3" />
            <path
              d="M316 218V239Q330 251 344 239V218"
              fill="var(--background)"
              stroke="var(--foreground)"
              strokeWidth="2.5"
            />
            <g data-person-head transform="rotate(-12 330 228)">
              <rect
                x="291"
                y="140"
                width="78"
                height="87"
                rx="34"
                fill="var(--background)"
                stroke="var(--foreground)"
                strokeWidth="2.5"
              />
              <path
                d="M291 182V171Q289 139 320 135Q352 129 366 153Q374 165 368 180L360 174L357 157Q340 169 316 163L302 179L301 193H294Z"
                fill="var(--foreground)"
              />
              <path
                d="M293 181Q285 177 286 187Q286 197 297 196"
                fill="var(--background)"
                stroke="var(--foreground)"
                strokeWidth="2"
              />
              <path
                d="M317 188L324 187M341 185L348 186"
                stroke="var(--foreground)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="321" cy="194" r="2" fill="var(--foreground)" />
              <circle cx="345" cy="193" r="2" fill="var(--foreground)" />
              <path
                d="M333 194L332 201H337M326 211Q335 215 343 210"
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>

          <g transform={`translate(${elbow.x} ${elbow.y})`}>
            <g data-person-forearm transform={`rotate(${wristAngle})`}>
              <path
                d="M-5-9H51L56-13Q61-15 64-9L66-5L73-3Q78-1 75 4L71 9Q69 12 64 10L51 9H-5Q-15 9-15 0Q-15-9-5-9Z"
                fill="var(--background)"
                stroke="var(--foreground)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M63-3L71-1M62 3L69 5"
                stroke="var(--border)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <Wristwatch />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

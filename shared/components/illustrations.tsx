import React from "react";

/*
 * Spot illustrations. Flat, geometric, two-tone: ink outlines on paper,
 * solid ink for the one thing that matters in each scene. Colours come from
 * the --ill-* tokens in globals.css so every drawing follows the theme.
 */

const INK = "var(--ill-ink)";
const PAPER = "var(--ill-paper)";
const BODY = "var(--ill-body)";
const SHADE = "var(--ill-shade)";
const LINE = "var(--ill-line)";
const ACCENT = "var(--ill-accent)";
const ACCENT_SOFT = "var(--ill-accent-soft)";
// inactive plates are outline drawings, but still opaque so shapes never show through each other
const OFF = "var(--card)";

type IllProps = { className?: string };

function TextLines({ x, y, w, rows, gap = 6, accentFirst = false }: { x: number; y: number; w: number; rows: number; gap?: number; accentFirst?: boolean }) {
  return (
    <g strokeLinecap="round">
      {Array.from({ length: rows }).map((_, i) => (
        <line
          key={i}
          x1={x}
          y1={y + i * gap}
          x2={x + (i === rows - 1 ? w * 0.55 : i % 2 ? w * 0.85 : w)}
          y2={y + i * gap}
          stroke={i === 0 && accentFirst ? ACCENT : LINE}
          strokeWidth={i === 0 && accentFirst ? 3 : 2}
        />
      ))}
    </g>
  );
}

/** A desktop printer taking a sheet in and pushing one out. Used on the upload drop area. */
export function PrinterScene({ className = "", active = false }: IllProps & { active?: boolean }) {
  return (
    <svg viewBox="0 0 200 150" className={className} fill="none" aria-hidden="true">
      <ellipse cx="100" cy="141" rx="72" ry="4" fill={SHADE} />
      {/* sheet going in */}
      <g className={`transition-transform duration-500 ease-out ${active ? "-translate-y-1.5" : ""}`}>
        <rect x="64" y="10" width="72" height="50" rx="2" fill={PAPER} stroke={INK} strokeWidth="2" />
        <TextLines x={74} y={22} w={50} rows={4} />
      </g>
      {/* body */}
      <rect x="28" y="48" width="144" height="58" rx="10" fill={BODY} stroke={INK} strokeWidth="2" />
      <rect x="46" y="42" width="108" height="14" rx="4" fill={SHADE} stroke={INK} strokeWidth="2" />
      <circle cx="46" cy="70" r="4" fill={ACCENT} />
      <rect x="126" y="64" width="30" height="12" rx="3" fill={PAPER} stroke={INK} strokeWidth="2" />
      <line x1="132" y1="70" x2="144" y2="70" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
      {/* sheet coming out */}
      <g className={`transition-transform duration-500 ease-out ${active ? "translate-y-2" : ""}`}>
        <rect x="58" y="90" width="84" height="40" rx="2" fill={PAPER} stroke={INK} strokeWidth="2" />
        <TextLines x={68} y={104} w={60} rows={3} accentFirst />
      </g>
      <rect x="48" y="86" width="104" height="7" rx="3.5" fill={INK} />
    </svg>
  );
}

/** Three same-scale plates: in the tray, feeding, stacked. The current one is drawn in colour. */
export type PlateStage = "queued" | "printing" | "done";

function PlateQueued({ on }: { on: boolean }) {
  return (
    <g>
      {/* tray */}
      <path d="M14 58 L22 44 H74 L82 58 Z" fill={on ? BODY : OFF} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      {/* sheets waiting */}
      <rect x="28" y="18" width="40" height="34" rx="2" fill={on ? PAPER : OFF} stroke={INK} strokeWidth="2" transform="rotate(-6 48 35)" />
      <rect x="28" y="16" width="40" height="34" rx="2" fill={on ? PAPER : OFF} stroke={INK} strokeWidth="2" />
      <g strokeLinecap="round" strokeWidth="2">
        <line x1="35" y1="25" x2="61" y2="25" stroke={on ? ACCENT : LINE} strokeWidth={on ? 3 : 2} />
        <line x1="35" y1="31" x2="58" y2="31" stroke={LINE} />
        <line x1="35" y1="37" x2="52" y2="37" stroke={LINE} />
      </g>
      <rect x="14" y="58" width="68" height="6" rx="3" fill={on ? INK : OFF} stroke={INK} strokeWidth="2" />
    </g>
  );
}

function PlatePrinting({ on }: { on: boolean }) {
  return (
    <g>
      {/* sheet first, so the printer body hides it until it leaves the slot */}
      <g className={on ? "animate-sheet-feed" : ""}>
        <rect x="26" y="36" width="44" height="30" rx="2" fill={on ? PAPER : OFF} stroke={INK} strokeWidth="2" />
        <g strokeLinecap="round" strokeWidth="2">
          <line x1="33" y1="48" x2="62" y2="48" stroke={on ? ACCENT : LINE} strokeWidth={on ? 3 : 2} />
          <line x1="33" y1="54" x2="57" y2="54" stroke={LINE} />
          <line x1="33" y1="60" x2="50" y2="60" stroke={LINE} />
        </g>
      </g>
      <rect x="12" y="14" width="72" height="30" rx="7" fill={on ? BODY : OFF} stroke={INK} strokeWidth="2" />
      <circle cx="24" cy="26" r="3" fill={on ? ACCENT : OFF} stroke={on ? "none" : INK} strokeWidth="1.5" />
      <rect x="20" y="36" width="56" height="5" rx="2.5" fill={INK} />
    </g>
  );
}

function PlateDone({ on }: { on: boolean }) {
  return (
    <g>
      <rect x="22" y="40" width="48" height="22" rx="2" fill={on ? PAPER : OFF} stroke={INK} strokeWidth="2" />
      <rect x="25" y="32" width="48" height="22" rx="2" fill={on ? PAPER : OFF} stroke={INK} strokeWidth="2" />
      <rect x="28" y="16" width="48" height="30" rx="2" fill={on ? PAPER : OFF} stroke={INK} strokeWidth="2" />
      <g strokeLinecap="round" strokeWidth="2">
        <line x1="35" y1="25" x2="62" y2="25" stroke={on ? ACCENT : LINE} strokeWidth={on ? 3 : 2} />
        <line x1="35" y1="31" x2="58" y2="31" stroke={LINE} />
        <line x1="35" y1="37" x2="50" y2="37" stroke={LINE} />
      </g>
      <circle cx="72" cy="50" r="11" fill={on ? ACCENT : PAPER} stroke={on ? ACCENT : INK} strokeWidth="2" />
      <path d="M67 50.5 L70.5 54 L77 47" stroke={on ? PAPER : INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function StatusPlates({
  stage,
  labels,
  className = "",
}: {
  stage: PlateStage;
  labels: Record<PlateStage, string>;
  className?: string;
}) {
  const order: PlateStage[] = ["queued", "printing", "done"];
  const current = order.indexOf(stage);
  return (
    <ol className={`grid grid-cols-3 gap-2 sm:gap-4 ${className}`}>
      {order.map((s, i) => {
        const on = s === stage;
        const past = i < current;
        return (
          <li key={s} className="flex flex-col items-center text-center" aria-current={on ? "step" : undefined}>
            <div
              className={`w-full rounded-xl transition-colors duration-300 ${
                on ? "bg-accent" : ""
              }`}
            >
              <svg
                viewBox="0 0 96 76"
                className={`mx-auto w-full max-w-[120px] transition-opacity duration-300 ${on ? "opacity-100" : past ? "opacity-45" : "opacity-30"}`}
                fill="none"
                aria-hidden="true"
              >
                {s === "queued" && <PlateQueued on={on} />}
                {s === "printing" && <PlatePrinting on={on} />}
                {s === "done" && <PlateDone on={on} />}
              </svg>
            </div>
            <span
              className={`mt-2 text-xs sm:text-[13px] leading-tight ${
                on ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {labels[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** An empty output tray. Staff queue with nothing waiting. */
export function EmptyTray({ className = "" }: IllProps) {
  return (
    <svg viewBox="0 0 160 110" className={className} fill="none" aria-hidden="true">
      <ellipse cx="80" cy="102" rx="58" ry="3.5" fill={SHADE} />
      <rect x="26" y="18" width="108" height="44" rx="9" fill={BODY} stroke={INK} strokeWidth="2" />
      <circle cx="42" cy="36" r="3.5" fill={LINE} />
      <rect x="98" y="30" width="24" height="10" rx="3" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="40" y="52" width="80" height="6" rx="3" fill={INK} />
      <path d="M22 84 L34 66 H126 L138 84 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="22" y="84" width="116" height="8" rx="4" fill={SHADE} stroke={INK} strokeWidth="2" />
      <path d="M68 76 h24" stroke={LINE} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" />
    </svg>
  );
}

/** A counter bell. Staff sign-in. */
export function CounterBell({ className = "" }: IllProps) {
  return (
    <svg viewBox="0 0 160 110" className={className} fill="none" aria-hidden="true">
      <ellipse cx="80" cy="100" rx="56" ry="3.5" fill={SHADE} />
      <rect x="72" y="18" width="16" height="8" rx="3" fill={INK} />
      <rect x="77" y="25" width="6" height="9" fill={INK} />
      <path d="M36 82 C36 52 56 34 80 34 C104 34 124 52 124 82 Z" fill={ACCENT_SOFT} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M54 62 C58 52 66 46 74 44" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
      <rect x="26" y="82" width="108" height="12" rx="4" fill={BODY} stroke={INK} strokeWidth="2" />
      {/* ticket stub resting beside it */}
      <g transform="rotate(-10 140 70)">
        <path d="M126 52 h26 v8 a4 4 0 0 0 0 8 v8 h-26 v-8 a4 4 0 0 0 0 -8 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <line x1="131" y1="60" x2="147" y2="60" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="131" y1="68" x2="142" y2="68" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** A claim stub with its code, under a magnifier. Finding a ticket you already have. */
export function FoundStub({ className = "" }: IllProps) {
  return (
    <svg viewBox="0 0 160 110" className={className} fill="none" aria-hidden="true">
      <ellipse cx="80" cy="102" rx="56" ry="3.5" fill={SHADE} />
      <g transform="rotate(-4 72 54)">
        <path
          d="M24 22 h96 v20 a10 10 0 0 0 0 20 v20 h-96 v-20 a10 10 0 0 0 0 -20 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line x1="34" y1="52" x2="110" y2="52" stroke={LINE} strokeWidth="2" strokeDasharray="4 4" />
        {/* the code, highlighted like the marker on the real ticket */}
        <rect x="38" y="31" width="68" height="13" rx="2" fill={ACCENT_SOFT} />
        <line x1="44" y1="37.5" x2="98" y2="37.5" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeDasharray="7 4" />
        <line x1="40" y1="66" x2="78" y2="66" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="73" x2="66" y2="73" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* magnifier over the code */}
      <circle cx="112" cy="44" r="17" fill={PAPER} fillOpacity="0.55" stroke={INK} strokeWidth="2" />
      <path d="M124 56 L138 70" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M103 38 a10 10 0 0 1 9 -6" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** A claim stub with no code on it. Ticket not found. */
export function MissingStub({ className = "" }: IllProps) {
  return (
    <svg viewBox="0 0 160 110" className={className} fill="none" aria-hidden="true">
      <ellipse cx="80" cy="102" rx="56" ry="3.5" fill={SHADE} />
      <g transform="rotate(-4 72 54)">
        <path
          d="M24 22 h96 v20 a10 10 0 0 0 0 20 v20 h-96 v-20 a10 10 0 0 0 0 -20 Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line x1="34" y1="52" x2="110" y2="52" stroke={LINE} strokeWidth="2" strokeDasharray="4 4" />
        <rect x="40" y="31" width="64" height="12" rx="2" fill="none" stroke={LINE} strokeWidth="2" strokeDasharray="4 3" />
        <line x1="40" y1="66" x2="78" y2="66" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="73" x2="66" y2="73" stroke={LINE} strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* magnifier */}
      <circle cx="116" cy="70" r="15" fill={ACCENT_SOFT} stroke={INK} strokeWidth="2" />
      <path d="M127 81 L140 94" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M108 65 a9 9 0 0 1 8 -5" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

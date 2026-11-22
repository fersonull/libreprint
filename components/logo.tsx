import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  /** "ink" draws fixed light-paper colours, for exports that must not follow the site theme. */
  variant?: "theme" | "ink";
}

const FILLS = {
  theme: ["fill-zinc-900 dark:fill-zinc-100", "fill-zinc-800/85 dark:fill-zinc-200/90", "fill-zinc-700/60 dark:fill-zinc-400/60", "fill-white dark:fill-zinc-950", "text-zinc-900 dark:text-zinc-50"],
};
// Literal fill attributes: image exporters skip SVG fills that come from CSS classes.
const INK = ["#18181b", "rgb(39 39 42 / 0.85)", "rgb(63 63 70 / 0.6)", "#ffffff"];

/**
 * Bespoke geometric SVG mark for libreprint.
 * Symbolism:
 * - Two angled paper sheets lifting off and unfurling like wings (symbolizing "libre" - freedom & open access).
 * - The crisp folded geometries intersect to subtly form the monograms 'L' and 'P'.
 * - A centered circular perforation / print registration anchor.
 */
export function LibrePrintLogo({ className = "", size = 28, showText = true, variant = "theme" }: LogoProps) {
  const ink = variant === "ink";
  const paint = (i: number) => (ink ? { fill: INK[i] } : { className: FILLS.theme[i] });
  const text = ink ? "text-zinc-900" : FILLS.theme[4];
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-label="libreprint logo"
      >
        {/* Base back sheet (L-stem / print bed foundation) */}
        <path
          d="M6 10C6 7.79086 7.79086 6 10 6H24L18 20H10C7.79086 20 6 18.2091 6 16V10Z"
          {...paint(0)}
        />

        {/* Dynamic rising sheet (Wing / P-loop of LibrePrint) */}
        <path
          d="M16 8L31.5 12C33.5 12.5 34.5 14.8 33.7 16.8L28.5 29.5C27.8 31.2 25.8 32.2 24 31.8L12 29L19 14.5L16 8Z"
          {...paint(1)}
        />

        {/* Lower support fold */}
        <path
          d="M10 24H22L16 34H10C7.79086 34 6 32.2091 6 30V26C6 24.8954 6.89543 24 8 24H10Z"
          {...paint(2)}
        />

        {/* Print alignment / registration aperture */}
        <circle
          cx="20"
          cy="20"
          r="2.5"
          {...paint(3)}
        />
      </svg>

      {showText && (
        <span className={`font-semibold tracking-tight text-lg font-sans lowercase ${text}`}>
          libreprint
        </span>
      )}
    </div>
  );
}

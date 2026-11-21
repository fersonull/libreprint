import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Bespoke geometric SVG mark for libreprint.
 * Symbolism:
 * - Two angled paper sheets lifting off and unfurling like wings (symbolizing "libre" - freedom & open access).
 * - The crisp folded geometries intersect to subtly form the monograms 'L' and 'P'.
 * - A centered circular perforation / print registration anchor.
 */
export function LibrePrintLogo({ className = "", size = 28, showText = true }: LogoProps) {
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
          className="fill-zinc-900 dark:fill-zinc-100"
        />

        {/* Dynamic rising sheet (Wing / P-loop of LibrePrint) */}
        <path
          d="M16 8L31.5 12C33.5 12.5 34.5 14.8 33.7 16.8L28.5 29.5C27.8 31.2 25.8 32.2 24 31.8L12 29L19 14.5L16 8Z"
          className="fill-zinc-800/85 dark:fill-zinc-200/90"
        />

        {/* Lower support fold */}
        <path
          d="M10 24H22L16 34H10C7.79086 34 6 32.2091 6 30V26C6 24.8954 6.89543 24 8 24H10Z"
          className="fill-zinc-700/60 dark:fill-zinc-400/60"
        />

        {/* Print alignment / registration aperture */}
        <circle
          cx="20"
          cy="20"
          r="2.5"
          className="fill-white dark:fill-zinc-950"
        />
      </svg>

      {showText && (
        <span className="font-semibold tracking-tight text-lg text-zinc-900 dark:text-zinc-50 font-sans lowercase">
          libreprint
        </span>
      )}
    </div>
  );
}

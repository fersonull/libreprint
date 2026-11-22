"use client";

import type { PaperSize, Orientation } from "./upload-form";
import { cn } from "@/lib/utils";

/** Real sheet sizes in inches (portrait) and mm, for the drawing and caption. */
export const PAPER_SPECS: Record<PaperSize, { w: number; h: number; mm: string; short: string }> = {
  "Short (Letter)": { w: 8.5, h: 11, mm: "216 × 279 mm", short: "Short" },
  A4: { w: 8.27, h: 11.69, mm: "210 × 297 mm", short: "A4" },
  "Long (Legal)": { w: 8.5, h: 14, mm: "216 × 356 mm", short: "Long" },
  A3: { w: 11.7, h: 16.5, mm: "297 × 420 mm", short: "A3" },
};

const BOX_W = 260;
const BOX_H = 196;
// One scale for every size, so A3 really looks bigger than Letter.
const PX_PER_IN = 10.2;

const INK = "var(--ill-ink)";
const PAPER = "var(--ill-paper)";
const LINE = "var(--ill-line)";
const SHADE = "var(--ill-shade)";

/**
 * The signature drawing: the sheet the shop will hand back, drawn to scale.
 * Paper size and orientation change its shape, copies stack it, two-sided
 * folds a corner to show the back, and colour mode tints the content.
 */
export function SheetPreview({
  paperSize,
  orientation,
  colorMode,
  doubleSided,
  copies,
  label,
  empty = false,
  className,
}: {
  paperSize: PaperSize;
  orientation: Orientation;
  colorMode: "bw" | "color";
  doubleSided: boolean;
  copies: number;
  label: string;
  empty?: boolean;
  className?: string;
}) {
  const spec = PAPER_SPECS[paperSize];
  const landscape = orientation === "landscape";
  const w = (landscape ? spec.h : spec.w) * PX_PER_IN;
  const h = (landscape ? spec.w : spec.h) * PX_PER_IN;
  const stack = Math.min(Math.max(copies, 1), 3);
  const offset = 5;
  // Centre the whole stack, not just the front sheet.
  const x = (BOX_W - w - (stack - 1) * offset) / 2;
  const y = (BOX_H - h - (stack - 1) * offset) / 2 + (stack - 1) * offset;

  const color = colorMode === "color";
  const pad = Math.max(8, w * 0.1);
  const innerW = w - pad * 2;
  const fold = Math.min(w, h) * 0.22;

  // Content blocks laid out relative to the sheet, so they reflow on rotate.
  const lines = Math.max(3, Math.floor((h - pad * 2) / 9) - (landscape ? 4 : 6));
  const imgH = Math.min(h * 0.26, 44);
  const imgW = landscape ? innerW * 0.42 : innerW;
  const textTop = landscape ? y + pad + 10 : y + pad + 12 + imgH + 8;
  const textX = landscape ? x + pad + imgW + 8 : x + pad;
  const textW = landscape ? innerW - imgW - 8 : innerW;

  const key = `${paperSize}-${orientation}-${colorMode}-${doubleSided}-${stack}`;

  return (
    <figure className={cn("relative flex flex-col items-center gap-3", className)}>
      <div className="relative w-full">
        <svg
          key={key}
          viewBox={`0 0 ${BOX_W} ${BOX_H}`}
          className={cn(
            "mx-auto h-auto w-full max-w-[300px] animate-in fade-in zoom-in-95 duration-300",
            empty && "opacity-50"
          )}
          role="img"
          aria-label={label}
        >
          <ellipse cx={BOX_W / 2} cy={BOX_H - 6} rx={w * 0.62} ry={3.5} fill={SHADE} />

          {/* copies stacked behind the front sheet */}
          {Array.from({ length: stack - 1 }).map((_, i) => {
            const n = stack - 1 - i;
            return (
              <rect
                key={n}
                x={x + n * offset}
                y={y - n * offset}
                width={w}
                height={h}
                rx={2.5}
                fill={PAPER}
                stroke={INK}
                strokeWidth={1.5}
              />
            );
          })}

          {/* front sheet, with its corner cut when it folds */}
          <path
            d={
              doubleSided
                ? `M${x + 2.5} ${y} H${x + w - fold} L${x + w} ${y + fold} V${y + h - 2.5} Q${x + w} ${y + h} ${x + w - 2.5} ${y + h} H${x + 2.5} Q${x} ${y + h} ${x} ${y + h - 2.5} V${y + 2.5} Q${x} ${y} ${x + 2.5} ${y} Z`
                : `M${x + 2.5} ${y} H${x + w - 2.5} Q${x + w} ${y} ${x + w} ${y + 2.5} V${y + h - 2.5} Q${x + w} ${y + h} ${x + w - 2.5} ${y + h} H${x + 2.5} Q${x} ${y + h} ${x} ${y + h - 2.5} V${y + 2.5} Q${x} ${y} ${x + 2.5} ${y} Z`
            }
            fill={PAPER}
            stroke={INK}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />

          {!empty && (
            <g>
              {/* heading */}
              <rect x={x + pad} y={y + pad} width={innerW * 0.55} height={5} rx={2.5} fill={INK} />
              {/* picture block */}
              <g>
                <rect
                  x={x + pad}
                  y={y + pad + 12}
                  width={imgW}
                  height={imgH}
                  rx={3}
                  fill={color ? "oklch(0.86 0.07 235)" : SHADE}
                />
                <circle
                  cx={x + pad + imgW * 0.22}
                  cy={y + pad + 12 + imgH * 0.36}
                  r={Math.min(imgH, imgW) * 0.13}
                  fill={color ? "oklch(0.84 0.15 85)" : LINE}
                />
                <path
                  d={`M${x + pad} ${y + pad + 12 + imgH} L${x + pad + imgW * 0.38} ${y + pad + 12 + imgH * 0.5} L${x + pad + imgW * 0.6} ${y + pad + 12 + imgH * 0.75} L${x + pad + imgW * 0.78} ${y + pad + 12 + imgH * 0.42} L${x + pad + imgW} ${y + pad + 12 + imgH} Z`}
                  fill={color ? "oklch(0.62 0.13 155)" : LINE}
                />
              </g>
              {/* body copy */}
              {Array.from({ length: lines }).map((_, i) => (
                <rect
                  key={i}
                  x={textX}
                  y={textTop + i * 9}
                  width={i % 4 === 3 ? textW * 0.6 : textW}
                  height={3.5}
                  rx={1.75}
                  fill={LINE}
                />
              ))}
            </g>
          )}

          {doubleSided && (
            <g>
              {/* the folded corner shows the back has print too */}
              <path
                d={`M${x + w - fold} ${y} L${x + w - fold} ${y + fold} L${x + w} ${y + fold} Z`}
                fill={SHADE}
                stroke={INK}
                strokeWidth={1.75}
                strokeLinejoin="round"
              />
              <rect x={x + w - fold + 4} y={y + fold - 8} width={fold * 0.45} height={2.5} rx={1.25} fill={LINE} />
              <rect x={x + w - fold + 4} y={y + fold - 14} width={fold * 0.28} height={2.5} rx={1.25} fill={LINE} />
            </g>
          )}
        </svg>

        {!empty && copies > 1 && (
          <span
            key={`n-${copies}`}
            className="absolute top-1 right-1 rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground tabular-nums animate-in fade-in zoom-in-90 duration-200"
            aria-hidden="true"
          >
            ×{copies}
          </span>
        )}
      </div>
      <figcaption className="font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums">
        {spec.short} · {spec.mm}
      </figcaption>
    </figure>
  );
}

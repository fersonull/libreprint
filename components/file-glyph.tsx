import React from "react";

/** A small folded-corner sheet with the file's extension printed on it. */
export function FileGlyph({ fileName, className = "" }: { fileName: string; className?: string }) {
  const dot = fileName.lastIndexOf(".");
  const ext = (dot >= 0 ? fileName.slice(dot + 1) : "file").toUpperCase().slice(0, 4);
  const isImage = ["PNG", "JPG", "JPEG"].includes(ext);
  return (
    <span className={`relative inline-flex h-11 w-9 shrink-0 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 36 44" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M2 4a3 3 0 0 1 3-3h18l11 11v27a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" fill="var(--ill-paper)" stroke="var(--ill-line)" strokeWidth="1.5" />
        <path d="M23 1v8a3 3 0 0 0 3 3h8" stroke="var(--ill-line)" strokeWidth="1.5" />
      </svg>
      <span
        className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-[3px] px-1 font-mono text-[8.5px] font-bold leading-[13px] tracking-wide ${
          isImage
            ? "bg-accent text-foreground"
            : "bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900"
        }`}
      >
        {ext}
      </span>
    </span>
  );
}

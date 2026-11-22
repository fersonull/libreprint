"use client";

import { useState } from "react";
import { Check, CopyCheck, Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import type { PaperSize, Orientation, UploadFileItem } from "@/components/upload-form";
import { SegmentedToggle } from "./segmented-toggle";
import { PAPER_SPECS } from "./sheet-preview";

const MAX_COPIES = 50;

/**
 * Settings for one document. Every choice with 2–4 options is a segmented toggle,
 * so labels sit on one line and nothing hides inside a dropdown.
 */
export function PrintSettings({
  item,
  idPrefix,
  onChange,
  onApplyToAll,
  fileCount,
}: {
  item: UploadFileItem;
  idPrefix: string;
  onChange: (updates: Partial<UploadFileItem>) => void;
  onApplyToAll: () => void;
  fileCount: number;
}) {
  const { t } = useI18n();
  const [applied, setApplied] = useState(false);
  const id = (name: string) => `${idPrefix}-${name}-${item.id}`;
  const change = (updates: Partial<UploadFileItem>) => {
    setApplied(false);
    onChange(updates);
  };

  return (
    <FieldGroup className="gap-5">
      <FieldSet className="gap-2">
        <FieldLegend variant="label">{t("paper_size")}</FieldLegend>
        <SegmentedToggle<PaperSize>
          label={t("paper_size")}
          value={item.paperSize}
          onChange={(paperSize) => change({ paperSize })}
          options={(Object.keys(PAPER_SPECS) as PaperSize[]).map((size) => ({
            value: size,
            label: PAPER_SPECS[size].short,
          }))}
        />
      </FieldSet>

      <FieldSet className="gap-2">
        <FieldLegend variant="label">{t("orientation")}</FieldLegend>
        <SegmentedToggle<Orientation>
          label={t("orientation")}
          value={item.orientation}
          onChange={(orientation) => change({ orientation })}
          options={[
            { value: "portrait", label: t("portrait") },
            { value: "landscape", label: t("landscape") },
          ]}
        />
      </FieldSet>

      <FieldSet className="gap-2">
        <FieldLegend variant="label">{t("color_mode")}</FieldLegend>
        <SegmentedToggle<"bw" | "color">
          label={t("color_mode")}
          value={item.colorMode}
          onChange={(colorMode) => change({ colorMode })}
          options={[
            { value: "bw", label: t("bw") },
            { value: "color", label: t("color") },
          ]}
        />
      </FieldSet>

      <FieldSet className="gap-2">
        <FieldLegend variant="label">{t("duplex")}</FieldLegend>
        <SegmentedToggle<"single" | "double">
          label={t("duplex")}
          value={item.doubleSided ? "double" : "single"}
          onChange={(v) => change({ doubleSided: v === "double" })}
          options={[
            { value: "single", label: t("single_sided") },
            { value: "double", label: t("double_sided") },
          ]}
        />
      </FieldSet>

      <div className="grid grid-cols-1 gap-5 min-[400px]:grid-cols-2">
        <FieldSet className="gap-2">
          <FieldLegend variant="label">{t("copies")}</FieldLegend>
          <div className="flex h-[46px] items-center rounded-md border border-input shadow-xs sm:h-9">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("fewer_copies")}
              onClick={() => change({ copies: Math.max(1, item.copies - 1) })}
              disabled={item.copies <= 1}
              className="h-full w-11 rounded-none first:rounded-l-md last:rounded-r-md sm:w-9"
            >
              <Minus />
            </Button>
            <output
              aria-live="polite"
              className="flex-1 text-center font-mono text-sm font-semibold text-foreground tabular-nums"
            >
              {item.copies}
            </output>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("more_copies")}
              onClick={() => change({ copies: Math.min(MAX_COPIES, item.copies + 1) })}
              disabled={item.copies >= MAX_COPIES}
              className="h-full w-11 rounded-none first:rounded-l-md last:rounded-r-md sm:w-9"
            >
              <Plus />
            </Button>
          </div>
        </FieldSet>

        <Field className="gap-2">
          <FieldLabel htmlFor={id("pages")}>{t("pages_to_print")}</FieldLabel>
          <Input
            id={id("pages")}
            value={item.pages}
            onChange={(e) => change({ pages: e.target.value })}
            placeholder={t("pages_placeholder")}
            className="h-11 sm:h-9"
          />
        </Field>
      </div>

      <Field className="gap-2">
        <FieldLabel htmlFor={id("notes")}>{t("notes_label")}</FieldLabel>
        <Textarea
          id={id("notes")}
          value={item.notes}
          onChange={(e) => change({ notes: e.target.value })}
          placeholder={t("notes_placeholder")}
          maxLength={120}
          rows={2}
          className="min-h-20 resize-none"
        />
      </Field>

      {fileCount > 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onApplyToAll();
            setApplied(true);
          }}
          className="h-11 sm:h-9"
        >
          {applied ? <Check data-icon="inline-start" /> : <CopyCheck data-icon="inline-start" />}
          {applied ? t("applied_to_all") : t("apply_to_all")}
        </Button>
      )}
    </FieldGroup>
  );
}

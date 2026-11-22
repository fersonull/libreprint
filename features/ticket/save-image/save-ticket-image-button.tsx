"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import { TicketImageTemplate, type TicketImageData } from "./ticket-image-template";
import { deliverImage } from "./deliver-image";

type Props = Omit<TicketImageData, "trackUrl">;

/** Renders the ticket image template off screen only while saving, then captures it. */
export function SaveTicketImageButton(props: Props) {
  const { t } = useI18n();
  const templateRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    if (state !== "saving") return;
    let live = true;
    (async () => {
      try {
        await document.fonts.ready;
        const dataUrl = await toPng(templateRef.current!, { pixelRatio: 3 });
        if (!live) return;
        await deliverImage(dataUrl, `${props.ticketCode}.png`, props.ticketCode);
        if (live) setState("idle");
      } catch (error) {
        console.error("Failed to save ticket image:", error);
        if (!live) return;
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    })();
    return () => {
      live = false;
    };
  }, [state, props.ticketCode]);

  return (
    <>
      <Button variant="ghost" className="h-11 text-muted-foreground" onClick={() => setState("saving")} disabled={state === "saving"}>
        {state === "saving" ? <Spinner data-icon="inline-start" /> : <Download data-icon="inline-start" aria-hidden="true" />}
        {state === "error" ? t("save_image_failed") : t("save_image")}
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "error" ? t("save_image_failed") : ""}
      </span>
      {state === "saving" &&
        createPortal(
          // Off screen and hidden from assistive tech; it only exists to be captured.
          <div aria-hidden="true" inert className="pointer-events-none fixed top-0 left-[-10000px]">
            <TicketImageTemplate
              ref={templateRef}
              data={{ ...props, trackUrl: `${window.location.host}/ticket/${props.ticketCode}` }}
              labels={{
                heading: t("ticket_image_heading"),
                claimCode: t("claim_code"),
                documents: props.totalFiles === 1 ? t("document") : t("documents"),
                submitted: t("ticket_image_submitted"),
                howTo: t("ticket_image_howto"),
                steps: [t("ticket_image_step1"), t("ticket_image_step2"), t("ticket_image_step3")],
                track: t("ticket_image_track"),
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}

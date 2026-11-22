import type { Ref } from "react";
import { LibrePrintLogo } from "@/components/logo";

export interface TicketImageData {
  ticketCode: string;
  clientName: string;
  createdAt: number;
  totalFiles: number;
  /** Where the customer can follow the ticket, shown without the protocol. */
  trackUrl: string;
}

export interface TicketImageLabels {
  heading: string;
  claimCode: string;
  documents: string;
  submitted: string;
  howTo: string;
  steps: [string, string, string];
  track: string;
}

/**
 * The claim ticket as a saved image. Fixed light-paper colours (never the site
 * theme) so it reads the same in a photo gallery and at the counter.
 */
export function TicketImageTemplate({ ref, data, labels }: { ref: Ref<HTMLDivElement>; data: TicketImageData; labels: TicketImageLabels }) {
  const created = new Date(data.createdAt);
  const date = created.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const time = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div ref={ref} className="w-[420px] bg-[#ececec] p-6 font-sans text-[#18181b]">
      <div className="rounded-[22px] bg-white">
        <div className="flex items-center justify-between px-7 pt-6">
          <LibrePrintLogo size={26} variant="ink" />
          <span className="text-[12px] font-medium tracking-wide text-[#52525b] uppercase">{labels.heading}</span>
        </div>

        <div className="px-7 pt-7 pb-8 text-center">
          <p className="text-[13px] font-medium text-[#52525b]">{labels.claimCode}</p>
          <p className="mt-2 font-mono text-[56px] leading-none font-bold tracking-[-0.03em]">
            <span className="bg-[linear-gradient(transparent_58%,#fde68a_58%,#fde68a_92%,transparent_92%)] px-[0.1em]">
              {data.ticketCode}
            </span>
          </p>
          <p className="mt-5 text-[15px] text-[#52525b]">
            <span className="font-semibold text-[#18181b]">{data.clientName}</span>
            {" · "}
            {data.totalFiles} {labels.documents}
          </p>
          <p className="mt-1 font-mono text-[12px] text-[#52525b] tabular-nums">
            {labels.submitted} {date} · {time}
          </p>
        </div>

        {/* Tear line, with notches painted in the backdrop colour so they always sit on it. */}
        <div className="relative">
          <div className="mx-6 border-t-2 border-dashed border-[#d4d4d8]" />
          <span className="absolute top-1/2 -left-[13px] size-[26px] -translate-y-1/2 rounded-full bg-[#ececec]" />
          <span className="absolute top-1/2 -right-[13px] size-[26px] -translate-y-1/2 rounded-full bg-[#ececec]" />
        </div>

        <div className="px-7 pt-6 pb-7">
          <p className="text-[14px] font-semibold">{labels.howTo}</p>
          <ol className="mt-3 flex flex-col gap-2.5">
            {labels.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-snug text-[#3f3f46]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#18181b] font-mono text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-px">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl bg-[#f4f4f5] px-4 py-3">
            <p className="text-[11px] font-medium text-[#52525b]">{labels.track}</p>
            <p className="mt-0.5 font-mono text-[13px] font-semibold break-all">{data.trackUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

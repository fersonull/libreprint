import { Navbar } from "@/shared/components/navbar";
import { SubmitAnotherLink, TicketNotFound, TicketTracker } from "@/features/ticket";
import { headers } from "next/headers";
import { getTicketWithFiles, isCodeLookupLimited } from "@/shared/server/tickets";
import { getVapidPublicKey } from "@/shared/server/push";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const limited = isCodeLookupLimited(decodeURIComponent(id), await headers());
  const found = limited ? null : getTicketWithFiles(id);

  if (!found) {
    return (
      <div className="flex min-h-screen flex-col text-foreground">
        <Navbar currentPath="/ticket" />
        <main className="w-full flex-1 px-4">
          <TicketNotFound code={decodeURIComponent(id)} limited={limited} />
        </main>
      </div>
    );
  }

  const { ticket, files } = found;

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Navbar currentPath="/ticket" />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-5 pb-12 sm:pt-8">
        <div className="mb-4">
          <SubmitAnotherLink />
        </div>
        <TicketTracker initialTicket={ticket} initialFiles={files} vapidPublicKey={getVapidPublicKey()} />
      </main>
    </div>
  );
}

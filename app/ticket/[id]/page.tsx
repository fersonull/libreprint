import { Navbar } from "@/components/navbar";
import { TicketTracker } from "@/features/ticket/ticket-tracker";
import { TicketNotFound, SubmitAnotherLink } from "@/features/ticket/ticket-not-found";
import { getTicketWithFiles } from "@/features/staff/queries";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const found = getTicketWithFiles(id);

  if (!found) {
    return (
      <div className="flex min-h-screen flex-col text-foreground">
        <Navbar currentPath="/ticket" />
        <main className="w-full flex-1 px-4">
          <TicketNotFound code={decodeURIComponent(id)} />
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
        <TicketTracker initialTicket={ticket} initialFiles={files} />
      </main>
    </div>
  );
}

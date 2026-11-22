import { Navbar } from "@/components/navbar";
import { TicketTracker } from "@/components/ticket-tracker";
import { TicketNotFound, SubmitAnotherLink } from "@/components/ticket-not-found";
import { getDb, Ticket, PrintFile } from "@/lib/db";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const ticket = db
    .prepare("SELECT * FROM tickets WHERE id = ? OR UPPER(ticket_code) = UPPER(?)")
    .get(id, id) as Ticket | undefined;

  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col text-foreground">
        <Navbar currentPath="/ticket" />
        <main className="w-full flex-1 px-4">
          <TicketNotFound code={decodeURIComponent(id)} />
        </main>
      </div>
    );
  }

  const files = db
    .prepare("SELECT * FROM print_files WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id) as PrintFile[];

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

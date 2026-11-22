import { StaffSidebarLayout } from "@/components/staff-sidebar";
import { StaffTicketDetail } from "@/components/staff-ticket-detail";
import { TicketNotFound } from "@/components/ticket-not-found";
import { getDb, Ticket, PrintFile } from "@/lib/db";

export default async function StaffTicketDetailPage({
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
      <StaffSidebarLayout>
        <TicketNotFound code={decodeURIComponent(id)} backHref="/staff/dashboard/print-desk" backLabel="Back to print desk" />
      </StaffSidebarLayout>
    );
  }

  const files = db
    .prepare("SELECT * FROM print_files WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id) as PrintFile[];

  return (
    <StaffSidebarLayout>
      <StaffTicketDetail initialTicket={ticket} initialFiles={files} />
    </StaffSidebarLayout>
  );
}

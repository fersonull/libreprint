import { TicketNotFound } from "@/features/ticket/ticket-not-found";
import { getTicketWithFiles } from "@/features/staff/queries";
import { TicketWorkspace } from "@/features/staff/ticket/ticket-workspace";

export default async function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = getTicketWithFiles(id);

  if (!found) {
    return <TicketNotFound code={decodeURIComponent(id)} backHref="/staff/dashboard/print-desk" backLabel="Back to print desk" />;
  }
  // key: a different ticket gets fresh client state.
  return <TicketWorkspace key={found.ticket.id} ticket={found.ticket} initialFiles={found.files} />;
}

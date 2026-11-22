import { TicketNotFound } from "@/features/ticket";
import { getTicketWithFiles } from "@/shared/server/tickets";
import { TicketWorkspace } from "@/features/staff";

export default async function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = getTicketWithFiles(id);

  if (!found) {
    return <TicketNotFound code={decodeURIComponent(id)} backHref="/staff/dashboard/print-desk" backLabel="Back to print desk" />;
  }
  // key: a different ticket gets fresh client state.
  return <TicketWorkspace key={found.ticket.id} ticket={found.ticket} initialFiles={found.files} />;
}
